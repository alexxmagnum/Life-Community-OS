/**
 * Local layout → WGS84 using a known territory origin.
 *
 * Does NOT invent absolute GPS. Converts relative metres (east/north)
 * against a real geo origin (e.g. territory bounds center from OSM/Catastro).
 */

import type { LifeMapPosition } from "@life-community-os/types";

const METERS_PER_DEG_LAT = 111_320;

export type LifeMapGeoOrigin = {
  lat: number;
  lng: number;
};

export type LifeMapLocalMeters = {
  /** Metres east of origin. */
  x: number;
  /** Metres north of origin. */
  y: number;
  z?: number;
};

/**
 * Project local metres to WGS84 around a known origin.
 */
export function localMetersToGeo(
  local: LifeMapLocalMeters,
  origin: LifeMapGeoOrigin,
): { lat: number; lng: number; altitudeMeters?: number } {
  const metersPerDegLng =
    METERS_PER_DEG_LAT * Math.cos((origin.lat * Math.PI) / 180);
  const lng = origin.lng + local.x / Math.max(metersPerDegLng, 1e-6);
  const lat = origin.lat + local.y / METERS_PER_DEG_LAT;
  return {
    lat,
    lng,
    ...(typeof local.z === "number" ? { altitudeMeters: local.z } : {}),
  };
}

/**
 * Resolve a LifeMapPosition to geo when possible.
 * - Already geo → pass through
 * - Local anchor → project via origin (required)
 */
export function resolveLifeMapPositionToGeo(
  position: LifeMapPosition,
  origin: LifeMapGeoOrigin | null | undefined,
): { lat: number; lng: number } | null {
  if (
    position &&
    typeof (position as { lat?: unknown }).lat === "number" &&
    typeof (position as { lng?: unknown }).lng === "number"
  ) {
    return {
      lat: (position as { lat: number }).lat,
      lng: (position as { lng: number }).lng,
    };
  }
  if (
    position &&
    (position as { kind?: unknown }).kind === "local" &&
    typeof (position as { x?: unknown }).x === "number" &&
    typeof (position as { y?: unknown }).y === "number" &&
    origin
  ) {
    const local = position as { x: number; y: number; z?: number };
    return localMetersToGeo(
      { x: local.x, y: local.y, z: local.z },
      origin,
    );
  }
  return null;
}
