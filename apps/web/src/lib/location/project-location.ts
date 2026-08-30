/**
 * Project Location (SoT) → LifeMapObject via Experience Resolver.
 * MapLibre / Three consume LifeMapObject; they never own Location.
 */

import {
  isLandmarkLocationType,
  projectLifeMapObject,
  type LifeMapActionKind,
  type LifeMapObject,
  type LifeMapObjectType,
  type Location,
  type LocationType,
} from "@life-community-os/types";

import { preferEntityMediaUrl } from "@/lib/media/media-policy";
import { resolveLocationExperience } from "./experience-resolver";

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

export function projectLocationToLifeMapObject(
  location: Location,
  territoryId: string,
): LifeMapObject | null {
  if (location.visibility === "private") return null;
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    location.latitude < -90 ||
    location.latitude > 90 ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    return null;
  }
  try {
    const experience = resolveLocationExperience(location);
    const type = lifeMapTypeForLocation(location.type);
    const landmark = isLandmarkLocationType(location.type);
    return projectLifeMapObject({
      tenantId: location.tenantId,
      territoryId,
      objectId: location.id,
      type,
      layerId: landmark
        ? "resources"
        : type === "service"
          ? "services"
          : type === "experience"
            ? "experiences"
            : type === "resource"
              ? "resources"
              : "community",
      position: {
        lat: location.latitude,
        lng: location.longitude,
      },
      label: location.name,
      asset3DKey: experience.representationKey,
      availableActions: [...experience.availableActions],
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

/**
 * Location SoT projections only — pack extras are never runtime markers.
 */
export function resolveLifeMapObjectsWithLocations(
  packObjects: readonly LifeMapObject[],
  locations: readonly Location[],
  territoryId: string,
): LifeMapObject[] {
  void packObjects;
  return projectLocationsToLifeMapObjects(locations, territoryId);
}

/** Context-card enrichment from Location SoT — not demo lifestyle copy. */
export function locationContextEnrichment(location: Location): {
  label: string;
  summary: string;
  experienceTag: string;
  categoryHint: string;
  heroTone: string;
  address: string;
  availableActions: LifeMapActionKind[];
  imageUrl?: string;
} {
  const experience = resolveLocationExperience(location);
  const imageUrl = preferEntityMediaUrl(undefined, location.imageUrl);
  return {
    label: location.name,
    summary:
      location.summary?.trim() ||
      `${location.name} · ${experience.typeHint}`,
    experienceTag: experience.categoryLabel,
    categoryHint: experience.typeHint,
    heroTone: experience.heroTone,
    address: location.geocodeDisplayName ?? location.address,
    availableActions: [...experience.availableActions],
    ...(imageUrl ? { imageUrl } : {}),
  };
}
