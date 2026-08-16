/**
 * Provisional planar geo → local metres for extrusion.
 * Not a full cartographic engine — good enough for neighbourhood AOIs.
 */

import type { LifeMapRendererCamera } from "@life-community-os/life-map-renderer";

const METERS_PER_DEG_LAT = 111_320;

export type LifeMap3DLocalPoint = { x: number; z: number };

export type LifeMap3DProjectionOrigin = {
  lat: number;
  lng: number;
};

export function resolveProjectionOrigin(
  camera: LifeMapRendererCamera,
): LifeMap3DProjectionOrigin | null {
  const target = camera.pose.target;
  if (
    target &&
    typeof (target as { lat?: unknown }).lat === "number" &&
    typeof (target as { lng?: unknown }).lng === "number"
  ) {
    return {
      lat: (target as { lat: number }).lat,
      lng: (target as { lng: number }).lng,
    };
  }
  if (camera.frame) {
    return {
      lat: (camera.frame.south + camera.frame.north) / 2,
      lng: (camera.frame.west + camera.frame.east) / 2,
    };
  }
  return null;
}

/**
 * Convert WGS84 [lng, lat] to local metres relative to origin (Y-up world: x east, z south).
 */
export function lngLatToLocalMeters(
  lng: number,
  lat: number,
  origin: LifeMap3DProjectionOrigin,
): LifeMap3DLocalPoint {
  const metersPerDegLng =
    METERS_PER_DEG_LAT * Math.cos((origin.lat * Math.PI) / 180);
  return {
    x: (lng - origin.lng) * metersPerDegLng,
    z: -(lat - origin.lat) * METERS_PER_DEG_LAT,
  };
}
