/**
 * Water pads + green pads + sparse vegetation instances (scalable architecture).
 */

import {
  ConeGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Shape,
  type Material,
} from "three";

import type { LifeMap3DEnvironmentFeature } from "../environment";
import { LIFE_MAP_3D_VEGETATION } from "../environment";
import { footprintCentroid } from "../geo-rings";
import {
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "../projection";

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

function shapeFromFootprint(
  footprint: readonly (readonly [number, number])[],
  origin: LifeMap3DProjectionOrigin,
): Shape | null {
  const ring = closeRing(footprint);
  if (ring.length < 4) return null;
  const shape = new Shape();
  for (let i = 0; i < ring.length; i++) {
    const point = ring[i];
    if (!point) continue;
    const { x, z } = lngLatToLocalMeters(point[0], point[1], origin);
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  return shape;
}

/**
 * Thin extruded pad for water / green polygons (depth cue, not photoreal water).
 */
export function createEnvironmentPadMesh(
  feature: LifeMap3DEnvironmentFeature,
  origin: LifeMap3DProjectionOrigin,
  material: Material,
  depthMeters: number,
): Mesh | null {
  const shape = shapeFromFootprint(feature.footprint, origin);
  if (!shape) return null;
  const geometry = new ExtrudeGeometry(shape, {
    depth: Math.max(depthMeters, 0.05),
    bevelEnabled: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = `${feature.kind}:${feature.id}`;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = feature.kind === "water" ? -0.05 : 0.02;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.userData.lifeMap3DEnvironmentId = feature.id;
  mesh.userData.lifeMap3DEnvironmentKind = feature.kind;
  return mesh;
}

/**
 * Build a limited InstancedMesh of simple tree cones over green polygons.
 * Architecture for scale — caps prevent thousands of objects.
 */
export function createVegetationInstances(
  greenFeatures: readonly LifeMap3DEnvironmentFeature[],
  origin: LifeMap3DProjectionOrigin,
  material: Material,
): InstancedMesh | null {
  const positions: Array<{ x: number; z: number }> = [];

  for (const feature of greenFeatures) {
    if (feature.kind !== "green") continue;
    if (positions.length >= LIFE_MAP_3D_VEGETATION.maxInstances) break;
    const centroid = footprintCentroid(feature.footprint);
    if (!centroid) continue;
    const { x, z } = lngLatToLocalMeters(centroid[0], centroid[1], origin);
    positions.push({ x, z });

    // Sparse offsets around centroid — not dense forest.
    const budget = Math.min(
      LIFE_MAP_3D_VEGETATION.maxPerPolygon - 1,
      LIFE_MAP_3D_VEGETATION.maxInstances - positions.length,
    );
    for (let i = 0; i < budget; i++) {
      const angle = (i / Math.max(budget, 1)) * Math.PI * 2;
      const radius = 8 + (i % 3) * 4;
      positions.push({
        x: x + Math.cos(angle) * radius,
        z: z + Math.sin(angle) * radius,
      });
      if (positions.length >= LIFE_MAP_3D_VEGETATION.maxInstances) break;
    }
  }

  if (positions.length === 0) return null;

  const geometry = new ConeGeometry(1.6, 6.5, 6);
  const mesh = new InstancedMesh(geometry, material, positions.length);
  mesh.name = "life-map-3d-vegetation";
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.lifeMap3DVegetation = true;

  const matrix = new Matrix4();
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    if (!p) continue;
    matrix.makeTranslation(p.x, 3.2, p.z);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

export function createEnvironmentGroup(): Group {
  const group = new Group();
  group.name = "life-map-3d-environment";
  return group;
}
