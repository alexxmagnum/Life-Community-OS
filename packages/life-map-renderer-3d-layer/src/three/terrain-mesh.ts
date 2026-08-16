/**
 * Flat terrain mesh pipeline — DEM-ready, flat until real elevation exists.
 */

import {
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type Material,
} from "three";

import type { LifeMap3DTerrainBoundsMeters } from "../terrain";

export function createFlatTerrainMesh(
  bounds: LifeMap3DTerrainBoundsMeters,
  material: Material,
): Mesh {
  const width = Math.max(bounds.maxX - bounds.minX, 10);
  const depth = Math.max(bounds.maxZ - bounds.minZ, 10);
  const geometry = new PlaneGeometry(width, depth, 1, 1);
  const mesh = new Mesh(geometry, material);
  mesh.name = "life-map-3d-terrain-flat";
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(
    (bounds.minX + bounds.maxX) / 2,
    0,
    (bounds.minZ + bounds.maxZ) / 2,
  );
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.userData.lifeMap3DTerrain = "flat";
  return mesh;
}

export function createTerrainMaterial(color = "#e8e4d8"): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0.02,
    transparent: true,
    opacity: 0.35,
  });
}
