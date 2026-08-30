/**
 * Life Map 3D asset pipeline — architectural GLB/glTF only.
 *
 * Asset → SpatialAssetRegistry → Territory Object → Renderer (MapLibre first).
 * Three/WebGL is a high-zoom enhancement, never the map.
 */

import {
  resolveSpatialAsset,
  shouldLoadSpatialGlb,
} from "@life-community-os/assets";
import { LIFE_MAP_LIVING_LOD } from "@life-community-os/types";

const ARCHITECTURAL_KEY_HINTS = [
  "gate",
  "security",
  "barrier",
  "parking",
  "pool",
  "padel",
  "sports",
  "clubhouse",
  "golf",
  "charger",
  "terrace",
  "tennis",
  "lake",
] as const;

const FORBIDDEN_KEY_HINTS = [
  "scene",
  "character",
  "person",
  "npc",
  "avatar",
  "decoration.prop",
] as const;

export function isArchitecturalTerritoryAsset(assetKey: string | undefined): boolean {
  if (!assetKey) return false;
  const key = assetKey.toLowerCase();
  if (FORBIDDEN_KEY_HINTS.some((hint) => key.includes(hint))) return false;
  if (resolveSpatialAsset(key)) return true;
  return ARCHITECTURAL_KEY_HINTS.some((hint) => key.includes(hint));
}

export function shouldLazyLoadTerritoryGlb(input: {
  zoom: number;
  assetKey?: string;
  modelPath?: string;
  visible?: boolean;
  hasPosition?: boolean;
}): boolean {
  if (input.modelPath) {
    const path = input.modelPath.toLowerCase();
    if (!path.endsWith(".glb") && !path.endsWith(".gltf")) return false;
  }
  if (input.zoom < LIFE_MAP_LIVING_LOD.detail3dMinZoom) return false;
  const asset = input.assetKey ? resolveSpatialAsset(input.assetKey) : null;
  if (!asset) return false;
  if (!isArchitecturalTerritoryAsset(input.assetKey)) return false;
  return shouldLoadSpatialGlb({
    zoom: input.zoom,
    asset,
    visible: input.visible,
    hasPosition: input.hasPosition ?? true,
  });
}
