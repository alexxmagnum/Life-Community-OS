/**
 * Project Location (SoT) → LifeMapObject (spatial twin representation).
 * MapLibre / Three consume LifeMapObject; they never own Location.
 */

import {
  projectLifeMapObject,
  type LifeMapObject,
  type LifeMapObjectType,
  type Location,
  type LocationType,
} from "@life-community-os/types";

import { locationCategoryLabel } from "./category-labels";

function lifeMapTypeForLocation(type: LocationType): LifeMapObjectType {
  switch (type) {
    case "business":
    case "community-place":
      return "place";
    case "service":
      return "service";
    case "facility":
      return "resource";
    case "event":
      return "experience";
    default:
      return "place";
  }
}

function assetKeyForCategory(category: string, type: LocationType): string {
  const key = category.toLowerCase();
  if (key.includes("restaurant") || key.includes("lounge") || key.includes("ikon")) {
    return "place.restaurant.spatial_object";
  }
  if (key.includes("pool") || key.includes("piscina")) {
    return "recreation.pool.spatial_object";
  }
  if (key.includes("golf")) return "recreation.golf.spatial_object";
  if (key.includes("padel") || key.includes("tennis") || key.includes("sports")) {
    return "recreation.padel.spatial_object";
  }
  if (key.includes("cafe") || key.includes("club")) {
    return "place.clubhouse.spatial_object";
  }
  if (
    key.includes("electrician") ||
    key.includes("veterinary") ||
    key.includes("vet") ||
    key.includes("service")
  ) {
    return "place.service.spatial_object";
  }
  if (key.includes("facility") || key.includes("shop")) {
    return type === "facility"
      ? "recreation.padel.spatial_object"
      : "place.shop.spatial_object";
  }
  if (type === "service") return "place.service.spatial_object";
  if (type === "facility") return "recreation.padel.spatial_object";
  if (type === "event") return "community.gathering.spatial_object";
  return "place.restaurant.spatial_object";
}

export function projectLocationToLifeMapObject(
  location: Location,
  territoryId: string,
): LifeMapObject | null {
  try {
    const type = lifeMapTypeForLocation(location.type);
    return projectLifeMapObject({
      tenantId: location.tenantId,
      territoryId,
      objectId: location.id,
      type,
      position: {
        lat: location.latitude,
        lng: location.longitude,
      },
      label: location.name,
      asset3DKey: assetKeyForCategory(location.category, location.type),
      availableActions: ["open", "navigate"],
      ref: {
        moduleId:
          type === "service"
            ? "services"
            : type === "experience"
              ? "experiences"
              : type === "resource"
                ? "resources"
                : "community",
        entityKind: "location",
        entityId: location.id,
      },
    });
  } catch {
    return null;
  }
}

export function projectLocationsToLifeMapObjects(
  locations: readonly Location[],
  territoryId: string,
): LifeMapObject[] {
  const objects: LifeMapObject[] = [];
  for (const location of locations) {
    const projected = projectLocationToLifeMapObject(location, territoryId);
    if (projected) objects.push(projected);
  }
  return objects;
}

export function locationContextEnrichment(location: Location): {
  label: string;
  summary: string;
  experienceTag: string;
  categoryHint: string;
  heroTone: string;
} {
  return {
    label: location.name,
    summary: location.geocodeDisplayName ?? location.address,
    experienceTag: locationCategoryLabel(location.category),
    categoryHint:
      location.type === "business"
        ? "Negocio"
        : location.type === "service"
          ? "Servicio"
          : location.type === "facility"
            ? "Instalación"
            : location.type === "event"
              ? "Evento"
              : "Lugar",
    heroTone: "#c4a890",
  };
}
