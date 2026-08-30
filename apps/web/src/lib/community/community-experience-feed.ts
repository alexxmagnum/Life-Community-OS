/**
 * Community Experience Feed — live projection of Territory activity.
 * Aggregates Experience, Community Event, Reservation availability,
 * Resource, Business and Help. Does not persist a feed entity.
 */

import {
  dateOffsetIso,
  discoverExperienceQuery,
  feedSourceEnabled,
  isActivityResource,
  participationOccupiesSeat,
  projectBusinessToFeedItem,
  projectEventToFeedItem,
  projectExperienceToFeedItem,
  projectHelpToFeedItem,
  projectResourceToFeedItem,
  recordMatchesTerritoryScope,
  resourceIsBookable,
  sortCommunityFeedItems,
  type CommunityFeedItem,
  type CommunityExperienceFeedQuery,
  type DiscoverExperienceQuery,
  type ProductCapabilityMap,
} from "@life-community-os/types";
import { listBusinessesServer } from "@/lib/business/server-business-repository";
import {
  listCommunityEvents,
  listCommunitySnapshot,
} from "@/lib/community/server-community-repository";
import {
  listExperienceParticipantsServer,
  listExperiencesServer,
} from "@/lib/experiences/server-experience-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import {
  listAvailabilityServer,
  listResourcesServer,
} from "@/lib/reservations/server-reservations-repository";
import { getTenantPack } from "@/lib/tenant/registry";

export type CommunityExperienceFeedScope = {
  accessToken?: string | null;
  personId?: string | null;
};

export type CommunityExperienceFeedInput = CommunityExperienceFeedQuery & {
  now?: number;
  scope?: CommunityExperienceFeedScope;
};

function inTerritory(
  recordTerritoryId: string | null | undefined,
  territoryId: string,
): boolean {
  return recordMatchesTerritoryScope(recordTerritoryId, territoryId);
}

async function resourceHasAvailableSlot(
  tenantId: string,
  resourceId: string,
  scope?: CommunityExperienceFeedScope,
): Promise<{ startsAt?: string; available: number } | null> {
  for (const offset of [0, 1]) {
    const date = dateOffsetIso(offset);
    const slots = await listAvailabilityServer(
      tenantId,
      resourceId,
      date,
      scope,
    );
    const open = slots.filter((slot) => slot.status === "available");
    if (open.length === 0) continue;
    const first = open[0]!;
    return {
      startsAt: `${date}T${first.start}:00.000Z`,
      available: open.length,
    };
  }
  return null;
}

async function projectExperiences(input: {
  tenantId: string;
  territoryId: string;
  product: ProductCapabilityMap;
  permissions?: readonly string[];
  scope?: CommunityExperienceFeedScope;
}): Promise<CommunityFeedItem[]> {
  if (!feedSourceEnabled("experience", input.product, input.permissions)) {
    return [];
  }
  const rows = await listExperiencesServer(input.tenantId, input.scope, {
    territoryId: input.territoryId,
  });
  const items: CommunityFeedItem[] = [];
  for (const experience of rows) {
    if (!inTerritory(experience.territoryId, input.territoryId)) continue;
    const participants = await listExperienceParticipantsServer(
      input.tenantId,
      experience.id,
      input.scope,
    );
    const occupied = participants.filter((row) =>
      participationOccupiesSeat(row.role),
    ).length;
    const projected = projectExperienceToFeedItem({
      id: experience.id,
      tenantId: experience.tenantId,
      territoryId: experience.territoryId,
      title: experience.title,
      description: experience.description,
      status: experience.status,
      startsAt: experience.startsAt,
      endsAt: experience.endsAt,
      location: experience.location,
      resourceId: experience.resourceId,
      capacity: experience.capacity,
      occupied,
    });
    if (projected) items.push(projected);
  }
  return items;
}

async function projectEvents(input: {
  tenantId: string;
  territoryId: string;
  product: ProductCapabilityMap;
  permissions?: readonly string[];
  skipEventIds: ReadonlySet<string>;
  scope?: CommunityExperienceFeedScope;
}): Promise<CommunityFeedItem[]> {
  if (!feedSourceEnabled("event", input.product, input.permissions)) {
    return [];
  }
  const events = await listCommunityEvents(input.tenantId, input.scope);
  return events.flatMap((event) => {
    if (input.skipEventIds.has(event.id)) return [];
    if (!inTerritory(event.territoryId, input.territoryId)) return [];
    const projected = projectEventToFeedItem({
      id: event.id,
      tenantId: event.tenantId,
      territoryId: event.territoryId ?? input.territoryId,
      title: event.title,
      description: event.description,
      status: event.status,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      locationLabel: event.locationLabel,
    });
    return projected ? [projected] : [];
  });
}

async function projectResources(input: {
  tenantId: string;
  territoryId: string;
  product: ProductCapabilityMap;
  permissions?: readonly string[];
  scope?: CommunityExperienceFeedScope;
}): Promise<{ items: CommunityFeedItem[]; linkedEventIds: string[] }> {
  const resources = await listResourcesServer(input.tenantId, input.scope);
  const local = resources.filter((resource) =>
    inTerritory(resource.territoryId, input.territoryId),
  );
  const linkedEventIds = local
    .map((resource) => resource.communityEventId)
    .filter((id): id is string => Boolean(id));
  const items: CommunityFeedItem[] = [];
  const allowActivity = feedSourceEnabled(
    "resource_activity",
    input.product,
    input.permissions,
  );
  const allowReservation = feedSourceEnabled(
    "reservation",
    input.product,
    input.permissions,
  );
  for (const resource of local) {
    if (isActivityResource(resource)) {
      if (!allowActivity) continue;
      const projected = projectResourceToFeedItem({
        id: resource.id,
        tenantId: resource.tenantId ?? input.tenantId,
        territoryId: resource.territoryId ?? input.territoryId,
        name: resource.name,
        description: resource.description,
        status: resource.status,
        location: resource.location,
        locationId: resource.locationId,
        capacity: resource.capacity,
        startsAt: resource.scheduleStartsAt,
        endsAt: resource.scheduleEndsAt,
        imageUrl: resource.imageUrl,
      });
      if (projected) items.push(projected);
      continue;
    }
    if (!allowReservation) continue;
    if (!resourceIsBookable(resource)) continue;
    const slot = await resourceHasAvailableSlot(
      input.tenantId,
      resource.id,
      input.scope,
    );
    if (!slot) continue;
    const projected = projectResourceToFeedItem({
      id: resource.id,
      tenantId: resource.tenantId ?? input.tenantId,
      territoryId: resource.territoryId ?? input.territoryId,
      name: resource.name,
      description: resource.description,
      status: resource.status,
      location: resource.location,
      locationId: resource.locationId,
      capacity: resource.capacity,
      available: slot.available,
      startsAt: slot.startsAt,
      imageUrl: resource.imageUrl,
      asReservation: true,
    });
    if (projected) items.push(projected);
  }
  return { items, linkedEventIds };
}

async function projectBusinesses(input: {
  tenantId: string;
  territoryId: string;
  product: ProductCapabilityMap;
  permissions?: readonly string[];
  scope?: CommunityExperienceFeedScope;
}): Promise<CommunityFeedItem[]> {
  if (!feedSourceEnabled("business_activity", input.product, input.permissions)) {
    return [];
  }
  const rows = await listBusinessesServer(input.tenantId, input.scope);
  return rows.flatMap((business) => {
    if (!inTerritory(business.territoryId, input.territoryId)) return [];
    const projected = projectBusinessToFeedItem({
      id: business.id,
      tenantId: business.tenantId,
      territoryId: business.territoryId ?? input.territoryId,
      name: business.name,
      description: business.description,
      status: business.status,
      locationId: business.locationId,
      imageUrl: business.imageUrl,
    });
    return projected ? [projected] : [];
  });
}

async function projectHelp(input: {
  tenantId: string;
  territoryId: string;
  product: ProductCapabilityMap;
  permissions?: readonly string[];
  scope?: CommunityExperienceFeedScope;
}): Promise<CommunityFeedItem[]> {
  if (!feedSourceEnabled("community", input.product, input.permissions)) {
    return [];
  }
  const snapshot = await listCommunitySnapshot(input.tenantId, input.scope);
  const hasCommunityContext =
    snapshot.posts.some(
      (post) =>
        post.status === "published" &&
        inTerritory(post.territoryId, input.territoryId),
    ) ||
    snapshot.groups.some(
      (group) =>
        group.status !== "archived" &&
        inTerritory(group.territoryId, input.territoryId),
    ) ||
    snapshot.events.some(
      (event) =>
        event.status === "published" &&
        inTerritory(event.territoryId, input.territoryId),
    );
  if (!hasCommunityContext) return [];
  const rows = await listHelpRequestsServer(input.tenantId, input.scope);
  return rows.flatMap((help) => {
    if (!inTerritory(help.territoryId, input.territoryId)) return [];
    const projected = projectHelpToFeedItem({
      id: help.id,
      tenantId: help.tenantId,
      territoryId: help.territoryId ?? input.territoryId,
      title: help.title,
      description: help.description,
      status: help.status,
    });
    return projected ? [projected] : [];
  });
}

export async function listCommunityExperienceFeed(
  input: CommunityExperienceFeedInput,
): Promise<CommunityFeedItem[]> {
  const query = discoverExperienceQuery({
    tenantId: input.tenantId,
    territoryId: input.territoryId,
    productCapabilities: input.productCapabilities,
    permissions: input.permissions,
  });
  if (!query) return [];
  const pack = getTenantPack(query.tenantId);
  const product = input.productCapabilities ?? pack?.productCapabilities;
  if (!product) return [];
  const permissions = input.permissions;
  const resources = await projectResources({
    tenantId: query.tenantId,
    territoryId: query.territoryId,
    product,
    permissions,
    scope: input.scope,
  });
  const items = [
    ...(await projectExperiences({
      tenantId: query.tenantId,
      territoryId: query.territoryId,
      product,
      permissions,
      scope: input.scope,
    })),
    ...(await projectEvents({
      tenantId: query.tenantId,
      territoryId: query.territoryId,
      product,
      permissions,
      skipEventIds: new Set(resources.linkedEventIds),
      scope: input.scope,
    })),
    ...resources.items,
    ...(await projectBusinesses({
      tenantId: query.tenantId,
      territoryId: query.territoryId,
      product,
      permissions,
      scope: input.scope,
    })),
    ...(await projectHelp({
      tenantId: query.tenantId,
      territoryId: query.territoryId,
      product,
      permissions,
      scope: input.scope,
    })),
  ];
  return sortCommunityFeedItems(items, input.now ?? Date.now());
}

export const CommunityExperienceFeedService = {
  list: listCommunityExperienceFeed,
  discover(query: DiscoverExperienceQuery, scope?: CommunityExperienceFeedScope) {
    return listCommunityExperienceFeed({ ...query, scope });
  },
};
