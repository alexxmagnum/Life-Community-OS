/**
 * @life-community-os/assets
 *
 * Product SaaS asset registry. Tenants consume global assets;
 * only explicit tenant-scoped entries (e.g. branding) are isolated.
 */

export type {
  AssetType,
  AssetScope,
  AssetMetadata,
  AssetResolveOptions,
} from "./types";

export {
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
  getAssetConceptId,
  getRelatedAssets,
  getAssetVariants,
  getRegistryStats,
  assertSafeAssetPath,
} from "./resolve";
