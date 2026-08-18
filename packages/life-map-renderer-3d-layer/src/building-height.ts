/**
 * Building height resolution — real data first, visual fallback only when absent.
 *
 * Future sources: Catastro height, CAD, private GIS.
 * Never invent per-building fake heights from ids.
 */

import {
  LIFE_MAP_3D_DEFAULT_BUILDING_HEIGHT_METERS,
  type LifeMap3DBuildingFeature,
} from "./buildings";

export type LifeMap3DBuildingHeightSource =
  | "feature"
  | "properties"
  | "fallback";

export type LifeMap3DBuildingHeightResult = {
  heightMeters: number;
  source: LifeMap3DBuildingHeightSource;
};

/** Soft premium fallback when no real height exists (community-scale, not skyscraper). */
export const LIFE_MAP_3D_VISUAL_FALLBACK_HEIGHT_METERS = 12;

/**
 * Read height from opaque GeoJSON-like properties when present.
 */
export function buildingHeightFromProperties(
  props: Record<string, unknown> | null | undefined,
): number | undefined {
  if (!props) return undefined;
  for (const key of [
    "height",
    "heightMeters",
    "building:levels",
    "levels",
    "numberOfFloors",
  ]) {
    const raw = props[key];
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      if (
        key === "building:levels" ||
        key === "levels" ||
        key === "numberOfFloors"
      ) {
        return raw * 3;
      }
      return raw;
    }
    if (typeof raw === "string") {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        if (
          key === "building:levels" ||
          key === "levels" ||
          key === "numberOfFloors"
        ) {
          return n * 3;
        }
        return n;
      }
    }
  }
  return undefined;
}

/**
 * Resolve extrusion height for one building feature.
 */
export function resolveBuildingHeight(
  feature: LifeMap3DBuildingFeature,
  defaultHeightMeters: number = LIFE_MAP_3D_DEFAULT_BUILDING_HEIGHT_METERS,
): LifeMap3DBuildingHeightResult {
  if (
    typeof feature.heightMeters === "number" &&
    Number.isFinite(feature.heightMeters) &&
    feature.heightMeters > 0
  ) {
    return { heightMeters: feature.heightMeters, source: "feature" };
  }
  const fromProps = buildingHeightFromProperties(feature.properties ?? null);
  if (fromProps !== undefined) {
    return { heightMeters: fromProps, source: "properties" };
  }
  const fallback =
    defaultHeightMeters > 0
      ? defaultHeightMeters
      : LIFE_MAP_3D_VISUAL_FALLBACK_HEIGHT_METERS;
  return { heightMeters: fallback, source: "fallback" };
}
