import { NextResponse } from "next/server";
import {
  listEntityMediaServer,
  MediaDeniedError,
} from "@/lib/media/server-media-repository";
import { mediaErrorResponse } from "@/lib/media/http";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.hasMembership) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: url.searchParams.get("tenantId"),
    actorTenantSlug: actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: actor.territoryId,
    queryTerritoryId: url.searchParams.get("territoryId"),
  });
  if ("error" in territory) return territory.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  try {
    const items = await listEntityMediaServer({
      tenantId: bound.tenantId,
      actor,
      entityType: url.searchParams.get("entityType") ?? undefined,
      entityId: url.searchParams.get("entityId") ?? undefined,
      scope,
    });
    return NextResponse.json({
      tenantId: bound.tenantId,
      territoryId: territory.context.territoryId,
      items: items.filter((item) =>
        filterForActiveTerritory(
          [item.asset],
          territory.context.territoryId,
        ).length > 0,
      ),
    });
  } catch (error) {
    if (error instanceof MediaDeniedError) return mediaErrorResponse(error);
    throw error;
  }
}
