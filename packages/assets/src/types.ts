/**
 * Runtime 3D asset types for Life Community OS.
 * Keep these aligned with apps/web/public/assets/3d/manifest.json — not the master library catalog.
 *
 * One registry serves both:
 * - UI surfaces (AssetPad / cards / scenes / symbols)
 * - Life Map spatial projections (`LifeMapObject.asset3DKey`)
 */

// ── UI asset types (existing product surfaces) ───────────────

/** Interface / product-surface asset kinds. */
export type UiAssetType =
  | "symbol"
  | "card"
  | "object"
  | "scene"
  | "hero"
  | "branding";

export const UI_ASSET_TYPES: readonly UiAssetType[] = [
  "symbol",
  "card",
  "object",
  "scene",
  "hero",
  "branding",
] as const;

// ── Spatial asset types (Life Map / twin) ────────────────────

/**
 * Spatial twin asset kinds — same registry, different consumption path.
 * Do not confuse with UI `object` (pad/decorative webp).
 */
export type SpatialAssetType =
  | "spatial_object"
  | "terrain"
  | "building"
  | "avatar";

export const SPATIAL_ASSET_TYPES: readonly SpatialAssetType[] = [
  "spatial_object",
  "terrain",
  "building",
  "avatar",
] as const;

/** Full registry type union — UI + spatial. */
export type AssetType = UiAssetType | SpatialAssetType;

export const ASSET_TYPES: readonly AssetType[] = [
  ...UI_ASSET_TYPES,
  ...SPATIAL_ASSET_TYPES,
] as const;

/** Which product surface primarily consumes the asset. */
export type AssetSurface = "ui" | "spatial";

/**
 * Spatial library category (SaaS vocabulary).
 * Prefer these over legacy poi/structure aliases.
 * Full taxonomy + subtypes: `./spatial-library`.
 */
export type AssetSpatialCategory =
  | "terrain"
  | "building"
  | "place"
  | "mobility"
  | "community"
  | "recreation"
  | "nature"
  | "avatar"
  | "utility"
  /** @deprecated Prefer `place` */
  | "poi"
  /** @deprecated Prefer `building` */
  | "structure"
  /** @deprecated Prefer `avatar` */
  | "character"
  /** @deprecated Prefer `utility` */
  | "decoration"
  /** @deprecated Prefer `utility` or `place` */
  | "amenity"
  | (string & {});

export type AssetSpatialLodLevel = {
  /** Lower = coarser. */
  level: number;
  /**
   * Opaque LOD reference — AssetKey or path under /assets/3d/.
   * Not a binary payload.
   */
  ref: string;
};

export type AssetSpatialScale = number | { x: number; y: number; z: number };

/** Placement pivot relative to LifeMapObject.position. */
export type AssetSpatialAnchor =
  | "bottom"
  | "center"
  | "origin"
  | (string & {});

/**
 * Optional pose / mesh / taxonomy hints for Life Map renderers.
 * All fields optional until real GLB / LOD pipelines land.
 * Category vocabulary: Spatial Asset Library (`./spatial-library`).
 */
export type AssetSpatialMetadata = {
  category: AssetSpatialCategory;
  /** Library subtype (e.g. house, restaurant, golf). */
  subtype?: string;
  /** Presentation behaviour — not AuthZ. */
  behaviour?: string;
  /** Advertised interaction affordance — not AuthZ. */
  interaction?: string;
  /**
   * Future 3D model path (e.g. .glb) under the asset root.
   * Preview `path` on AssetMetadata may remain a webp billboard.
   */
  modelPath?: string;
  /** Uniform scale, or per-axis. */
  scale?: AssetSpatialScale;
  orientation?: {
    headingDegrees?: number;
    pitchDegrees?: number;
    rollDegrees?: number;
  };
  anchor?: AssetSpatialAnchor;
  lod?: readonly AssetSpatialLodLevel[];
};

export type AssetScope = "global" | "tenant";

/**
 * Runtime asset record.
 * Shape: `{ key, type, domain (category facet), …, spatial? }`.
 */
export type AssetMetadata = {
  key: string;
  path: string;
  type: AssetType;
  /** Logical domain / folder family (e.g. professionals, sports, life-map). */
  domain: string;
  variant: string;
  scope: AssetScope;
  tenant: string | null;
  width: number;
  height: number;
  /** Present for spatial types (and dual-use entries when declared). */
  spatial?: AssetSpatialMetadata;
};

export type AssetResolveOptions = {
  /**
   * Active tenant slug (e.g. "life-panoramica").
   * Used for tenant isolation and future tenant overrides of global concepts.
   */
  tenant?: string;
};

export function isUiAssetType(type: string): type is UiAssetType {
  return (UI_ASSET_TYPES as readonly string[]).includes(type);
}

export function isSpatialAssetType(type: string): type is SpatialAssetType {
  return (SPATIAL_ASSET_TYPES as readonly string[]).includes(type);
}

export function isAssetType(type: string): type is AssetType {
  return (ASSET_TYPES as readonly string[]).includes(type);
}

export function getAssetSurface(type: AssetType): AssetSurface {
  return isSpatialAssetType(type) ? "spatial" : "ui";
}

export class MissingAssetError extends Error {
  readonly assetKey: string;

  constructor(assetKey: string) {
    super(`[assets] Unknown assetKey: "${assetKey}"`);
    this.name = "MissingAssetError";
    this.assetKey = assetKey;
  }
}

export class TenantIsolationError extends Error {
  readonly assetKey: string;
  readonly requestedTenant: string;
  readonly assetTenant: string | null;

  constructor(assetKey: string, requestedTenant: string, assetTenant: string | null) {
    super(
      `[assets] Tenant isolation: "${assetKey}" belongs to tenant "${assetTenant ?? "null"}", not "${requestedTenant}"`,
    );
    this.name = "TenantIsolationError";
    this.assetKey = assetKey;
    this.requestedTenant = requestedTenant;
    this.assetTenant = assetTenant;
  }
}

export class UnsafeAssetPathError extends Error {
  readonly path: string;

  constructor(path: string, reason: string) {
    super(`[assets] Unsafe asset path (${reason}): "${path}"`);
    this.name = "UnsafeAssetPathError";
    this.path = path;
  }
}
