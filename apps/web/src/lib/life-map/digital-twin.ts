/**
 * Life Map digital twin helpers — MapLibre community view.
 * Location remains SoT. TerritoryObject is physical fabric.
 * Objects without WGS84 coordinates never appear.
 */

import type {
  CommunityFeedItem,
  LifeMapActionKind,
  LifeMapObject,
  LifeMapTerritory,
  Location,
  TerritoryObject,
} from "@life-community-os/types";
import {
  filterRenderableTerritoryObjects,
  lifeMapContextsFromFeed,
  projectTerritoryObjectsToLifeMapObjects,
} from "@life-community-os/types";
import type { TerritoryBounds } from "@life-community-os/types";

export function hasLifeMapGeoPosition(
  position: LifeMapObject["position"] | undefined,
): position is { lat: number; lng: number } {
  if (!position) return false;
  const lat = (position as { lat?: unknown }).lat;
  const lng = (position as { lng?: unknown }).lng;
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

export function filterLifeMapObjectsWithPosition(
  objects: readonly LifeMapObject[],
): LifeMapObject[] {
  return objects.filter((object) => hasLifeMapGeoPosition(object.position));
}

export function isTerritoryFabricObject(object: LifeMapObject): boolean {
  return object.type === "decoration" || String(object.layerId) === "territory";
}

/**
 * Pack extras that duplicate Location SoT or lack coordinates stay off the map.
 */
export function filterPackLocationObjects(
  packObjects: readonly LifeMapObject[],
): LifeMapObject[] {
  return filterLifeMapObjectsWithPosition(packObjects).filter(
    (object) => !isTerritoryFabricObject(object),
  );
}

export function territoryObjectsForTenant(
  objects: readonly TerritoryObject[],
  tenantId: string,
  territoryId: string,
): LifeMapObject[] {
  return projectTerritoryObjectsToLifeMapObjects(
    filterRenderableTerritoryObjects(objects, tenantId),
    tenantId,
    territoryId,
  );
}

export type LifeMapTapHref = {
  href: string | null;
  intent: "business" | "resource" | "property" | "territory" | "location";
};

/**
 * Tap → product surface. Never invents routes for objects without domain refs.
 */
export function resolveLifeMapTapHref(input: {
  object: LifeMapObject;
  location?: Location | null;
}): LifeMapTapHref {
  const { object, location } = input;
  if (isTerritoryFabricObject(object)) {
    return { href: null, intent: "territory" };
  }
  if (object.type === "housing") {
    const id = location?.id ?? object.ref?.entityId ?? object.objectId;
    return { href: `/housing/${encodeURIComponent(id)}`, intent: "property" };
  }
  if (object.type === "resource" || location?.type === "facility") {
    const resourceId =
      object.ref?.moduleId === "resources"
        ? object.ref.entityId
        : object.objectId;
    return {
      href: `/resources/${encodeURIComponent(resourceId)}/reserve`,
      intent: "resource",
    };
  }
  const locationId = location?.id ?? object.ref?.entityId ?? object.objectId;
  if (object.type === "place" || location?.type === "business") {
    return {
      href: `/locations/${encodeURIComponent(locationId)}`,
      intent: "business",
    };
  }
  return {
    href: `/locations/${encodeURIComponent(locationId)}`,
    intent: "location",
  };
}

export function bindLifeMapToActiveTerritory(
  mapTerritory: LifeMapTerritory,
  active: {
    territoryId: string | null;
    bounds?: TerritoryBounds;
  },
): LifeMapTerritory {
  if (!active.territoryId) return mapTerritory;
  return {
    ...mapTerritory,
    territoryId: active.territoryId,
    ...(active.bounds
      ? {
          bounds: {
            north: active.bounds.north,
            south: active.bounds.south,
            east: active.bounds.east,
            west: active.bounds.west,
          },
        }
      : {}),
  };
}

/**
 * Feed → Life Map marker context. Location remains SoT.
 * Does not touch MapLibre / Three — callers bind locationId to existing markers.
 */
export function feedMarkersForLifeMap(items: readonly CommunityFeedItem[]) {
  return lifeMapContextsFromFeed(items);
}

export function resolveLifeMapPrimaryAction(
  object: LifeMapObject,
): LifeMapActionKind {
  if (object.type === "resource") return "reserve";
  return "open";
}
