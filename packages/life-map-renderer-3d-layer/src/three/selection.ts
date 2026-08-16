/**
 * Raycast selection helpers for the Three.js 3D layer.
 */

import { Raycaster, Vector2, type Camera, type Object3D } from "three";

import { findBuildingId } from "./building-meshes";

const raycaster = new Raycaster();
const pointer = new Vector2();

/**
 * Pick a building id under NDC coordinates (x,y ∈ [-1, 1], y up).
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
    const id = findBuildingId(hit.object);
    if (id) return id;
  }
  return null;
}
