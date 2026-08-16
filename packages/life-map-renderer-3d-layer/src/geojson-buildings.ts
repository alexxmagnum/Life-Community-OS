/**
 * Helpers to map opaque GeoJSON building footprints → LifeMap3DBuildingFeature.
 * No tenant knowledge — host supplies already-resolved GeoJSON.
 */

import type { LifeMap3DBuildingFeature } from "./buildings";

type LonLat = [number, number];

function asLonLatPair(value: unknown): LonLat | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = value[0];
  const lat = value[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

function ringFromCoords(coords: unknown): LonLat[] | null {
  if (!Array.isArray(coords) || coords.length < 3) return null;
  const ring: LonLat[] = [];
  for (const c of coords) {
    const pair = asLonLatPair(c);
    if (!pair) return null;
    ring.push(pair);
  }
  return ring;
}

function heightFromProps(
  props: Record<string, unknown> | null | undefined,
): number | undefined {
  if (!props) return undefined;
  for (const key of ["height", "heightMeters", "building:levels", "levels"]) {
    const raw = props[key];
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      if (key === "building:levels" || key === "levels") return raw * 3;
      return raw;
    }
    if (typeof raw === "string") {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        if (key === "building:levels" || key === "levels") return n * 3;
        return n;
      }
    }
  }
  return undefined;
}

/**
 * Convert a GeoJSON Feature / FeatureCollection (opaque) into building features.
 * Only Polygon / MultiPolygon geometries are accepted.
 */
export function buildingFeaturesFromGeoJson(
  geojson: unknown,
): LifeMap3DBuildingFeature[] {
  if (!geojson || typeof geojson !== "object") return [];

  const root = geojson as {
    type?: string;
    features?: unknown[];
    geometry?: { type?: string; coordinates?: unknown };
    id?: unknown;
    properties?: Record<string, unknown>;
  };

  const features: unknown[] =
    root.type === "FeatureCollection" && Array.isArray(root.features)
      ? root.features
      : root.type === "Feature"
        ? [root]
        : [];

  const out: LifeMap3DBuildingFeature[] = [];

  for (let i = 0; i < features.length; i++) {
    const f = features[i] as {
      type?: string;
      id?: unknown;
      properties?: Record<string, unknown>;
      geometry?: { type?: string; coordinates?: unknown };
    };
    if (!f || f.type !== "Feature" || !f.geometry) continue;

    const props = f.properties ?? {};
    const id =
      (typeof f.id === "string" && f.id) ||
      (typeof f.id === "number" && String(f.id)) ||
      (typeof props.id === "string" && props.id) ||
      `building-${i}`;

    const geom = f.geometry;
    let footprint: LonLat[] | null = null;

    if (geom.type === "Polygon") {
      const coords = geom.coordinates;
      if (Array.isArray(coords) && coords.length > 0) {
        footprint = ringFromCoords(coords[0]);
      }
    } else if (geom.type === "MultiPolygon") {
      const coords = geom.coordinates;
      if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
        footprint = ringFromCoords(coords[0][0]);
      }
    }

    if (!footprint) continue;

    out.push({
      id: String(id),
      footprint,
      heightMeters: heightFromProps(props),
      properties: props,
    });
  }

  return out;
}
