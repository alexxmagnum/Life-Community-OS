import { NextResponse } from "next/server";
import {
  actorCanReserveResource,
  actorCanViewResources,
  actorOwnsReservation,
  isReservationsStaff,
} from "@/lib/reservations/permissions";
import {
  createReservationServer,
  listReservationsServer,
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
  const all = await listReservationsServer(bound.tenantId, scope);
  const mineOnly = url.searchParams.get("mine") !== "0";
  const reservations = filterForActiveTerritory(
    all,
    territory.context.territoryId,
  ).filter((item) => {
    if (item.tenantId !== bound.tenantId) return false;
    if (isReservationsStaff(actor.role) && !mineOnly) return true;
    return actorOwnsReservation(actor, item);
  });
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: territory.context.territoryId,
    reservations,
  });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanReserveResource(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    resourceId?: string;
    date?: string;
    start?: string;
    end?: string;
    startTime?: string;
    endTime?: string;
    participantCount?: number;
    createdBy?: string;
    ownerId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const resourceId = body.resourceId?.trim() ?? "";
  const date = body.date?.trim() ?? "";
  const start = body.start?.trim() ?? body.startTime?.trim() ?? "";
  const end = body.end?.trim() ?? body.endTime?.trim() ?? "";
  if (!resourceId || !date || !start || !end) {
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
  try {
    const reservation = await createReservationServer({
      tenantId: bound.tenantId,
      createdBy: gated.actor.personId,
      resourceId,
      date,
      start,
      end,
      participantCount: body.participantCount,
      territoryId: resolveStampTerritoryId({
        tenantId: bound.tenantId,
        inherited: gated.actor.territoryId,
      }),
      scope,
    });
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "reserve_failed";
    if (code === "resource_not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (code === "cross_territory_forbidden") {
      return NextResponse.json({ error: code }, { status: 403 });
    }
    if (code === "slot_unavailable" || code === "resource_not_bookable") {
      return NextResponse.json({ error: code }, { status: 409 });
    }
    return NextResponse.json({ error: code }, { status: 400 });
  }
}
