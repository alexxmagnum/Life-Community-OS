import { NextResponse } from "next/server";
import type { CreateLocationInput } from "@life-community-os/types";
import {
  listLocationsServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
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
  const { ensureServerTenantLocations } = await import(
    "@/lib/location/ensure-server-tenant-locations"
  );
  await ensureServerTenantLocations(tenantId);
  const locations = await listLocationsServer(tenantId);
  const visibility = url.searchParams.get("visibility");
  const scoped = locations.filter((item) => item.tenantId === tenantId);
  const byTrust = actor.authenticated && actor.hasMembership
    ? actor.role === "administrator" || actor.role === "moderator"
      ? scoped
      : scoped.filter(
          (item) =>
            item.visibility === "public" || item.visibility === "members",
        )
    : scoped.filter((item) => item.visibility === "public");
  const filtered =
    visibility === "map"
      ? byTrust.filter(
          (item) =>
            item.visibility === "public" || item.visibility === "members",
        )
      : byTrust;
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
