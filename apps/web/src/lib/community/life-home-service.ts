/**
 * Territory Home Experience service — composes existing domain projections.
 */

import {
  projectLifeHomeContext,
  resolveLifeHomeMembershipScope,
  recordMatchesTerritoryScope,
  territoryHomeQuery,
  resolveActiveTerritory,
  projectTerritoryDailyPulse,
  type LifeHomeContext,
  type LifeHomePlace,
  type TerritoryExperienceContext,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CommunityOperationsService } from "@/lib/community/community-operations-service";
import { listPersonalFavoritesServer } from "@/lib/personal/server-personal-repository";
import { listLocationsServer } from "@/lib/location/server-location-repository";
import {
  defaultTerritoryIdForIdentity,
  identityTerritoriesForTenant,
} from "@/lib/tenant/territory-catalog";

export const LifeHomeService = {
  async resolve(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    territoryName: string;
  }): Promise<LifeHomeContext> {
    const membershipScope = resolveLifeHomeMembershipScope({
      hasMembership: input.actor.hasMembership,
      membershipStatus: input.actor.membershipStatus,
    });
    const experienceContext: TerritoryExperienceContext = {
      tenantId: input.tenantId,
      territoryId: input.territoryId,
      territoryName: input.territoryName,
      slug: null,
      locale: "es",
      timezone: "UTC",
      capabilities: input.actor.permissions,
    };
    if (membershipScope !== "active") {
      const announcements = await CommunityOperationsService.announcements({
        tenantId: input.tenantId,
        territoryId: input.territoryId,
      });
      const pulse = projectTerritoryDailyPulse({
        tenantId: input.tenantId,
        territoryId: input.territoryId,
        items: [],
        announcements:
          membershipScope === "guest" || membershipScope === "pending"
            ? announcements.slice(0, 3)
            : [],
      });
      return projectLifeHomeContext({
        query: territoryHomeQuery(experienceContext),
        territoryName: input.territoryName,
        pulse,
        favoritePlaces: [],
        operationActions: [],
        membershipScope,
        capabilities: input.actor.permissions,
      });
    }
    const [pulse, operations, favorites, locations] = await Promise.all([
      CommunityOperationsService.pulse({
        tenantId: input.tenantId,
        actor: input.actor,
        territoryId: input.territoryId,
      }),
      CommunityOperationsService.resolve({
        tenantId: input.tenantId,
        actor: input.actor,
        territoryId: input.territoryId,
      }),
      input.actor.personId && input.actor.hasMembership
        ? listPersonalFavoritesServer({
            tenantId: input.tenantId,
            personId: input.actor.personId,
          })
        : Promise.resolve([]),
      listLocationsServer(input.tenantId),
    ]);
    const scopedLocations = locations.filter((row) =>
      recordMatchesTerritoryScope(row.territoryId, input.territoryId),
    );
    const locationById = new Map(
      scopedLocations.map((row) => [row.id, row.name] as const),
    );
    const places: LifeHomePlace[] = favorites
      .filter((row) => row.kind === "location")
      .map((row) => ({
        id: row.targetId,
        name: locationById.get(row.targetId) ?? row.targetId,
        label: "Tu lugar",
        href: `/locations/${row.targetId}`,
      }));
    return projectLifeHomeContext({
      query: territoryHomeQuery(experienceContext),
      territoryName: input.territoryName,
      pulse,
      favoritePlaces: places,
      operationActions: operations.actions,
      membershipScope,
      capabilities: input.actor.permissions,
    });
  },

  async fromRequest(input: {
    tenantId: string;
    actor: RequestActor;
    queryTerritoryId?: string | null;
  }): Promise<LifeHomeContext | null> {
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
      territoryName: resolved.context.territoryName ?? "Comunidad",
    });
  },
};
