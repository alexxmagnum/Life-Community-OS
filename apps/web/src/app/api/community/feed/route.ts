import { NextResponse } from "next/server";
import type { PersonalizedCommunityFeed } from "@life-community-os/types";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import {
  listCommunitySnapshot,
} from "@/lib/community/server-community-repository";
import { PersonalizationService } from "@/lib/personal/personalization-service";
import { getTenantPack } from "@/lib/tenant/registry";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!actorCanReadCommunityExperienceFeed(actor)) {
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
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const snapshot = await listCommunitySnapshot(bound.tenantId, scope);
  const scopeId = territory.context.territoryId;
  const pack = getTenantPack(bound.tenantId);
  const items = scopeId
    ? await CommunityExperienceFeedService.list({
        tenantId: bound.tenantId,
        territoryId: scopeId,
        productCapabilities: pack?.productCapabilities,
        permissions: actor.permissions,
        scope,
      })
    : [];
  const personalized: PersonalizedCommunityFeed = scopeId
    ? await PersonalizationService.feed({
        tenantId: bound.tenantId,
        actor,
        territoryId: scopeId,
        items,
      })
    : {
        items: items.map((item) => ({ ...item })),
        enabled: false,
        providerId: "rules",
      };
  const reasons: Record<string, string> = {};
  for (const item of personalized.items) {
    if (item.reason) reasons[item.id] = item.reason;
  }
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: scopeId,
    items: personalized.items,
    personalization: {
      enabled: personalized.enabled,
      providerId: personalized.providerId,
      reasons,
    },
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
