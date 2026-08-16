/**
 * Shared GeoJSON ring helpers for 3D territory adapters.
 * No tenant / provider knowledge.
 */

export type LonLat = [number, number];

export function asLonLatPair(value: unknown): LonLat | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = value[0];
  const lat = value[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

export function ringFromCoords(coords: unknown): LonLat[] | null {
  if (!Array.isArray(coords) || coords.length < 3) return null;
  const ring: LonLat[] = [];
  for (const c of coords) {
    const pair = asLonLatPair(c);
    if (!pair) return null;
    ring.push(pair);
  }
  return ring;
}

export function footprintCentroid(
  ring: readonly (readonly [number, number])[],
): LonLat | null {
  if (ring.length < 3) return null;
  let sumLng = 0;
  let sumLat = 0;
  let n = 0;
  for (const point of ring) {
    if (!point) continue;
    sumLng += point[0];
    sumLat += point[1];
    n += 1;
  }
  if (n === 0) return null;
  return [sumLng / n, sumLat / n];
}

/**
 * Extract outer rings from Polygon / MultiPolygon Feature geometry.
 */
export function outerRingsFromGeometry(geometry: {
  type?: string;
  coordinates?: unknown;
}): LonLat[][] {
  if (!geometry?.type) return [];
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) return [];
    const ring = ringFromCoords(coords[0]);
    return ring ? [ring] : [];
  }
  if (geometry.type === "MultiPolygon") {
    const coords = geometry.coordinates;
    if (!Array.isArray(coords)) return [];
    const rings: LonLat[][] = [];
    for (const poly of coords) {
      if (!Array.isArray(poly) || poly.length === 0) continue;
      const ring = ringFromCoords(poly[0]);
      if (ring) rings.push(ring);
    }
    return rings;
  }
  return [];
}
