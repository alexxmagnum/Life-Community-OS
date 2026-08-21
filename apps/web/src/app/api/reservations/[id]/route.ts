import { NextResponse } from "next/server";
import {
  isReservationStatus,
  type ReservationStatus,
} from "@life-community-os/types";
import {
  actorCanCancelReservation,
  actorCanModifyReservation,
  actorCanViewResources,
  actorOwnsReservation,
} from "@/lib/reservations/permissions";
import {
  getReservationServer,
  updateReservationServer,
} from "@/lib/reservations/server-reservations-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
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
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const reservation = await getReservationServer(bound.tenantId, id, scope);
  if (!reservation || !actorOwnsReservation(actor, reservation)) {
    if (reservation && actorCanCancelReservation(actor, reservation)) {
      return NextResponse.json({ reservation });
    }
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ reservation });
}

export async function PATCH(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  const { id } = await params;
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const existing = await getReservationServer(bound.tenantId, id, scope);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!actorCanModifyReservation(gated.actor, existing)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    status?: string;
    date?: string;
    start?: string;
    end?: string;
    createdBy?: string;
    ownerId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.createdBy || body.ownerId) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }
  if (body.status && !isReservationStatus(body.status)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (body.status === "cancelled" && !actorCanCancelReservation(gated.actor, existing)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const reservation = await updateReservationServer({
      tenantId: bound.tenantId,
      reservationId: id,
      status: body.status as ReservationStatus | undefined,
      date: body.date,
      start: body.start,
      end: body.end,
      scope,
    });
    if (!reservation) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ reservation });
  } catch (error) {
    const code = error instanceof Error ? error.message : "update_failed";
    if (code === "owner_immutable") {
      return NextResponse.json({ error: code }, { status: 403 });
    }
    if (code === "slot_unavailable") {
      return NextResponse.json({ error: code }, { status: 409 });
    }
    return NextResponse.json({ error: code }, { status: 400 });
  }
}
