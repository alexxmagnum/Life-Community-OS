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
import { demoPlaceProfileFor } from "./demo-place-profile";

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

/**
 * Resolve map markers: Location SoT projections win; pack objects fill gaps
 * (e.g. before seed hydrate) and never hide registered businesses.
 */
export function resolveLifeMapObjectsWithLocations(
  packObjects: readonly LifeMapObject[],
  locations: readonly Location[],
  territoryId: string,
): LifeMapObject[] {
  const fromLocations = projectLocationsToLifeMapObjects(
    locations,
    territoryId,
  );
  const covered = new Set<string>();
  for (const obj of fromLocations) {
    covered.add(obj.objectId);
    if (obj.ref?.entityId) covered.add(obj.ref.entityId);
  }
  const extras: LifeMapObject[] = [];
  for (const packObj of packObjects) {
    const entityId = packObj.ref?.entityId;
    if (covered.has(packObj.objectId)) continue;
    if (entityId && covered.has(entityId)) continue;
    extras.push(packObj);
    covered.add(packObj.objectId);
    if (entityId) covered.add(entityId);
  }
  return [...fromLocations, ...extras];
}

/** Context-card enrichment driven by Location + Experience + demo lifestyle profile. */
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
  const demo = demoPlaceProfileFor({
    id: location.id,
    name: location.name,
  });
  return {
    label: location.name,
    summary: demo?.summary ?? experience.summary,
    experienceTag: experience.categoryLabel,
    categoryHint: experience.typeHint,
    heroTone: experience.heroTone,
    address: location.geocodeDisplayName ?? location.address,
    availableActions: [...experience.availableActions],
    ...(demo?.imageUrl ? { imageUrl: demo.imageUrl } : {}),
  };
}
