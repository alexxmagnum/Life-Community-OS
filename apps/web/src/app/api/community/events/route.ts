import { NextResponse } from "next/server";
import {
  actorCanCreateEvent,
  actorCanViewCommunity,
} from "@/lib/community/permissions";
import {
  createCommunityEvent,
  createCommunityNotification,
  listCommunityEvents,
} from "@/lib/community/server-community-repository";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

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
  });
}

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
  const event = await createCommunityEvent({
    tenantId: bound.tenantId,
    authorPersonId: gated.actor.personId,
    authorDisplayName:
      gated.actor.currentUser.displayName?.trim() ||
      gated.actor.currentUser.email?.split("@")[0] ||
      "Vecino",
    title,
    description: body.description,
    startsAt,
    locationLabel: body.locationLabel,
    territoryId: resolveStampTerritoryId({
      tenantId: bound.tenantId,
      inherited: gated.actor.territoryId,
    }),
    scope,
  });
  await createCommunityNotification({
    tenantId: bound.tenantId,
    recipientPersonId: gated.actor.personId,
    kind: "event_created",
    title: "Evento publicado",
    body: event.title,
    entityType: "event",
    entityId: event.id,
    createdBy: gated.actor.personId,
    scope,
  });
  return NextResponse.json({ event }, { status: 201 });
}
