/**
 * Water pads + green pads + stylized vegetation instances (mobile budgets).
 */

import {
  ConeGeometry,
  CylinderGeometry,
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
  mesh.position.y = feature.kind === "water" ? -0.08 : 0.03;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.userData.lifeMap3DEnvironmentId = feature.id;
  mesh.userData.lifeMap3DEnvironmentKind = feature.kind;
  return mesh;
}

function sampleVegetationPositions(
  greenFeatures: readonly LifeMap3DEnvironmentFeature[],
  origin: LifeMap3DProjectionOrigin,
  maxInstances: number,
): Array<{ x: number; z: number; scale: number }> {
  const positions: Array<{ x: number; z: number; scale: number }> = [];

  for (const feature of greenFeatures) {
    if (feature.kind !== "green") continue;
    if (positions.length >= maxInstances) break;
    const centroid = footprintCentroid(feature.footprint);
    if (!centroid) continue;
    const { x, z } = lngLatToLocalMeters(centroid[0], centroid[1], origin);
    positions.push({ x, z, scale: 1 });

    const budget = Math.min(
      LIFE_MAP_3D_VEGETATION.maxPerPolygon - 1,
      maxInstances - positions.length,
    );
    for (let i = 0; i < budget; i++) {
      const angle = (i / Math.max(budget, 1)) * Math.PI * 2 + 0.4;
      const radius = 7 + (i % 3) * 3.5;
      positions.push({
        x: x + Math.cos(angle) * radius,
        z: z + Math.sin(angle) * radius,
        scale: 0.75 + (i % 3) * 0.15,
      });
      if (positions.length >= maxInstances) break;
    }
  }
  return positions;
}

/**
 * Stylized trees — canopy + trunk instancing (not photo forest).
 */
export function createVegetationInstances(
  greenFeatures: readonly LifeMap3DEnvironmentFeature[],
  origin: LifeMap3DProjectionOrigin,
  canopyMaterial: Material,
  trunkMaterial: Material,
  maxInstances: number = LIFE_MAP_3D_VEGETATION.maxInstances,
): Group | null {
  const positions = sampleVegetationPositions(
    greenFeatures,
    origin,
    maxInstances,
  );
  if (positions.length === 0) return null;

  const group = new Group();
  group.name = "life-map-3d-vegetation";

  const canopyGeo = new ConeGeometry(2.1, 5.2, 7);
  const trunkGeo = new CylinderGeometry(0.28, 0.38, 2.2, 6);
  const canopies = new InstancedMesh(canopyGeo, canopyMaterial, positions.length);
  const trunks = new InstancedMesh(trunkGeo, trunkMaterial, positions.length);
  canopies.castShadow = false;
  trunks.castShadow = false;

  const matrix = new Matrix4();
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    if (!p) continue;
    const s = p.scale;
    matrix.makeScale(s, s, s);
    matrix.setPosition(p.x, 4.2 * s, p.z);
    canopies.setMatrixAt(i, matrix);
    matrix.makeScale(s, s, s);
    matrix.setPosition(p.x, 1.1 * s, p.z);
    trunks.setMatrixAt(i, matrix);
  }
  canopies.instanceMatrix.needsUpdate = true;
  trunks.instanceMatrix.needsUpdate = true;
  group.add(trunks);
  group.add(canopies);
  group.userData.lifeMap3DVegetation = true;
  return group;
}

export function createEnvironmentGroup(): Group {
  const group = new Group();
  group.name = "life-map-3d-environment";
  return group;
}
