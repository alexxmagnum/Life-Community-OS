/**
 * Territory ownership for product domains.
 * Tenant isolation remains. Territory is an additional geographic bound.
 * tenant_id is never dropped.
 */

import type { DomainId } from "./ids";
import type { BusinessProfile } from "./business-profile";
import type { Location } from "./location";
import type { CommunityResource, Reservation } from "./resource";
import type { MarketplaceListing } from "./marketplace-listing";
import type { HelpRequest } from "./help-request";
import type { Property } from "./property";
import type {
  CommunityEvent,
  CommunityGroupRecord,
  CommunityPost,
} from "./community-core";
import type { Conversation } from "../platform/communication/conversation";
import type { MediaAsset } from "../platform/files/media-asset";

export function optionalTerritoryField(
  territoryId?: string | null,
): { territoryId: DomainId } | Record<string, never> {
  const id = territoryId?.trim();
  return id ? { territoryId: id } : {};
}

/**
 * List/read filter: unscoped requests stay tenant-wide (backward compatible).
 * Stamped records must match the active Territory. Legacy rows without
 * territoryId remain visible until backfilled.
 */
export function recordMatchesTerritoryScope(
  recordTerritoryId: string | null | undefined,
  scopeTerritoryId: string | null | undefined,
): boolean {
  if (!scopeTerritoryId) return true;
  if (!recordTerritoryId) return true;
  return recordTerritoryId === scopeTerritoryId;
}

export function locationBelongsToTerritory(
  location: Pick<Location, "territoryId" | "tenantId">,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (!location.territoryId || location.territoryId !== territoryId) {
    return false;
  }
  if (tenantId && location.tenantId !== tenantId) return false;
  return true;
}

export function filterLocationsForTerritory(
  locations: readonly Location[],
  territoryId: DomainId,
  tenantId?: DomainId,
): Location[] {
  return locations.filter((location) =>
    locationBelongsToTerritory(location, territoryId, tenantId),
  );
}

/**
 * Business inherits Territory from its Location when profile.territoryId
 * is omitted. Coordinates stay on Location.
 */
export function businessBelongsToTerritory(
  business: Pick<BusinessProfile, "territoryId" | "locationId" | "tenantId">,
  location: Pick<Location, "id" | "territoryId" | "tenantId"> | null,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (tenantId && business.tenantId !== tenantId) return false;
  if (business.territoryId) {
    if (location?.territoryId && business.territoryId !== location.territoryId) {
      return false;
    }
    return business.territoryId === territoryId;
  }
  if (!location || location.id !== business.locationId) return false;
  return locationBelongsToTerritory(location, territoryId, tenantId);
}

export function resourceBelongsToTerritory(
  resource: Pick<CommunityResource, "territoryId" | "tenantId">,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (!resource.territoryId || resource.territoryId !== territoryId) {
    return false;
  }
  if (tenantId && resource.tenantId && resource.tenantId !== tenantId) {
    return false;
  }
  return true;
}

export function reservationBelongsToTerritory(
  reservation: Pick<Reservation, "territoryId" | "tenantId" | "resourceId">,
  resource: Pick<CommunityResource, "id" | "territoryId" | "tenantId"> | null,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (tenantId && reservation.tenantId && reservation.tenantId !== tenantId) {
    return false;
  }
  if (reservation.territoryId) {
    return reservation.territoryId === territoryId;
  }
  if (!resource || resource.id !== reservation.resourceId) return false;
  return resourceBelongsToTerritory(resource, territoryId, tenantId);
}

export function propertyBelongsToTerritory(
  property: Pick<Property, "territoryId" | "tenantId" | "locationId">,
  location: Pick<Location, "id" | "territoryId" | "tenantId"> | null,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (tenantId && property.tenantId && property.tenantId !== tenantId) {
    return false;
  }
  if (property.territoryId) {
    if (location?.territoryId && property.territoryId !== location.territoryId) {
      return false;
    }
    return property.territoryId === territoryId;
  }
  if (!location || location.id !== property.locationId) return false;
  return locationBelongsToTerritory(location, territoryId, tenantId);
}

export function marketplaceBelongsToTerritory(
  listing: Pick<MarketplaceListing, "territoryId" | "tenantId">,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (tenantId && listing.tenantId !== tenantId) return false;
  return Boolean(listing.territoryId && listing.territoryId === territoryId);
}

export function helpBelongsToTerritory(
  request: Pick<HelpRequest, "territoryId" | "tenantId">,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (tenantId && request.tenantId !== tenantId) return false;
  return Boolean(request.territoryId && request.territoryId === territoryId);
}

export function communityRecordBelongsToTerritory(
  record: Pick<
    CommunityPost | CommunityEvent | CommunityGroupRecord,
    "territoryId" | "tenantId"
  >,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (tenantId && record.tenantId !== tenantId) return false;
  return Boolean(record.territoryId && record.territoryId === territoryId);
}

export function conversationBelongsToTerritory(
  conversation: Pick<Conversation, "territoryId" | "tenantId">,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (tenantId && conversation.tenantId !== tenantId) return false;
  return Boolean(
    conversation.territoryId && conversation.territoryId === territoryId,
  );
}

export function mediaBelongsToTerritory(
  asset: Pick<MediaAsset, "territoryId" | "tenantId">,
  territoryId: DomainId,
  tenantId?: DomainId,
): boolean {
  if (tenantId && asset.tenantId !== tenantId) return false;
  return Boolean(asset.territoryId && asset.territoryId === territoryId);
}

export function denyCrossTerritoryAccess(
  leftTerritoryId: DomainId | null | undefined,
  rightTerritoryId: DomainId | null | undefined,
): boolean {
  if (!leftTerritoryId || !rightTerritoryId) return true;
  return leftTerritoryId !== rightTerritoryId;
}
