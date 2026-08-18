import { NextResponse } from "next/server";
import type { CreateLocationInput } from "@life-community-os/types";
import {
  listLocationsServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import { resolveTenantPublicId } from "@/lib/tenant/ids";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      "life-panoramica",
  );
  const locations = await listLocationsServer(tenantId);
  const visibility = url.searchParams.get("visibility");
  const filtered =
    visibility === "map"
      ? locations.filter(
          (item) =>
            item.visibility === "public" || item.visibility === "members",
        )
      : locations;
  return NextResponse.json({ tenantId, locations: filtered });
}

export async function POST(request: Request) {
  let body: CreateLocationInput;
  try {
    body = (await request.json()) as CreateLocationInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const location = await saveLocationServer({
      ...body,
      tenantId: resolveTenantPublicId(
        body.tenantId ||
          resolveRequestTenantSlug(request) ||
          "life-panoramica",
      ),
    });
    return NextResponse.json({ location }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
