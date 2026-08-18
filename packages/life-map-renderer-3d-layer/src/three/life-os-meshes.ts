/**
 * Life OS spatial meshes — premium venue catalog entry point.
 * Identity per LifeMapObject visual kind (restaurant / pool / sports / service).
 */

import { Group, Mesh, MeshStandardMaterial, type Material } from "three";

import type { LifeMap3DAssetVisualKind } from "../asset-visual";
import {
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "../projection";
import type { LifeMap3DSpatialObject } from "../spatial-object";
import { LIFE_MAP_3D_SPATIAL_USERDATA_KEY } from "./spatial-markers";
import { buildPremiumPlaceByKind } from "./premium-place-catalog";

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
 * Calibration scale — places as accents on real Earth (not toy diorama).
 * restaurant ×1.85 · pool ×1.85 · sports ×1.85 · services ×1.35
 */
const KIND_SCALE: Partial<Record<LifeMap3DAssetVisualKind, number>> = {
  restaurant: 2.15,
  cafe: 2.0,
  clubhouse: 2.0,
  pool: 2.2,
  golf: 1.85,
  padel: 2.15,
  service: 1.55,
  security: 1.4,
  house: 1.6,
  event: 1.7,
  shop: 1.7,
};

function tagSpatial(root: Group | Mesh, object: LifeMap3DSpatialObject) {
  root.userData[LIFE_MAP_3D_SPATIAL_USERDATA_KEY] = object.id;
  root.userData.lifeMap3DAsset3DKey = object.asset3DKey ?? null;
  root.userData.lifeMap3DInteractionType = object.interactionType ?? "select";
  root.userData.lifeMap3DOwnsMaterial = true;
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh) {
      mesh.userData[LIFE_MAP_3D_SPATIAL_USERDATA_KEY] = object.id;
      mesh.castShadow = true;
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
  const body = buildPremiumPlaceByKind(visualKind, color);
  const scale = KIND_SCALE[visualKind] ?? 1.5;
  body.scale.setScalar(scale);

  const root = new Group();
  root.name = `life-os:${object.id}`;
  const { x, z } = lngLatToLocalMeters(
    object.position.lng,
    object.position.lat,
    origin,
  );
  root.position.set(x, 0.02, z);
  root.add(body);
  tagSpatial(root, object);
  return root;
}

/** Soft selection emphasis for place heroes. */
export function setLifeOsSpatialSelected(root: Group, selected: boolean): void {
  root.scale.setScalar(selected ? 1.06 : 1);
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    const material = mesh.material as MeshStandardMaterial;
    if (!material || typeof material.emissiveIntensity !== "number") return;
    if (material.userData.lifeOsBaseEmissive == null) {
      material.userData.lifeOsBaseEmissive = material.emissiveIntensity;
    }
    const base = material.userData.lifeOsBaseEmissive as number;
    material.emissiveIntensity = selected ? Math.min(0.5, base + 0.2) : base;
    material.needsUpdate = true;
  });
}
