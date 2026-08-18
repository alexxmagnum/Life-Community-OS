import { NextResponse } from "next/server";
import type { CreateLocationInput, Location } from "@life-community-os/types";
import {
  getLocationServer,
  removeLocationServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import {
  requireAdministrator,
  resolveRequestActor,
} from "@/lib/auth/request-actor";
import { resolveTenantPublicId } from "@/lib/tenant/ids";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

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
  return NextResponse.json({ location });
}

export async function PATCH(request: Request, { params }: Params) {
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || (!requireAdministrator(actor) && actor.role !== "moderator")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      actor.tenantSlug,
  );

  const existing = await getLocationServer(tenantId, id);
  if (!existing) {
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
  const actor = await resolveRequestActor(request);
  if (!requireAdministrator(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      actor.tenantSlug,
  );
  const existing = await getLocationServer(tenantId, id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await removeLocationServer(tenantId, id);
  return NextResponse.json({ ok: true, location: existing as Location });
}
