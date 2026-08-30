import { NextResponse } from "next/server";
import { getPlatformSpatialAssetRegistry } from "@life-community-os/assets";
import {
  actorCanAccessSection,
  actorCanAssignTerritoryAsset,
} from "@/lib/admin/permissions";
import {
  assignTerritorySpatialAssetServer,
  listTerritoryAssetAssignmentsServer,
  recordAdminAudit,
} from "@/lib/admin/server-admin-repository";
import { ensureLifeMapTenantPacksRegistered } from "@/lib/life-map-tenant-registry";
import { resolveLifeMapTenantPack } from "@/lib/life-map-tenant-pack";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanAccessSection(actor, "territory")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: new URL(request.url).searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  ensureLifeMapTenantPacksRegistered();
  const pack = resolveLifeMapTenantPack(bound.tenantId);
  const objects = pack?.listTerritoryObjects?.() ?? [];
  const assignments = await listTerritoryAssetAssignmentsServer(
    bound.tenantId,
    scope,
  );
  const assets = getPlatformSpatialAssetRegistry().list().map((asset) => ({
    id: asset.id,
    name: asset.name,
    category: asset.category,
  }));
  return NextResponse.json({ objects, assignments, assets });
}

export async function PATCH(request: Request) {
  const { requireAdministratorMutation } = await import("@/lib/auth/mutation-gate");
  const gated = await requireAdministratorMutation(request);
  if ("error" in gated) return gated.error;
  if (!actorCanAssignTerritoryAsset(gated.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: {
    tenantId?: string;
    territoryObjectId?: string;
    spatialAssetId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const objectId = body.territoryObjectId?.trim();
  const spatialAssetId = body.spatialAssetId?.trim();
  if (!objectId || !spatialAssetId) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!getPlatformSpatialAssetRegistry().has(spatialAssetId)) {
    return NextResponse.json({ error: "unknown_asset" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  ensureLifeMapTenantPacksRegistered();
  const pack = resolveLifeMapTenantPack(bound.tenantId);
  const objects = pack?.listTerritoryObjects?.() ?? [];
  if (!objects.some((item) => item.id === objectId)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const assignment = await assignTerritorySpatialAssetServer({
    tenantId: bound.tenantId,
    territoryObjectId: objectId,
    spatialAssetId,
    actor: gated.actor,
    scope,
  });
  await recordAdminAudit({
    actor: gated.actor,
    action: "territory.assign_asset",
    entityType: "territory_object",
    entityId: objectId,
    metadata: { spatialAssetId },
    scope,
  });
  return NextResponse.json({ assignment });
}
