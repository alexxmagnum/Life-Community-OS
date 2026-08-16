/**
 * Spatial object foundation for LifeMapObject product entry.
 *
 * Phase 4+: category-aware markers + interaction — not classic map pins.
 */

import type { LifeMapActionKind, LifeMapObjectType } from "@life-community-os/types";

export type LifeMap3DSpatialInteractionType = "select" | "open" | "none";

export type LifeMap3DSpatialCategory =
  | "places"
  | "services"
  | "community"
  | "sports"
  | "housing"
  | "other";

/**
 * Minimal spatial object the 3D world can place.
 * Bridges from LifeMapObject via life-map-renderer helpers.
 */
export type LifeMap3DSpatialObject = {
  id: string;
  position: { lat: number; lng: number };
  asset3DKey?: string;
  interactionType?: LifeMap3DSpatialInteractionType;
  category?: LifeMap3DSpatialCategory;
  objectType?: LifeMapObjectType;
  availableActions?: readonly LifeMapActionKind[];
  label?: string;
};

/**
 * Project opaque scene / product objects into spatial markers
 * when they carry geo positions. Non-geo objects are skipped.
 */
export function spatialObjectsFromSceneObjects(
  objects: readonly {
    objectId?: string;
    id?: string;
    position?: unknown;
    asset3DKey?: string;
    asset?: { assetKey?: string };
    label?: string;
    type?: LifeMapObjectType;
    availableActions?: readonly LifeMapActionKind[];
  }[],
): LifeMap3DSpatialObject[] {
  const out: LifeMap3DSpatialObject[] = [];
  for (const obj of objects) {
    const pos = obj.position as
      | { lat?: unknown; lng?: unknown }
      | undefined;
    if (
      !pos ||
      typeof pos.lat !== "number" ||
      typeof pos.lng !== "number" ||
      !Number.isFinite(pos.lat) ||
      !Number.isFinite(pos.lng)
    ) {
      continue;
    }
    const id =
      (typeof obj.objectId === "string" && obj.objectId) ||
      (typeof obj.id === "string" && obj.id) ||
      null;
    if (!id) continue;
    const asset3DKey =
      obj.asset3DKey ??
      (typeof obj.asset?.assetKey === "string" ? obj.asset.assetKey : undefined);
    out.push({
      id,
      position: { lat: pos.lat, lng: pos.lng },
      ...(asset3DKey ? { asset3DKey } : {}),
      interactionType: "select",
      ...(obj.type ? { objectType: obj.type } : {}),
      ...(obj.availableActions
        ? { availableActions: obj.availableActions }
        : {}),
      ...(obj.label ? { label: obj.label } : {}),
    });
  }
  return out;
}
