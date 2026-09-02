/**
 * Discover Experience service — composes territorial exploration.
 */

import {
  discoverQueryFromActive,
  projectDiscoverExperienceContext,
  recordMatchesTerritoryScope,
  resolveActiveTerritory,
  type DiscoverExperienceContext,
  type LifeHomePlace,
  type TerritoryExperienceContext,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { listBusinessesServer } from "@/lib/business/server-business-repository";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import { listLocationsServer } from "@/lib/location/server-location-repository";
import { getTenantPack } from "@/lib/tenant/registry";
import {
  defaultTerritoryIdForIdentity,
  identityTerritoriesForTenant,
} from "@/lib/tenant/territory-catalog";

export const DiscoverExperienceService = {
  async resolve(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    experienceContext?: TerritoryExperienceContext;
  }): Promise<DiscoverExperienceContext> {
    const pack = getTenantPack(input.tenantId);
    const context: TerritoryExperienceContext =
      input.experienceContext ?? {
        tenantId: input.tenantId,
        territoryId: input.territoryId,
        territoryName: null,
        slug: null,
        locale: "es",
        timezone: "UTC",
        capabilities: input.actor.permissions,
      };
    const [items, businesses, locations] = await Promise.all([
      CommunityExperienceFeedService.list({
        tenantId: input.tenantId,
        territoryId: input.territoryId,
        productCapabilities: pack?.productCapabilities,
        permissions: input.actor.permissions,
      }),
      listBusinessesServer(input.tenantId),
      listLocationsServer(input.tenantId),
    ]);
    const inScope = (territoryId?: string) =>
      recordMatchesTerritoryScope(territoryId, input.territoryId);
    const scopedLocations = locations.filter((row) => inScope(row.territoryId));
    const livingPlaces: LifeHomePlace[] = scopedLocations.slice(0, 8).map((row) => ({
      id: row.id,
      name: row.name,
      label: row.category,
      href: `/locations/${row.id}`,
    }));
    return projectDiscoverExperienceContext({
      query: discoverQueryFromActive(context),
      items,
      livingPlaces,
      services: businesses
        .filter((row) => row.status === "published" && inScope(row.territoryId))
        .slice(0, 12)
        .map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          href: `/near/place/${row.locationId ?? row.id}`,
        })),
      help: [],
    });
  },

  async fromRequest(input: {
    tenantId: string;
    actor: RequestActor;
    queryTerritoryId?: string | null;
  }): Promise<DiscoverExperienceContext | null> {
    const resolved = resolveActiveTerritory({
      tenantId: input.tenantId,
      membershipTerritoryId: input.actor.territoryId,
      selectedTerritoryId: input.queryTerritoryId,
      defaultTerritoryId: defaultTerritoryIdForIdentity(input.tenantId),
      territories: identityTerritoriesForTenant(input.tenantId),
      capabilities: input.actor.permissions,
    });
    if (!resolved.ok || !resolved.context.territoryId) return null;
    return this.resolve({
      tenantId: input.tenantId,
      actor: input.actor,
      territoryId: resolved.context.territoryId,
      experienceContext: resolved.context,
    });
  },
};
