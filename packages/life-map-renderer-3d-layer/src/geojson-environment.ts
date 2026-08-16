/**
 * GeoJSON → environment features (water / green). No tenant knowledge.
 */

import type { LifeMap3DEnvironmentFeature } from "./environment";
import { outerRingsFromGeometry } from "./geo-rings";

function featuresFromCollection(
  geojson: unknown,
  kind: LifeMap3DEnvironmentFeature["kind"],
  idPrefix: string,
): LifeMap3DEnvironmentFeature[] {
  if (!geojson || typeof geojson !== "object") return [];

  const root = geojson as {
    type?: string;
    features?: unknown[];
  };

  const features: unknown[] =
    root.type === "FeatureCollection" && Array.isArray(root.features)
      ? root.features
      : root.type === "Feature"
        ? [geojson]
        : [];

  const out: LifeMap3DEnvironmentFeature[] = [];

  for (let i = 0; i < features.length; i++) {
    const f = features[i] as {
      type?: string;
      id?: unknown;
      properties?: Record<string, unknown>;
      geometry?: { type?: string; coordinates?: unknown };
    };
    if (!f || f.type !== "Feature" || !f.geometry) continue;

    const props = f.properties ?? {};
    const baseId =
      (typeof f.id === "string" && f.id) ||
      (typeof f.id === "number" && String(f.id)) ||
      (typeof props.id === "string" && props.id) ||
      `${idPrefix}-${i}`;

    const rings = outerRingsFromGeometry(f.geometry);
    for (let r = 0; r < rings.length; r++) {
      const footprint = rings[r];
      if (!footprint) continue;
      out.push({
        id: rings.length > 1 ? `${baseId}:${r}` : String(baseId),
        kind,
        footprint,
        properties: props,
      });
    }
  }

  return out;
}

export function waterFeaturesFromGeoJson(
  geojson: unknown,
): LifeMap3DEnvironmentFeature[] {
  return featuresFromCollection(geojson, "water", "water");
}

export function greenFeaturesFromGeoJson(
  geojson: unknown,
): LifeMap3DEnvironmentFeature[] {
  return featuresFromCollection(geojson, "green", "green");
}
