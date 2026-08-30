import { NextResponse } from "next/server";
import type { CreateLocationInput } from "@life-community-os/types";
import {
  listLocationsServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

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
  const territory = resolveActiveTerritoryContext({
    tenantId,
    actorTerritoryId: actor.territoryId,
    queryTerritoryId: url.searchParams.get("territoryId"),
  });
  if ("error" in territory) return territory.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const { ensureServerTenantLocations } = await import(
    "@/lib/location/ensure-server-tenant-locations"
  );
  await ensureServerTenantLocations(tenantId);
  const locations = await listLocationsServer(tenantId, scope);
  const visibility = url.searchParams.get("visibility");
  const scoped = filterForActiveTerritory(
    locations.filter((item) => item.tenantId === tenantId),
    territory.context.territoryId,
  );
  const byTrust = actor.authenticated && actor.hasMembership
    ? actor.role === "administrator" || actor.role === "moderator"
      ? scoped
      : scoped.filter(
          (item) =>
            item.visibility === "public" ||
            item.visibility === "members" ||
            item.ownerId === actor.personId,
        )
    : scoped.filter((item) => item.visibility === "public");
  const filtered =
    visibility === "map"
      ? byTrust.filter(
          (item) =>
            item.visibility === "public" || item.visibility === "members",
        )
      : byTrust;
  return NextResponse.json({
    tenantId,
    territoryId: territory.context.territoryId,
    locations: filtered,
  });
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
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: gated.actor.territoryId,
    queryTerritoryId:
      typeof body === "object" && body && "territoryId" in body
        ? (body as CreateLocationInput).territoryId
        : null,
  });
  if ("error" in territory) return territory.error;

  try {
    const { persistenceScopeFromRequest } = await import(
      "@/lib/data/database-access"
    );
    const location = await saveLocationServer(
      {
        ...body,
        tenantId: bound.tenantId,
        ownerId: gated.actor.personId ?? undefined,
        createdBy: gated.actor.personId ?? undefined,
        territoryId: resolveStampTerritoryId({
          tenantId: bound.tenantId,
          explicit: body.territoryId,
          inherited: gated.actor.territoryId,
        }),
      },
      persistenceScopeFromRequest(request, gated.actor.personId),
    );
    return NextResponse.json({ location }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
