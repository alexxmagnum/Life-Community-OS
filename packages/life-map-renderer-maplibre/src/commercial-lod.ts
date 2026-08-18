/**
 * Commercial Life Map LOD — zoom bands for Google Earth / Apple Maps feel.
 * MapLibre owns the world; Three is optional street-level accent only.
 */

export const LIFE_MAP_COMMERCIAL_LOD = {
  /** Territory overview — satellite/terrain/roads dominate. */
  territoryMaxZoom: 15.25,
  /** Important places + premium pins + real building mass. */
  placesMinZoom: 15.25,
  placesMaxZoom: 17.75,
  /** Optional grounded 3D accents (never floating toy venues). */
  detail3dMinZoom: 17.75,
} as const;

export type LifeMapCommercialLodBand = "territory" | "places" | "detail3d";

export function resolveLifeMapCommercialLod(
  zoom: number,
): LifeMapCommercialLodBand {
  if (zoom >= LIFE_MAP_COMMERCIAL_LOD.detail3dMinZoom) return "detail3d";
  if (zoom >= LIFE_MAP_COMMERCIAL_LOD.placesMinZoom) return "places";
  return "territory";
}

/**
 * Whether the Three overlay may show spatial place accents.
 * Without professional grounded assets, stay MapLibre-only (pins/cards).
 * Zoom gate retained for future GLTF accents at street level.
 */
export function shouldShowGrounded3dAccents(zoom: number): boolean {
  // Commercial lock: no procedural Three place accents (kills diorama feel).
  void zoom;
  return false;
}
