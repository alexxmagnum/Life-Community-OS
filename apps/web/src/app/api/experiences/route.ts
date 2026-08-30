import { NextResponse } from "next/server";
import {
  isExperienceLifecycleStatus,
  type ExperienceLifecycleStatus,
} from "@life-community-os/types";
import {
  actorCanCreateExperience,
  actorCanViewExperiences,
  experienceVisibleToActor,
} from "@/lib/experiences/permissions";
import {
  createExperienceServer,
  listExperiencesServer,
} from "@/lib/experiences/server-experience-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

function experienceError(error: unknown): NextResponse {
  const code = error instanceof Error ? error.message : "error";
  if (code === "unauthorized") {
    return NextResponse.json({ error: code }, { status: 401 });
  }
  if (
    code === "forbidden" ||
    code === "cross_territory_forbidden" ||
    code === "cross_tenant_forbidden"
  ) {
    return NextResponse.json({ error: code }, { status: 403 });
  }
  if (code === "not_found") {
    return NextResponse.json({ error: code }, { status: 404 });
  }
  if (code === "resource_territory_mismatch" || code === "resource_not_found") {
    return NextResponse.json({ error: code }, { status: 409 });
  }
  return NextResponse.json({ error: code }, { status: 400 });
}

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewExperiences(actor)) {
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
  const all = await listExperiencesServer(bound.tenantId, scope, {
    territoryId: territory.context.territoryId,
  });
  const status = url.searchParams.get("status")?.trim();
  const category = url.searchParams.get("category")?.trim().toLowerCase();
  const items = filterForActiveTerritory(
    all,
    territory.context.territoryId,
  ).filter((item) => {
    if (!experienceVisibleToActor(actor, item)) return false;
    if (status && item.status !== status) return false;
    if (category && item.category.toLowerCase() !== category) return false;
    return true;
  });
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: territory.context.territoryId,
    experiences: items,
  });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateExperience(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    territoryId?: string;
    title?: string;
    description?: string;
    category?: string;
    status?: string;
    resourceId?: string;
    startsAt?: string;
    endsAt?: string;
    location?: string;
    capacity?: number;
    publishToCommunity?: boolean;
    ownerId?: string;
    ownerPersonId?: string;
    createdBy?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const startsAt = body.startsAt?.trim() ?? "";
  if (!title || !description || !startsAt) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (body.status && !isExperienceLifecycleStatus(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: gated.actor.territoryId,
    queryTerritoryId: body.territoryId,
  });
  if ("error" in territory) return territory.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  try {
    const experience = await createExperienceServer({
      tenantId: bound.tenantId,
      ownerPersonId: gated.actor.personId,
      title,
      description,
      category: body.category,
      status: body.status as ExperienceLifecycleStatus | undefined,
      resourceId: body.resourceId,
      startsAt,
      endsAt: body.endsAt,
      location: body.location,
      capacity: body.capacity,
      territoryId: resolveStampTerritoryId({
        tenantId: bound.tenantId,
        explicit: territory.context.territoryId,
        inherited: gated.actor.territoryId,
      }),
      publishToCommunity: body.publishToCommunity === true,
      authorDisplayName:
        gated.actor.currentUser.displayName?.trim() ||
        gated.actor.currentUser.email?.split("@")[0] ||
        "Vecino",
      ownerPersonIdFromClient: body.ownerId ?? body.ownerPersonId,
      scope,
    });
    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    return experienceError(error);
  }
}
