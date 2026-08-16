/**
 * Raycast selection helpers for the Three.js 3D layer.
 */

import { Raycaster, Vector2, type Camera, type Object3D } from "three";

import { findBuildingId } from "./building-meshes";
import { LIFE_MAP_3D_SPATIAL_USERDATA_KEY } from "./spatial-markers";

const raycaster = new Raycaster();
const pointer = new Vector2();

function findSpatialId(object: Object3D): string | null {
  let current: Object3D | null = object;
  while (current) {
    const id = current.userData?.[LIFE_MAP_3D_SPATIAL_USERDATA_KEY];
    if (typeof id === "string" && id.length > 0) return id;
    current = current.parent;
  }
  return null;
}

/**
 * Pick a building or spatial object id under NDC coordinates (x,y ∈ [-1, 1], y up).
 */
export function pickBuildingIdAt(
  ndcX: number,
  ndcY: number,
  camera: Camera,
  roots: readonly Object3D[],
): string | null {
  pointer.set(ndcX, ndcY);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...roots], true);
  for (const hit of hits) {
    const buildingId = findBuildingId(hit.object);
    if (buildingId) return buildingId;
    const spatialId = findSpatialId(hit.object);
    if (spatialId) return spatialId;
  }
  return null;
}
