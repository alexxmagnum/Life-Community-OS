import { NextResponse } from "next/server";
import type { CreateLocationInput, Location } from "@life-community-os/types";
import {
  getLocationServer,
  removeLocationServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import {
  requireAdministratorMutation,
  requireModeratorMutation,
} from "@/lib/auth/mutation-gate";
import { resolveTenantPublicId } from "@/lib/tenant/ids";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      "life-panoramica",
  );
  const location = await getLocationServer(tenantId, id);
  if (!location) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // Isolation: never return a location that belongs to another tenant.
  if (location.tenantId !== tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ location });
}

export async function PATCH(request: Request, { params }: Params) {
  const gated = await requireModeratorMutation(request);
  if ("error" in gated) return gated.error;

  const { id } = await params;
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const tenantId = bound.tenantId;

  const existing = await getLocationServer(tenantId, id);
  if (!existing || existing.tenantId !== tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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
    name: body.name?.trim() || existing.name,
    address: body.address?.trim() || existing.address,
    category: body.category?.trim() || existing.category,
    latitude: body.latitude ?? existing.latitude,
    longitude: body.longitude ?? existing.longitude,
    type: body.type ?? existing.type,
    visibility: body.visibility ?? existing.visibility,
  };

  try {
    const location = await saveLocationServer(next);
    return NextResponse.json({ location });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const gated = await requireAdministratorMutation(request);
  if ("error" in gated) return gated.error;

  const { id } = await params;
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const tenantId = bound.tenantId;

  const existing = await getLocationServer(tenantId, id);
  if (!existing || existing.tenantId !== tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await removeLocationServer(tenantId, id);
  return NextResponse.json({ ok: true, location: existing as Location });
}
