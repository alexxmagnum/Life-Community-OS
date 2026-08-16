/**
 * Building footprint → extruded Three.js mesh (full + simplified LOD).
 */

import {
  BoxGeometry,
  ExtrudeGeometry,
  Mesh,
  Shape,
  type Material,
  type Object3D,
} from "three";

import type { LifeMap3DBuildingFeature } from "../buildings";
import type { LifeMap3DLodLevel } from "../lod";
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

/** Decimate ring for simplified LOD — fewer vertices, cleaner far meshes. */
function decimateRing(
  ring: Array<[number, number]>,
  stride: number,
): Array<[number, number]> {
  if (ring.length <= 6 || stride <= 1) return ring;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < ring.length - 1; i += stride) {
    const p = ring[i];
    if (p) out.push(p);
  }
  const first = ring[0];
  const last = out[out.length - 1];
  if (first && (!last || last[0] !== first[0] || last[1] !== first[1])) {
    out.push([first[0], first[1]]);
  }
  return out.length >= 4 ? out : ring;
}

function footprintBoundsLocal(
  ring: Array<[number, number]>,
  origin: LifeMap3DProjectionOrigin,
): { minX: number; maxX: number; minZ: number; maxZ: number } | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [lng, lat] of ring) {
    const { x, z } = lngLatToLocalMeters(lng, lat, origin);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, maxX, minZ, maxZ };
}

export type CreateBuildingMeshOptions = {
  lod?: LifeMap3DLodLevel;
};

/**
 * Build an extruded building mesh in local metres (Y-up).
 * Returns null when the footprint is invalid or LOD is culled.
 */
export function createBuildingExtrusionMesh(
  feature: LifeMap3DBuildingFeature,
  origin: LifeMap3DProjectionOrigin,
  heightMeters: number,
  material: Material,
  options: CreateBuildingMeshOptions = {},
): Mesh | null {
  const lod = options.lod ?? "full";
  if (lod === "culled") return null;

  const ring = closeRing(feature.footprint);
  if (ring.length < 4) return null;

  const height = Math.max(heightMeters, 0.5);

  if (lod === "simplified") {
    const bounds = footprintBoundsLocal(ring, origin);
    if (!bounds) return null;
    const w = Math.max(bounds.maxX - bounds.minX, 1);
    const d = Math.max(bounds.maxZ - bounds.minZ, 1);
    const geometry = new BoxGeometry(w, height, d);
    const mesh = new Mesh(geometry, material);
    mesh.name = `building:${feature.id}:lod-simplified`;
    mesh.position.set(
      (bounds.minX + bounds.maxX) / 2,
      height / 2,
      (bounds.minZ + bounds.maxZ) / 2,
    );
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData[LIFE_MAP_3D_BUILDING_USERDATA_KEY] = feature.id;
    mesh.userData.lifeMap3DLod = "simplified";
    return mesh;
  }

  const detailed = decimateRing(ring, 1);
  const shape = new Shape();
  for (let i = 0; i < detailed.length; i++) {
    const point = detailed[i];
    if (!point) continue;
    const [lng, lat] = point;
    const { x, z } = lngLatToLocalMeters(lng, lat, origin);
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }

  const geometry = new ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = `building:${feature.id}`;
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData[LIFE_MAP_3D_BUILDING_USERDATA_KEY] = feature.id;
  mesh.userData.lifeMap3DLod = "full";
  return mesh;
}

export function disposeObject3D(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      if (mesh.userData?.lifeMap3DOwnsMaterial) {
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          for (const m of mat) m.dispose();
        } else if (mat) {
          mat.dispose();
        }
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
