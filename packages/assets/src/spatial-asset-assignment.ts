/**
 * Future admin assignment: TerritoryObject.type → SpatialAsset.id
 * without editing renderer code. Platform defaults only — tenants store overrides later.
 */

import type { SpatialAsset } from "./spatial-asset";
import {
  resolveSpatialAsset,
  type SpatialAssetResolveContext,
} from "./spatial-asset-registry";

export type TerritorySpatialType =
  | "gate"
  | "security"
  | "parking"
  | "pool"
  | "sports"
  | "clubhouse"
  | "golf"
  | "lake"
  | "green"
  | "building";

export type TerritoryObjectAssetRef = {
  asset?: { key: string };
  type: TerritorySpatialType | (string & {});
  location?: unknown;
  geometry?: unknown;
};

export const DEFAULT_TERRITORY_SPATIAL_ASSIGNMENTS: Readonly<
  Partial<Record<TerritorySpatialType, string>>
> = {
  gate: "security-gate-v1",
  security: "security-booth-v1",
  parking: "parking-area-v1",
  pool: "pool-area-v1",
  sports: "padel-court-v1",
  clubhouse: "clubhouse-v1",
  golf: "golf-area-v1",
  lake: "lake-area-v1",
};

const adminOverrides = new Map<string, string>();

/** Admin path — assign a platform SpatialAsset to a territory type. */
export function assignSpatialAssetToTerritoryType(
  type: TerritorySpatialType,
  spatialAssetId: string,
): void {
  adminOverrides.set(type, spatialAssetId);
}

export function clearSpatialAssetAssignments(): void {
  adminOverrides.clear();
}

export function spatialAssetIdForTerritoryType(
  type: string,
): string | undefined {
  return (
    adminOverrides.get(type) ??
    DEFAULT_TERRITORY_SPATIAL_ASSIGNMENTS[type as TerritorySpatialType]
  );
}

/**
 * Resolve a mesh for a TerritoryObject.
 * Prefers explicit object.asset.key; falls back to type assignment.
 * Missing asset is valid — MapLibre fabric still renders.
 */
export function resolveSpatialAssetForTerritoryObject(
  object: TerritoryObjectAssetRef,
  context: SpatialAssetResolveContext = {},
): SpatialAsset | null {
  const key = object.asset?.key ?? spatialAssetIdForTerritoryType(object.type);
  if (!key) return null;
  const hasPosition =
    context.hasPosition !== undefined
      ? context.hasPosition
      : Boolean(object.location) || Boolean(object.geometry);
  return resolveSpatialAsset(key, { ...context, hasPosition });
}
