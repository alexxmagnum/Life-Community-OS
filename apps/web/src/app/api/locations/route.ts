import { NextResponse } from "next/server";
import type { CreateLocationInput } from "@life-community-os/types";
import {
  listLocationsServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import { resolveTenantPublicId } from "@/lib/tenant/ids";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      "life-panoramica",
  );
  const { ensureServerTenantLocations } = await import(
    "@/lib/location/ensure-server-tenant-locations"
  );
  await ensureServerTenantLocations(tenantId);
  const locations = await listLocationsServer(tenantId);
  const visibility = url.searchParams.get("visibility");
  const scoped = locations.filter((item) => item.tenantId === tenantId);
  const filtered =
    visibility === "map"
      ? scoped.filter(
          (item) =>
            item.visibility === "public" || item.visibility === "members",
        )
      : scoped;
  return NextResponse.json({ tenantId, locations: filtered });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;

  let body: CreateLocationInput;
  try {
    body = (await request.json()) as CreateLocationInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;

  try {
    const location = await saveLocationServer({
      ...body,
      tenantId: bound.tenantId,
    });
    return NextResponse.json({ location }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
