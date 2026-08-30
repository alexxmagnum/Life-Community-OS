import { NextResponse } from "next/server";
import { LifeMapQueryService } from "@/lib/life-map/life-map-query";
import {
  actorCanReadLifeMapLife,
  actorCanViewLifeMap,
} from "@/lib/life-map/permissions";
import { ensureLifeMapTenantPacksRegistered } from "@/lib/life-map-tenant-registry";
import { getTenantPack } from "@/lib/tenant/registry";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

function readBounds(url: URL) {
  const north = Number(url.searchParams.get("north"));
  const south = Number(url.searchParams.get("south"));
  const east = Number(url.searchParams.get("east"));
  const west = Number(url.searchParams.get("west"));
  if (
    ![north, south, east, west].every((value) => Number.isFinite(value))
  ) {
    return undefined;
  }
  return { north, south, east, west };
}

export async function GET(request: Request) {
  ensureLifeMapTenantPacksRegistered();
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!actorCanViewLifeMap(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({
      territory: { tenantId: bound.tenantId, territoryId: null },
      objects: [],
      locations: [],
      feedItems: [],
    });
  }
  const zoomRaw = url.searchParams.get("zoom");
  const zoom = zoomRaw != null ? Number(zoomRaw) : undefined;
  const includeLife = actorCanReadLifeMapLife(actor);
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const pack = getTenantPack(bound.tenantId);
  const result = await LifeMapQueryService.list({
    tenantId: bound.tenantId,
    territoryId,
    zoom: Number.isFinite(zoom) ? zoom : undefined,
    viewport: readBounds(url),
    includeLife,
    membershipLocations: includeLife,
    productCapabilities: pack?.productCapabilities,
    permissions: actor.permissions,
    scope,
  });
  return NextResponse.json(result);
}
