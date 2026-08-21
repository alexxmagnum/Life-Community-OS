/**
 * Life Map 3D asset pipeline — architectural GLB/glTF only.
 *
 * Asset → Registry → Territory Object → Renderer (MapLibre first).
 * Three/WebGL is a high-zoom enhancement, never the map.
 */

/** Matches LIFE_MAP_COMMERCIAL_LOD.detail3dMinZoom — kept local for node tests. */
const DETAIL_3D_MIN_ZOOM = 17.75;

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
  return ARCHITECTURAL_KEY_HINTS.some((hint) => key.includes(hint));
}

export function shouldLazyLoadTerritoryGlb(input: {
  zoom: number;
  assetKey?: string;
  modelPath?: string;
}): boolean {
  if (input.zoom < DETAIL_3D_MIN_ZOOM) return false;
  if (!input.modelPath) return false;
  const path = input.modelPath.toLowerCase();
  if (!path.endsWith(".glb") && !path.endsWith(".gltf")) return false;
  return isArchitecturalTerritoryAsset(input.assetKey);
}
