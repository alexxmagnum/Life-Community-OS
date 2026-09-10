import { NextResponse } from "next/server";
import {
  actorCanCreateEvent,
  actorCanViewCommunity,
} from "@/lib/community/permissions";
import { listCommunityEvents } from "@/lib/community/server-community-repository";
import { createExperienceServer } from "@/lib/experiences/server-experience-repository";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

/**
 * GET — compatibility read of legacy CommunityEvent rows (still present until full cutover).
 * Prefer Experience(kind=event) via /api/experiences?kind=event for product surfaces.
 */
export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanViewCommunity(actor)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: actor.territoryId,
    queryTerritoryId: url.searchParams.get("territoryId"),
  });
  if ("error" in territory) return territory.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const events = filterForActiveTerritory(
    await listCommunityEvents(bound.tenantId, scope),
    territory.context.territoryId,
  );
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: territory.context.territoryId,
    events,
    deprecated: true,
    prefer: "/api/experiences?kind=event",
  });
}

/**
 * POST — DEPRECATED write path.
 * Does NOT create CommunityEvent (no dual-write).
 * Creates Experience(kind=event) only and returns a compatibility projection.
 */
export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateEvent(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: {
    title?: string;
    description?: string;
    startsAt?: string;
    locationLabel?: string;
    tenantId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const title = body.title?.trim() ?? "";
  const startsAt = body.startsAt?.trim() ?? "";
  if (!title || !startsAt) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const description = (body.description ?? "").trim() || title;
  try {
    const experience = await createExperienceServer({
      tenantId: bound.tenantId,
      ownerPersonId: gated.actor.personId,
      title,
      description,
      kind: "event",
      startsAt,
      location: body.locationLabel,
      territoryId: resolveStampTerritoryId({
        tenantId: bound.tenantId,
        inherited: gated.actor.territoryId,
      }),
      publishToCommunity: true,
      authorDisplayName:
        gated.actor.currentUser.displayName?.trim() ||
        gated.actor.currentUser.email?.split("@")[0] ||
        "Vecino",
      scope,
    });
    const compatEvent = {
      id: experience.id,
      tenantId: experience.tenantId,
      territoryId: experience.territoryId,
      authorPersonId: experience.ownerPersonId,
      authorDisplayName:
        gated.actor.currentUser.displayName?.trim() ||
        gated.actor.currentUser.email?.split("@")[0] ||
        "Vecino",
      title: experience.title,
      description: experience.description,
      startsAt: experience.startsAt,
      endsAt: experience.endsAt,
      locationLabel: experience.location,
      status: experience.status === "draft" ? "draft" : "published",
      createdBy: experience.createdBy,
      createdAt: experience.createdAt,
      updatedAt: experience.updatedAt,
    };
    const response = NextResponse.json(
      {
        event: compatEvent,
        experience,
        deprecated: true,
        prefer: "/api/experiences",
        message:
          "POST /api/community/events is deprecated. Creates Experience(kind=event) only.",
      },
      { status: 201 },
    );
    response.headers.set("Deprecation", "true");
    response.headers.set("Link", '</api/experiences>; rel="successor-version"');
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : "error";
    if (code === "missing_territory" || code === "forbidden") {
      return NextResponse.json({ error: code }, { status: 403 });
    }
    return NextResponse.json({ error: code }, { status: 400 });
  }
}
