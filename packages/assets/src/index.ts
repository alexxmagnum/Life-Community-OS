/**
 * @life-community-os/assets
 *
 * Product SaaS asset registry. Tenants consume global assets;
 * only explicit tenant-scoped entries (e.g. branding) are isolated.
 *
 * One library for UI surfaces and Life Map spatial projections.
 */

export type {
  AssetType,
  UiAssetType,
  SpatialAssetType,
  AssetSurface,
  AssetSpatialCategory,
  AssetSpatialLodLevel,
  AssetSpatialMetadata,
  AssetScope,
  AssetMetadata,
  AssetResolveOptions,
} from "./types";

export {
  UI_ASSET_TYPES,
  SPATIAL_ASSET_TYPES,
  ASSET_TYPES,
  isUiAssetType,
  isSpatialAssetType,
  isAssetType,
  getAssetSurface,
  MissingAssetError,
  TenantIsolationError,
  UnsafeAssetPathError,
} from "./types";

export { assetRegistry, type AssetKey } from "./registry.generated";

export {
  asset,
  getAsset,
  hasAsset,
  listAssetKeys,
  listAssets,
  listAssetsByType,
  listSpatialAssets,
  getAssetSpatialMetadata,
  resolveLifeMapAsset3DKey,
  isRegisteredSpatialAssetKey,
  getAssetConceptId,
  getRelatedAssets,
  getAssetVariants,
  getRegistryStats,
  assertSafeAssetPath,
} from "./resolve";
