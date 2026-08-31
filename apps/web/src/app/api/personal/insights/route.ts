import { NextResponse } from "next/server";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import { PersonalizationService } from "@/lib/personal/personalization-service";
import { getTenantPack } from "@/lib/tenant/registry";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanReadCommunityExperienceFeed(actor)) {
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
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ insights: [] });
  }
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const pack = getTenantPack(bound.tenantId);
  const items = await CommunityExperienceFeedService.list({
    tenantId: bound.tenantId,
    territoryId,
    productCapabilities: pack?.productCapabilities,
    permissions: actor.permissions,
    scope,
  });
  const insights = await PersonalizationService.insights({
    tenantId: bound.tenantId,
    actor,
    territoryId,
    items,
    publish: url.searchParams.get("publish") === "1",
  });
  return NextResponse.json({ insights });
}
