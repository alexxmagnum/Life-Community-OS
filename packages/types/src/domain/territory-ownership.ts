/**
 * Territory ownership for product domains.
 * Tenant isolation remains. Territory is an additional geographic bound.
 * tenant_id is never dropped.
 */

import type { DomainId } from "./ids";
import type { BusinessProfile } from "./business-profile";
import type { Location } from "./location";
import type { CommunityResource } from "./resource";

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

export function denyCrossTerritoryAccess(
  leftTerritoryId: DomainId | null | undefined,
  rightTerritoryId: DomainId | null | undefined,
): boolean {
  if (!leftTerritoryId || !rightTerritoryId) return true;
  return leftTerritoryId !== rightTerritoryId;
}
