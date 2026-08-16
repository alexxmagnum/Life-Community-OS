/**
 * Spatial object foundation for future LifeMapObject product entry.
 *
 * Phase 3: markers + interaction + interaction — not full product (Housing / POIs).
 * Stays inside the 3D package; does not widen Core contracts.
 */

export type LifeMap3DSpatialInteractionType = "select" | "open" | "none";

/**
 * Minimal spatial object the 3D world can place.
 * Maps cleanly to future LifeMapObject { id, position, asset3DKey, … }.
 */
export type LifeMap3DSpatialObject = {
  id: string;
  position: { lat: number; lng: number };
  asset3DKey?: string;
  interactionType?: LifeMap3DSpatialInteractionType;
  /** Optional label for future HUD — unused in Phase 3 mesh. */
  label?: string;
};

/**
 * Project opaque scene objects (LifeMapScene.objects) into spatial markers
 * when they carry geo positions. Non-geo / incomplete objects are skipped.
 */
export function spatialObjectsFromSceneObjects(
  objects: readonly {
    objectId?: string;
    id?: string;
    position?: unknown;
    asset3DKey?: string;
    asset?: { assetKey?: string };
    label?: string;
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
      ...(obj.label ? { label: obj.label } : {}),
    });
  }
  return out;
}
