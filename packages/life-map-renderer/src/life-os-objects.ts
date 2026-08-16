/**
 * Life OS object helpers for spatial presentation.
 * Category / interaction mapping — no tenant or domain logic.
 */

import type {
  LifeMapActionKind,
  LifeMapObject,
  LifeMapObjectType,
} from "@life-community-os/types";

import {
  resolveLifeMapPositionToGeo,
  type LifeMapGeoOrigin,
} from "./local-to-geo";
import { toLifeMapRenderableObject } from "./object";

/** Product-facing spatial categories for twin UX (derived from object type). */
export type LifeMapSpatialCategory =
  | "places"
  | "services"
  | "community"
  | "sports"
  | "housing"
  | "other";

export function lifeMapSpatialCategoryForType(
  type: LifeMapObjectType,
): LifeMapSpatialCategory {
  switch (type) {
    case "place":
    case "poi":
      return "places";
    case "service":
      return "services";
    case "community":
    case "experience":
    case "official":
      return "community";
    case "resource":
      return "sports";
    case "housing":
    case "decoration":
      return "housing";
    default:
      return "other";
  }
}

export type LifeMapSpatialInteractionType = "select" | "open" | "none";

export function lifeMapInteractionTypeForActions(
  actions: readonly LifeMapActionKind[],
): LifeMapSpatialInteractionType {
  if (actions.includes("open") || actions.includes("navigate")) return "open";
  if (actions.length > 0) return "select";
  return "none";
}

/**
 * Bridge LifeMapObject → geo spatial descriptor for Three / MapLibre.
 */
export type LifeMapSpatialBridgeObject = {
  id: string;
  position: { lat: number; lng: number };
  category: LifeMapSpatialCategory;
  type: LifeMapObjectType;
  asset3DKey?: string;
  interactionType: LifeMapSpatialInteractionType;
  availableActions: readonly LifeMapActionKind[];
  label?: string;
  domainRef?: {
    moduleId: string;
    entityId: string;
    entityKind?: string;
  };
};

export function bridgeLifeMapObjectToSpatial(
  object: LifeMapObject,
  origin: LifeMapGeoOrigin | null | undefined,
): LifeMapSpatialBridgeObject | null {
  const geo = resolveLifeMapPositionToGeo(object.position, origin);
  if (!geo) return null;
  const renderable = toLifeMapRenderableObject(object);
  return {
    id: object.objectId,
    position: geo,
    category: lifeMapSpatialCategoryForType(object.type),
    type: object.type,
    ...(object.asset3DKey ? { asset3DKey: object.asset3DKey } : {}),
    interactionType: lifeMapInteractionTypeForActions(
      object.availableActions,
    ),
    availableActions: renderable.availableActions,
    ...(object.label ? { label: object.label } : {}),
    ...(renderable.domainRef ? { domainRef: renderable.domainRef } : {}),
  };
}

export function bridgeLifeMapObjectsToSpatial(
  objects: readonly LifeMapObject[],
  origin: LifeMapGeoOrigin | null | undefined,
): LifeMapSpatialBridgeObject[] {
  const out: LifeMapSpatialBridgeObject[] = [];
  for (const object of objects) {
    const bridged = bridgeLifeMapObjectToSpatial(object, origin);
    if (bridged) out.push(bridged);
  }
  return out;
}
