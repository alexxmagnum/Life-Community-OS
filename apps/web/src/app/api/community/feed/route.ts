import { NextResponse } from "next/server";
import {
  actorCanViewCommunity,
} from "@/lib/community/permissions";
import {
  listCommunitySnapshot,
} from "@/lib/community/server-community-repository";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanViewCommunity(actor)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const snapshot = await listCommunitySnapshot(bound.tenantId, scope);
  const scopeId = territory.context.territoryId;
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: scopeId,
    posts: filterForActiveTerritory(
      snapshot.posts.filter((item) => item.status === "published"),
      scopeId,
    ),
    groups: filterForActiveTerritory(
      snapshot.groups.filter((item) => item.status !== "archived"),
      scopeId,
    ),
    events: filterForActiveTerritory(
      snapshot.events.filter((item) => item.status === "published"),
      scopeId,
    ),
    comments: snapshot.comments.filter((item) => item.status === "published"),
    reactions: snapshot.reactions,
  });
}
