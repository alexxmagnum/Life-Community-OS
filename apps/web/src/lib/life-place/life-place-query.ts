/**
 * Life Place query — what can I do here?
 * Location is SoT. Feed / Experience / Resource / Reservation / Business are domains.
 */

import {
  createLifePlaceContext,
  dateOffsetIso,
  isProfessionalBusiness,
  participationOccupiesSeat,
  recordMatchesTerritoryScope,
  resourceIsBookable,
  type CommunityFeedItem,
  type LifePlaceBusinessSummary,
  type LifePlaceContext,
  type LifePlaceExperienceSummary,
  type LifePlaceHelpSummary,
  type LifePlaceReservationAvailability,
  type LifePlaceResourceSummary,
  type ProductCapabilityMap,
  placeTrustLabel,
  businessTrustLabels,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  getBusinessByLocationServer,
  listBusinessesServer,
} from "@/lib/business/server-business-repository";
import { CommunityOperationsService } from "@/lib/community/community-operations-service";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import {
  listExperienceParticipantsServer,
  listExperiencesServer,
} from "@/lib/experiences/server-experience-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import { getLocationServer } from "@/lib/location/server-location-repository";
import {
  listAvailabilityServer,
  listResourcesServer,
} from "@/lib/reservations/server-reservations-repository";
import { getTenantPack } from "@/lib/tenant/registry";
import {
  listEntityMediaServer,
  type EntityMediaItem,
} from "@/lib/media/server-media-repository";
import {
  actorCanReadLifePlaceLife,
  actorCanReadLifePlaceCommunityPreview,
  actorCanReadLifePlacePublicTerritory,
  actorCanSeeLocation,
} from "./permissions";

export type LifePlaceQueryScope = {
  accessToken?: string | null;
  personId?: string | null;
};

export type LifePlaceQueryError = {
  ok: false;
  status: 403 | 404;
  error: "territory_forbidden" | "forbidden" | "not_found";
};

export type LifePlaceQueryOk = {
  ok: true;
  context: LifePlaceContext;
};

export type LifePlaceQueryServiceInput = {
  tenantId: string;
  territoryId: string;
  locationId: string;
  actor: RequestActor;
  productCapabilities?: ProductCapabilityMap;
  permissions?: readonly string[];
  scope?: LifePlaceQueryScope;
};

async function coverFor(
  tenantId: string,
  actor: RequestActor,
  entityType: "location" | "business" | "experience" | "resource",
  entityId: string,
  scope?: LifePlaceQueryScope,
): Promise<EntityMediaItem | null> {
  if (!actorCanReadLifePlaceLife(actor)) return null;
  try {
    const items = await listEntityMediaServer({
      tenantId,
      actor,
      entityType,
      entityId,
      scope,
    });
    return items.find((item) => item.reference.purpose === "cover") ?? items[0] ?? null;
  } catch {
    return null;
  }
}

async function firstAvailable(
  tenantId: string,
  resourceId: string,
  scope?: LifePlaceQueryScope,
): Promise<{ available: number; date: string } | null> {
  for (const offset of [0, 1]) {
    const date = dateOffsetIso(offset);
    const slots = await listAvailabilityServer(tenantId, resourceId, date, scope);
    const open = slots.filter((slot) => slot.status === "available");
    if (open.length === 0) continue;
    return { available: open.length, date };
  }
  return null;
}

export async function resolveLifePlace(
  input: LifePlaceQueryServiceInput,
): Promise<LifePlaceQueryOk | LifePlaceQueryError> {
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  const locationId = input.locationId.trim();
  const location = await getLocationServer(tenantId, locationId, input.scope);
  if (!location || location.tenantId !== tenantId) {
    return { ok: false, status: 404, error: "not_found" };
  }
  if (!recordMatchesTerritoryScope(location.territoryId, territoryId)) {
    return { ok: false, status: 403, error: "territory_forbidden" };
  }
  if (!actorCanSeeLocation(input.actor, location)) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const includeLife = actorCanReadLifePlaceLife(input.actor);
  const includePreview = actorCanReadLifePlaceCommunityPreview(input.actor);
  const includePublicTerritory = actorCanReadLifePlacePublicTerritory(
    input.actor,
  );
  const pack = getTenantPack(tenantId);
  const product =
    input.productCapabilities ?? pack?.productCapabilities;
  const permissions = input.permissions ?? input.actor.permissions;

  let feedItems: CommunityFeedItem[] = [];
  if (includeLife || includePreview) {
    feedItems = (
      await CommunityExperienceFeedService.list({
        tenantId,
        territoryId,
        productCapabilities: product,
        permissions,
        scope: input.scope,
      })
    ).filter((item) => item.locationId === locationId);
  }

  const allResources =
    includeLife || includePublicTerritory
      ? await listResourcesServer(tenantId, input.scope)
      : [];
  const resourcesAtPlace = allResources.filter(
    (resource) =>
      resource.locationId === locationId &&
      recordMatchesTerritoryScope(resource.territoryId, territoryId),
  );
  const resourceIds = new Set(resourcesAtPlace.map((item) => item.id));

  const resourceSummaries: LifePlaceResourceSummary[] = resourcesAtPlace.map(
    (resource) => ({
      id: resource.id,
      name: resource.name,
      category: resource.category,
      bookable: resourceIsBookable(resource),
    }),
  );

  const experiences: LifePlaceExperienceSummary[] = [];
  if (includeLife || includePublicTerritory) {
    const rows = await listExperiencesServer(tenantId, input.scope, {
      territoryId,
    });
    for (const experience of rows) {
      if (experience.status !== "published") continue;
      if (includeLife) {
        if (!experience.resourceId || !resourceIds.has(experience.resourceId)) {
          continue;
        }
      } else if (
        !experience.resourceId ||
        !resourceIds.has(experience.resourceId)
      ) {
        continue;
      }
      let available: number | undefined;
      if (includeLife) {
        const participants = await listExperienceParticipantsServer(
          tenantId,
          experience.id,
          input.scope,
        );
        const occupied = participants.filter((row) =>
          participationOccupiesSeat(row.role),
        ).length;
        available =
          experience.capacity > 0
            ? Math.max(0, experience.capacity - occupied)
            : undefined;
      }
      experiences.push({
        id: experience.id,
        title: experience.title,
        startsAt: experience.startsAt,
        available,
        href: `/experiences/${encodeURIComponent(experience.id)}`,
      });
    }
  }

  const reservations: LifePlaceReservationAvailability[] = [];
  if (includeLife) {
    for (const resource of resourcesAtPlace) {
      if (!resourceIsBookable(resource)) continue;
      const slot = await firstAvailable(tenantId, resource.id, input.scope);
      if (!slot) continue;
      reservations.push({
        context: {
          type: location.type === "service" ? "service" : "resource",
          id: resource.id,
        },
        available: slot.available,
        label: resource.name,
        href: `/resources/${encodeURIComponent(resource.id)}/reserve`,
      });
    }
    for (const experience of experiences) {
      if (experience.available != null && experience.available <= 0) continue;
      reservations.push({
        context: { type: "experience", id: experience.id },
        available: experience.available ?? 0,
        label: experience.title,
        href: experience.href,
      });
    }
  }

  const businessRow = await getBusinessByLocationServer(
    tenantId,
    locationId,
    input.scope,
  );
  const business =
    businessRow &&
    businessRow.tenantId === tenantId &&
    recordMatchesTerritoryScope(businessRow.territoryId, territoryId) &&
    (businessRow.status === "published" ||
      (includeLife && businessRow.ownerPersonId === input.actor.personId))
      ? {
          id: businessRow.id,
          name: businessRow.name,
          category: businessRow.category,
          href: `/locations/${encodeURIComponent(locationId)}`,
          trustLabel: businessTrustLabels({
            registered: true,
            locationConfirmed: Boolean(businessRow.locationId),
            published: businessRow.status === "published",
          }).join(" · "),
        }
      : undefined;

  let nearbyProfessionals: LifePlaceBusinessSummary[] | undefined;
  let nearbyHelp: LifePlaceHelpSummary[] | undefined;
  if (includeLife) {
    const professionalRows: LifePlaceBusinessSummary[] = [];
    const businesses = await listBusinessesServer(tenantId, input.scope);
    for (const row of businesses) {
      if (row.status !== "published") continue;
      if (row.locationId === locationId) continue;
      if (!recordMatchesTerritoryScope(row.territoryId, territoryId)) continue;
      if (!isProfessionalBusiness(row)) continue;
      professionalRows.push({
        id: row.id,
        name: row.name,
        category: row.category,
        href: `/locations/${encodeURIComponent(row.locationId)}`,
        trustLabel: businessTrustLabels({
          registered: true,
          locationConfirmed: Boolean(row.locationId),
          published: true,
        }).join(" · "),
      });
    }
    if (professionalRows.length > 0) nearbyProfessionals = professionalRows;

    const helpRows: LifePlaceHelpSummary[] = [];
    for (const offer of await listHelpRequestsServer(tenantId, input.scope)) {
      if (offer.type !== "offer_help" || offer.status !== "open") continue;
      if (!recordMatchesTerritoryScope(offer.territoryId, territoryId)) continue;
      helpRows.push({
        id: offer.id,
        title: offer.title,
        href: `/help/${encodeURIComponent(offer.id)}`,
      });
    }
    if (helpRows.length > 0) nearbyHelp = helpRows;
  }

  let participantCount = 0;
  if (includeLife) {
    for (const experience of experiences) {
      const people = await listExperienceParticipantsServer(
        tenantId,
        experience.id,
        input.scope,
      );
      participantCount += people.filter((row) =>
        participationOccupiesSeat(row.role),
      ).length;
    }
  }

  const cover =
    (await coverFor(tenantId, input.actor, "location", locationId, input.scope)) ??
    (business
      ? await coverFor(tenantId, input.actor, "business", business.id, input.scope)
      : null) ??
    (resourcesAtPlace[0]
      ? await coverFor(
          tenantId,
          input.actor,
          "resource",
          resourcesAtPlace[0].id,
          input.scope,
        )
      : null);

  const context = createLifePlaceContext({
    tenantId,
    territoryId,
    location,
    currentActivity: feedItems,
    resources: resourceSummaries,
    experiences,
    reservations,
    business,
    nearbyProfessionals,
    nearbyHelp,
    community:
      includeLife && (participantCount > 0 || feedItems.length > 0)
        ? {
            participantCount,
            label:
              placeTrustLabel({
                participantCount,
                activityCount: feedItems.length,
              }) ??
              `${participantCount} ${
                participantCount === 1
                  ? "vecino participando"
                  : "vecinos participando"
              }`,
          }
        : undefined,
    cover: cover?.reference,
    importantNotice: includeLife
      ? (
          await CommunityOperationsService.announcements({
            tenantId,
            territoryId,
          })
        ).find((item) => {
          const blob = `${item.title} ${item.body}`.toLowerCase();
          return blob.includes(location.name.toLowerCase());
        })?.title
      : undefined,
  });

  return { ok: true, context };
}

export const LifePlaceQueryService = {
  get: resolveLifePlace,
};
