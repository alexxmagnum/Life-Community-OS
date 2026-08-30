import { NextResponse } from "next/server";
import { isResourceCategory } from "@life-community-os/types";
import {
  actorCanCreateResource,
  actorCanViewResources,
  resourceVisibleToActor,
} from "@/lib/reservations/permissions";
import {
  createResourceServer,
  listResourcesServer,
} from "@/lib/reservations/server-reservations-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewResources(actor)) {
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
  const category = url.searchParams.get("category")?.trim();
  const all = await listResourcesServer(bound.tenantId, scope);
  const resources = filterForActiveTerritory(all, territory.context.territoryId).filter(
    (item) => {
    if (item.tenantId !== bound.tenantId) return false;
    if (!resourceVisibleToActor(actor, item)) return false;
    if (category && item.category !== category) return false;
    return true;
  });
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: territory.context.territoryId,
    resources,
  });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;

  let body: {
    tenantId?: string;
    name?: string;
    description?: string;
    category?: string;
    location?: string;
    areaLabel?: string;
    locationId?: string;
    images?: string[];
    bookingRules?: string[];
    slotMinutes?: number;
    capacity?: number;
    requiresApproval?: boolean;
    linkedResourceId?: string;
    scheduleStartsAt?: string;
    scheduleEndsAt?: string;
    organizerName?: string;
    createdBy?: string;
    ownerId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const category = body.category?.trim() ?? "";
  if (!isResourceCategory(category)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (!actorCanCreateResource(gated.actor, category) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const name = body.name?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  if (!name || !description) {
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
  const resource = await createResourceServer({
    tenantId: bound.tenantId,
    createdBy: gated.actor.personId,
    name,
    description,
    category,
    location: body.location,
    areaLabel: body.areaLabel,
    locationId: body.locationId,
    images: body.images,
    bookingRules: body.bookingRules,
    slotMinutes: body.slotMinutes,
    capacity: body.capacity,
    requiresApproval: body.requiresApproval,
    linkedResourceId: body.linkedResourceId,
    scheduleStartsAt: body.scheduleStartsAt,
    scheduleEndsAt: body.scheduleEndsAt,
    organizerName:
      body.organizerName ??
      gated.actor.currentUser.displayName ??
      gated.actor.currentUser.email?.split("@")[0] ??
      "Vecino",
    territoryId: resolveStampTerritoryId({
      tenantId: bound.tenantId,
      inherited: gated.actor.territoryId,
    }),
    scope,
  });
  return NextResponse.json({ resource }, { status: 201 });
}
