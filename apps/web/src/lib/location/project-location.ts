/**
 * Project Location (SoT) → LifeMapObject via Experience Resolver.
 * MapLibre / Three consume LifeMapObject; they never own Location.
 */

import {
  projectLifeMapObject,
  type LifeMapActionKind,
  type LifeMapObject,
  type LifeMapObjectType,
  type Location,
  type LocationType,
} from "@life-community-os/types";

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
  try {
    const experience = resolveLocationExperience(location);
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

/** Context-card enrichment driven entirely by Location + Experience Resolver. */
export function locationContextEnrichment(location: Location): {
  label: string;
  summary: string;
  experienceTag: string;
  categoryHint: string;
  heroTone: string;
  availableActions: LifeMapActionKind[];
} {
  const experience = resolveLocationExperience(location);
  return {
    label: location.name,
    summary: `${experience.summary} · ${location.geocodeDisplayName ?? location.address}`,
    experienceTag: experience.categoryLabel,
    categoryHint: experience.typeHint,
    heroTone: experience.heroTone,
    availableActions: [...experience.availableActions],
  };
}
