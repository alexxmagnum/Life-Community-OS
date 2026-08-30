/**
 * Life Map query — what exists here, what is happening, what the person can do.
 * Reuses Community Experience Feed. Does not persist map entities.
 */

import {
  createLifeMapContext,
  filterLifeMapContextForQuery,
  recordMatchesTerritoryScope,
  type CommunityFeedItem,
  type LifeMapQueryInput,
  type LifeMapQueryResult,
  type Location,
  type ProductCapabilityMap,
  type TerritoryObject,
} from "@life-community-os/types";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import { listLocationsServer } from "@/lib/location/server-location-repository";
import { resolveLifeMapTenantPack } from "@/lib/life-map-tenant-pack";
import { getTenantPack } from "@/lib/tenant/registry";

export type LifeMapQueryScope = {
  accessToken?: string | null;
  personId?: string | null;
};

export type LifeMapQueryServiceInput = LifeMapQueryInput & {
  includeLife?: boolean;
  membershipLocations?: boolean;
  territoryObjects?: readonly TerritoryObject[];
  productCapabilities?: ProductCapabilityMap;
  permissions?: readonly string[];
  scope?: LifeMapQueryScope;
};

function publicOrMembers(location: Location, members: boolean): boolean {
  if (location.visibility === "private") return false;
  if (location.visibility === "members") return members;
  return location.visibility === "public" || location.visibility === "members";
}

export async function listLifeMapQuery(
  input: LifeMapQueryServiceInput,
): Promise<LifeMapQueryResult> {
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  const locations = (await listLocationsServer(tenantId, input.scope)).filter(
    (item) =>
      item.tenantId === tenantId &&
      recordMatchesTerritoryScope(item.territoryId, territoryId) &&
      publicOrMembers(item, Boolean(input.membershipLocations)),
  );
  let feedItems: CommunityFeedItem[] = [];
  if (input.includeLife) {
    const pack = getTenantPack(tenantId);
    feedItems = await CommunityExperienceFeedService.list({
      tenantId,
      territoryId,
      productCapabilities: input.productCapabilities ?? pack?.productCapabilities,
      permissions: input.permissions,
      scope: input.scope,
    });
  }
  const packObjects =
    input.territoryObjects ??
    resolveLifeMapTenantPack(tenantId)?.listTerritoryObjects?.() ??
    [];
  const context = createLifeMapContext({
    tenantId,
    territoryId,
    locations,
    feedItems,
    territoryObjects: packObjects,
  });
  const filtered = filterLifeMapContextForQuery(context, {
    viewport: input.viewport,
    zoom: input.zoom,
  });
  return {
    territory: {
      tenantId,
      territoryId,
      ...(context.bounds ? { bounds: context.bounds } : {}),
    },
    objects: context.territoryObjects,
    locations: filtered.locations,
    feedItems: input.includeLife ? filtered.feedItems : [],
  };
}

export const LifeMapQueryService = {
  list: listLifeMapQuery,
};
