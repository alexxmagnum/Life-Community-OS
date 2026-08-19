import { NextResponse } from "next/server";
import type { CreateLocationInput, Location } from "@life-community-os/types";
import {
  getLocationServer,
  removeLocationServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import { requireMutationActor } from "@/lib/auth/mutation-gate";
import { persistenceScopeFromRequest } from "@/lib/data/database-access";
import {
  canDeleteLocation,
  canMutateLocation,
} from "@/lib/location/location-ownership";
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
  const url = new URL(request.url);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const tenantId = bound.tenantId;
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const location = await getLocationServer(tenantId, id, scope);
  if (!location) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (location.tenantId !== tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (location.visibility === "private") {
    const privileged =
      actor.role === "administrator" || actor.role === "moderator";
    if (!privileged && location.ownerId !== actor.personId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }
  if (location.visibility === "members" && !actor.hasMembership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ location });
}

export async function PATCH(request: Request, { params }: Params) {
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;

  const { id } = await params;
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const tenantId = bound.tenantId;
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);

  const existing = await getLocationServer(tenantId, id, scope);
  if (!existing || existing.tenantId !== tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!canMutateLocation(gated.actor, existing)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: Partial<CreateLocationInput>;
  try {
    body = (await request.json()) as Partial<CreateLocationInput>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const next: CreateLocationInput = {
    ...existing,
    ...body,
    id: existing.id,
    tenantId,
    ownerId: existing.ownerId,
    createdBy: existing.createdBy,
    name: body.name?.trim() || existing.name,
    address: body.address?.trim() || existing.address,
    category: body.category?.trim() || existing.category,
    latitude: body.latitude ?? existing.latitude,
    longitude: body.longitude ?? existing.longitude,
    type: body.type ?? existing.type,
    visibility: body.visibility ?? existing.visibility,
  };

  try {
    const location = await saveLocationServer(next, scope);
    return NextResponse.json({ location });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;

  const { id } = await params;
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const tenantId = bound.tenantId;
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);

  const existing = await getLocationServer(tenantId, id, scope);
  if (!existing || existing.tenantId !== tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!canDeleteLocation(gated.actor, existing)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await removeLocationServer(tenantId, id, scope);
  return NextResponse.json({ ok: true, location: existing as Location });
}
