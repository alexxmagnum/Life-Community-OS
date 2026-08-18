/**
 * Life OS spatial meshes — grounded commercial accents (not toy venues).
 * Anchored to Location lat/lng via lngLatToLocalMeters (same origin as MapLibre sync).
 * Prefer MapLibre premium pins; these only appear at street zoom when needed.
 */

import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Material,
} from "three";

import type { LifeMap3DAssetVisualKind } from "../asset-visual";
import {
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "../projection";
import type { LifeMap3DSpatialObject } from "../spatial-object";
import { LIFE_MAP_3D_SPATIAL_USERDATA_KEY } from "./spatial-markers";

const KIND_COLOR: Record<LifeMap3DAssetVisualKind, string> = {
  restaurant: "#c47848",
  cafe: "#d4a060",
  shop: "#c45c5c",
  pool: "#2a9ad4",
  golf: "#3d9a45",
  padel: "#2f8a5a",
  clubhouse: "#d8b070",
  service: "#5a8eb8",
  house: "#e0c8a0",
  security: "#8a7860",
  event: "#d4a050",
  alert: "#d45040",
  path: "#4aaa55",
  generic: "#5a9aaa",
};

/**
 * Build a grounded premium pin — disk on ground + short stem + soft head.
 * No floating furniture / diorama plates.
 */
function buildGroundedPremiumPin(color: string): Group {
  const g = new Group();
  const disc = new Mesh(
    new CylinderGeometry(1.1, 1.1, 0.08, 24),
    new MeshStandardMaterial({
      color: "#f7f2ea",
      roughness: 0.85,
      metalness: 0.02,
      transparent: true,
      opacity: 0.92,
    }),
  );
  disc.position.y = 0.04;

  const stem = new Mesh(
    new CylinderGeometry(0.14, 0.18, 2.4, 12),
    new MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.12,
      emissive: color,
      emissiveIntensity: 0.06,
    }),
  );
  stem.position.y = 1.25;

  const head = new Mesh(
    new SphereGeometry(0.55, 18, 14),
    new MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.1,
      emissive: color,
      emissiveIntensity: 0.08,
    }),
  );
  head.position.y = 2.55;

  g.add(disc, stem, head);
  return g;
}

function tagSpatial(root: Group | Mesh, object: LifeMap3DSpatialObject) {
  root.userData[LIFE_MAP_3D_SPATIAL_USERDATA_KEY] = object.id;
  root.userData.lifeMap3DAsset3DKey = object.asset3DKey ?? null;
  root.userData.lifeMap3DInteractionType = object.interactionType ?? "select";
  root.userData.lifeMap3DOwnsMaterial = true;
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh) {
      mesh.userData[LIFE_MAP_3D_SPATIAL_USERDATA_KEY] = object.id;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
    }
  });
}

export function createLifeOsSpatialMesh(
  object: LifeMap3DSpatialObject,
  origin: LifeMap3DProjectionOrigin,
  visualKind: LifeMap3DAssetVisualKind,
  _sharedMaterial?: Material,
): Group {
  const color = KIND_COLOR[visualKind] ?? KIND_COLOR.generic;
  const body = buildGroundedPremiumPin(color);
  // Human-scale accent on real Earth — never toy-diorama size.
  body.scale.setScalar(0.55);

  const root = new Group();
  root.name = `life-os:${object.id}`;
  const { x, z } = lngLatToLocalMeters(
    object.position.lng,
    object.position.lat,
    origin,
  );
  // Sit on the ground plane — no floating Y offset.
  root.position.set(x, 0, z);
  root.add(body);
  tagSpatial(root, object);
  return root;
}

/** Soft selection emphasis for place heroes. */
export function setLifeOsSpatialSelected(root: Group, selected: boolean): void {
  root.scale.setScalar(selected ? 1.08 : 1);
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    const material = mesh.material as MeshStandardMaterial;
    if (!material || typeof material.emissiveIntensity !== "number") return;
    if (material.userData.lifeOsBaseEmissive == null) {
      material.userData.lifeOsBaseEmissive = material.emissiveIntensity;
    }
    const base = material.userData.lifeOsBaseEmissive as number;
    material.emissiveIntensity = selected ? base + 0.12 : base;
  });
}
