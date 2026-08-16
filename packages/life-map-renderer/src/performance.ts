/**
 * Performance / scale foundations for multi-tenant Life Map SaaS.
 * Budgets, versioning hints, lazy markers — no invented geometry.
 */

export type LifeMapPerformanceBudget = {
  maxBuildingMeshes: number;
  maxVegetationInstances: number;
  maxSpatialMarkers: number;
  maxPixelRatio: number;
  enableShadows: boolean;
  enableAntialias: boolean;
  lodRebuildZoomDelta: number;
};

export const LIFE_MAP_PERFORMANCE_BUDGETS = {
  mobile: {
    maxBuildingMeshes: 120,
    maxVegetationInstances: 24,
    maxSpatialMarkers: 24,
    maxPixelRatio: 1.5,
    enableShadows: false,
    enableAntialias: false,
    lodRebuildZoomDelta: 0.55,
  },
  desktop: {
    maxBuildingMeshes: 400,
    maxVegetationInstances: 48,
    maxSpatialMarkers: 80,
    maxPixelRatio: 2,
    enableShadows: true,
    enableAntialias: true,
    lodRebuildZoomDelta: 0.4,
  },
} as const satisfies Record<string, LifeMapPerformanceBudget>;

/**
 * Opaque data version token for territory packs / CDN cache keys.
 * Tenants supply versions; engines do not invent content.
 */
export type LifeMapDataVersionHint = {
  territoryId: string;
  /** Semantic or content hash from tenant pack / manifest. */
  version: string;
  /** Optional CDN base for future asset streaming. */
  assetCdnBaseUrl?: string;
};

export function lifeMapCacheKey(
  hint: LifeMapDataVersionHint,
  layer: string,
): string {
  return `life-map:${hint.territoryId}:${hint.version}:${layer}`;
}

/** Soft cap a list for SaaS safety (nearest-first when sorter provided). */
export function capLifeMapCollection<T>(
  items: readonly T[],
  max: number,
): T[] {
  if (items.length <= max) return [...items];
  return items.slice(0, max);
}
