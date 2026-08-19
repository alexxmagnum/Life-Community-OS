/**
 * Location discovery adapters — LocalEntity is a VIEW of Location, not a SoT.
 *
 * Near / Help hubs consume Location. LocalEntity shape is preserved for UI cards
 * and legacy conversation adapters until those call sites migrate fully.
 */

import type { Location, LocationType } from "./location";
import type { LocalEntity, LocalEntityKind } from "./local-entity";
import { listEntitiesNearYou, listTrustedHelpEntities } from "./local-entity";

const CATEGORY_TO_KIND: Record<string, LocalEntityKind> = {
  restaurant: "restaurant",
  cafe: "cafe",
  café: "cafe",
  coffee: "cafe",
  shop: "shop",
  store: "shop",
  bakery: "shop",
  panadería: "shop",
  market: "shop",
  service: "service",
  electrician: "service",
  electrician_service: "service",
  plumber: "service",
  veterinary: "service",
  maintenance: "service",
  jardinería: "service",
  gardening: "service",
  pool: "place",
  padel: "place",
  golf: "place",
  facility: "place",
  place: "place",
  paseo: "place",
};

export function localEntityKindFromLocation(location: Location): LocalEntityKind {
  const key = location.category.trim().toLowerCase();
  if (CATEGORY_TO_KIND[key]) return CATEGORY_TO_KIND[key];
  switch (location.type) {
    case "business":
      return "restaurant";
    case "service":
      return "service";
    case "facility":
    case "community-place":
    case "event":
      return "place";
    default:
      return "other";
  }
}

export function locationTypeFromLocalKind(kind: LocalEntityKind): LocationType {
  switch (kind) {
    case "restaurant":
    case "cafe":
    case "shop":
      return "business";
    case "service":
      return "service";
    case "place":
    case "other":
      return "community-place";
  }
}

/** Project Location → LocalEntity for discovery UI (never the reverse SoT). */
export function locationToLocalEntity(location: Location): LocalEntity {
  const kind = localEntityKindFromLocation(location);
  return {
    id: location.id,
    name: location.name,
    kind,
    categoryLabel: location.category,
    areaLabel: location.areaLabel?.trim() || "Comunidad",
    story: location.summary?.trim() || location.address,
    imageUrl: location.imageUrl?.trim() || "",
  };
}

export function locationsToLocalEntities(
  locations: readonly Location[],
): LocalEntity[] {
  return locations.map(locationToLocalEntity);
}

export function listNearYouFromLocations(
  locations: readonly Location[],
  query?: string,
): LocalEntity[] {
  return listEntitiesNearYou(locationsToLocalEntities(locations), { query });
}

export function listTrustedHelpFromLocations(
  locations: readonly Location[],
  query?: string,
): LocalEntity[] {
  return listTrustedHelpEntities(locationsToLocalEntities(locations), {
    query,
  });
}

export function filterLocationsByLocalKinds(
  locations: readonly Location[],
  kinds: readonly LocalEntityKind[],
  query?: string,
): Location[] {
  const kindSet = new Set(kinds);
  const q = query?.trim().toLowerCase();
  return locations.filter((loc) => {
    if (!kindSet.has(localEntityKindFromLocation(loc))) return false;
    if (!q) return true;
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.category.toLowerCase().includes(q) ||
      loc.address.toLowerCase().includes(q) ||
      (loc.summary?.toLowerCase().includes(q) ?? false) ||
      (loc.areaLabel?.toLowerCase().includes(q) ?? false)
    );
  });
}
