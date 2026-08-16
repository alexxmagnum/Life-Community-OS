/**
 * Building footprint → extruded Three.js mesh.
 */

import {
  ExtrudeGeometry,
  Mesh,
  Shape,
  type Material,
  type Object3D,
} from "three";

import type { LifeMap3DBuildingFeature } from "../buildings";
import {
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "../projection";

export const LIFE_MAP_3D_BUILDING_USERDATA_KEY = "lifeMap3DBuildingId";

function closeRing(
  ring: readonly (readonly [number, number])[],
): Array<[number, number]> {
  if (ring.length < 3) return [];
  const out: Array<[number, number]> = ring.map(([lng, lat]) => [lng, lat]);
  const first = out[0];
  const last = out[out.length - 1];
  if (!first || !last) return [];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    out.push([first[0], first[1]]);
  }
  return out;
}

/**
 * Build an extruded building mesh in local metres (Y-up).
 * Returns null when the footprint is invalid.
 */
export function createBuildingExtrusionMesh(
  feature: LifeMap3DBuildingFeature,
  origin: LifeMap3DProjectionOrigin,
  heightMeters: number,
  material: Material,
): Mesh | null {
  const ring = closeRing(feature.footprint);
  if (ring.length < 4) return null;

  const shape = new Shape();
  for (let i = 0; i < ring.length; i++) {
    const point = ring[i];
    if (!point) continue;
    const [lng, lat] = point;
    const { x, z } = lngLatToLocalMeters(lng, lat, origin);
    // Shape is XY; we map local x→x, z→y then rotate to Y-up.
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }

  const geometry = new ExtrudeGeometry(shape, {
    depth: Math.max(heightMeters, 0.5),
    bevelEnabled: false,
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = `building:${feature.id}`;
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData[LIFE_MAP_3D_BUILDING_USERDATA_KEY] = feature.id;
  return mesh;
}

export function disposeObject3D(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        // Shared materials disposed by layer — skip here.
      }
    }
  });
}

export function findBuildingId(object: Object3D): string | null {
  let current: Object3D | null = object;
  while (current) {
    const id = current.userData?.[LIFE_MAP_3D_BUILDING_USERDATA_KEY];
    if (typeof id === "string" && id.length > 0) return id;
    current = current.parent;
  }
  return null;
}
