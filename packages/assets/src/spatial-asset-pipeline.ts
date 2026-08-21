/**
 * Spatial GLB load policy — independent of MapLibre camera internals.
 *
 * Zoom bajo: no GLB.
 * Zoom medio: LOD2 landmarks only.
 * Zoom alto: LOD1 / LOD0.
 */

import {
  selectSpatialAssetLodUrl,
  type SpatialAsset,
} from "./spatial-asset";

export const SPATIAL_GLB_ZOOM = {
  noneBelow: 14.85,
  landmarkMin: 14.85,
  detailMin: 16.45,
  streetMin: 17.75,
} as const;

export function shouldLoadSpatialGlb(input: {
  zoom: number;
  visible?: boolean;
  hasPosition?: boolean;
  asset?: SpatialAsset | null;
}): boolean {
  if (input.visible === false) return false;
  if (input.hasPosition === false) return false;
  if (!input.asset) return false;
  if (input.zoom < SPATIAL_GLB_ZOOM.noneBelow) return false;
  return selectSpatialAssetLodUrl(input.asset, input.zoom) != null;
}

export function spatialGlbUrlForView(input: {
  asset: SpatialAsset;
  zoom: number;
  visible?: boolean;
  hasPosition?: boolean;
}): string | null {
  if (!shouldLoadSpatialGlb(input)) return null;
  return selectSpatialAssetLodUrl(input.asset, input.zoom)?.url ?? null;
}
