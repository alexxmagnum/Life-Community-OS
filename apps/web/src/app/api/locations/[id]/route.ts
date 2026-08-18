import { NextResponse } from "next/server";
import {
  getLocationServer,
  removeLocationServer,
} from "@/lib/location/server-location-repository";
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

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      "life-panoramica",
  );
  await removeLocationServer(tenantId, id);
  return NextResponse.json({ ok: true });
}
