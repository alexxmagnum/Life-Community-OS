/**
 * Life OS object frontier for MapLibre.
 *
 * Prepares the mapping LifeMapRenderableObject → MapLibre hook points.
 * Does NOT render 3D models or markers yet — registry only.
 */

import type { LifeMapRenderableObject } from "@life-community-os/life-map-renderer";

/** Stable MapLibre custom-layer / source id for a Life OS object (future). */
export function mapLibreObjectSourceId(objectId: string): string {
  return `lm-obj-src:${objectId}`;
}

export function mapLibreObjectLayerId(objectId: string): string {
  return `lm-obj-lyr:${objectId}`;
}

/**
 * Planned object binding — hook for a future marker / symbol / custom layer.
 * No MapLibre mutations here until geometry / icon strategy exists.
 */
export type MapLibreObjectBinding = {
  objectId: string;
  layerId: string;
  sourceId: string;
  productLayerId: string;
  type: LifeMapRenderableObject["type"];
  /** Opaque asset key if present — not loaded. */
  assetKey?: string;
  label?: string;
};

export function planMapLibreObjectBinding(
  object: LifeMapRenderableObject,
): MapLibreObjectBinding {
  return {
    objectId: object.objectId,
    layerId: mapLibreObjectLayerId(object.objectId),
    sourceId: mapLibreObjectSourceId(object.objectId),
    productLayerId: String(object.layerId),
    type: object.type,
    assetKey: object.asset?.assetKey,
    label: object.label,
  };
}

/**
 * Sync Life OS objects into an in-memory frontier registry.
 * MapLibre layers for objects are intentionally not created yet.
 */
export function syncMapLibreObjectFrontier(
  objects: readonly LifeMapRenderableObject[],
): MapLibreObjectBinding[] {
  return objects.map(planMapLibreObjectBinding);
}
