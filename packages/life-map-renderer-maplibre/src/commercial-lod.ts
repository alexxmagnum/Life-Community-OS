/**
 * Life Map LOD — community seen from above, then zone, then detail.
 * MapLibre owns the world; Three is optional high-zoom architectural accent.
 *
 * ZOOM BAJO  — territory fabric (golf, lakes, greens, zones). No small pins.
 * ZOOM MEDIO — landmarks / facilities / important buildings.
 * ZOOM ALTO  — Location SoT (business, resource, service) + optional GLB.
 */

export const LIFE_MAP_COMMERCIAL_LOD = {
  /** Amenity fills (golf / lake / green) become visible. */
  territoryFabricMinZoom: 12.4,
  /** Community overview — no Location pins yet. */
  territoryMaxZoom: 14.85,
  /** Mid-zoom landmarks (gate, clubhouse, parking, sports). */
  landmarkMinZoom: 14.85,
  landmarkMaxZoom: 16.45,
  /** High-zoom Location SoT + small territory details. */
  placesMinZoom: 16.45,
  placesMaxZoom: 18.2,
  detailMinZoom: 16.45,
  /** Optional grounded 3D accents (never floating toy venues). */
  detail3dMinZoom: 17.75,
} as const;

export type LifeMapCommercialLodBand =
  | "territory"
  | "landmark"
  | "places"
  | "detail3d";

export function resolveLifeMapCommercialLod(
  zoom: number,
): LifeMapCommercialLodBand {
  if (zoom >= LIFE_MAP_COMMERCIAL_LOD.detail3dMinZoom) return "detail3d";
  if (zoom >= LIFE_MAP_COMMERCIAL_LOD.placesMinZoom) return "places";
  if (zoom >= LIFE_MAP_COMMERCIAL_LOD.landmarkMinZoom) return "landmark";
  return "territory";
}

/**
 * Whether the Three overlay may show grounded architectural GLB accents.
 * Requires high zoom AND a real glTF/GLB (never procedural diorama meshes).
 */
export function shouldShowGrounded3dAccents(
  zoom: number,
  options?: { hasGroundedAssets?: boolean },
): boolean {
  if (!options?.hasGroundedAssets) return false;
  return zoom >= LIFE_MAP_COMMERCIAL_LOD.detail3dMinZoom;
}

/** TEST 7 — low/mid zoom must not request 3D models. */
export function shouldLoadTerritoryAssets(zoom: number): boolean {
  return zoom >= LIFE_MAP_COMMERCIAL_LOD.detail3dMinZoom;
}
