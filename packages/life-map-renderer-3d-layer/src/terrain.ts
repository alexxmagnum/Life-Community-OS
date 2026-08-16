/**
 * Terrain foundation for the hybrid 3D layer.
 *
 * Elevation is NEVER invented. Without a real DEM source the world stays flat.
 * Prepared for future DEM / IGN / private GIS providers.
 */

import type { LifeMapRendererCamera } from "@life-community-os/life-map-renderer";

/** How elevation is obtained — flat until a real DEM is injected. */
export type LifeMap3DElevationSourceKind = "flat" | "dem";

/**
 * Opaque elevation sampler contract.
 * `dem` is prepared but unused until a real raster / mesh provider exists.
 */
export type LifeMap3DElevationSource = {
  kind: LifeMap3DElevationSourceKind;
  /**
   * Sample elevation in metres at WGS84.
   * Flat sources always return 0. DEM sources must be real data — never noise.
   */
  sampleElevationMeters(lng: number, lat: number): number;
  /** Optional opaque provider id for future wiring (IGN, private DEM, …). */
  providerId?: string;
};

/** Correct flat fallback — no fake hills. */
export function createFlatElevationSource(
  providerId = "life-map.terrain.flat",
): LifeMap3DElevationSource {
  return {
    kind: "flat",
    providerId,
    sampleElevationMeters() {
      return 0;
    },
  };
}

/**
 * Placeholder DEM source factory — throws if sampled without real data.
 * Hosts must supply a real sampler; this never invents heights.
 */
export function createPreparedDemElevationSource(options: {
  providerId: string;
  sampleElevationMeters: (lng: number, lat: number) => number;
}): LifeMap3DElevationSource {
  return {
    kind: "dem",
    providerId: options.providerId,
    sampleElevationMeters: options.sampleElevationMeters,
  };
}

export type LifeMap3DTerrainBoundsMeters = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

/**
 * Derive a local terrain rectangle from the camera frame (metres around origin).
 * Used to size the flat ground mesh — not elevation.
 */
export function terrainBoundsFromCamera(
  camera: LifeMapRendererCamera,
  padMeters = 80,
): LifeMap3DTerrainBoundsMeters | null {
  const frame = camera.frame;
  if (!frame) return null;
  const midLat = (frame.south + frame.north) / 2;
  const midLng = (frame.west + frame.east) / 2;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = metersPerDegLat * Math.cos((midLat * Math.PI) / 180);
  const halfW =
    (Math.abs(frame.east - frame.west) * metersPerDegLng) / 2 + padMeters;
  const halfH =
    (Math.abs(frame.north - frame.south) * metersPerDegLat) / 2 + padMeters;
  // Origin is typically frame center — bounds are symmetric about 0.
  void midLng;
  return {
    minX: -halfW,
    maxX: halfW,
    minZ: -halfH,
    maxZ: halfH,
  };
}
