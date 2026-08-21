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
  AssetSpatialScale,
  AssetSpatialAnchor,
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

/** Spatial Asset Library — SaaS twin vocabulary (no binaries). */
export type {
  SpatialLibraryCategory,
  SpatialBuildingSubtype,
  SpatialPlaceSubtype,
  SpatialRecreationSubtype,
  SpatialMobilitySubtype,
  SpatialCommunitySubtype,
  SpatialNatureSubtype,
  SpatialTerrainSubtype,
  SpatialAvatarSubtype,
  SpatialUtilitySubtype,
  SpatialLibrarySubtype,
  AssetSpatialBehaviour,
  AssetSpatialInteractionCapability,
  SpatialLibraryEntry,
  SpatialAssetKeyParts,
} from "./spatial-library";

export {
  SPATIAL_LIBRARY_CATEGORIES,
  SPATIAL_LIBRARY_SUBTYPES_BY_CATEGORY,
  ASSET_SPATIAL_BEHAVIOURS,
  ASSET_SPATIAL_INTERACTIONS,
  defaultSpatialRegistryTypeForCategory,
  buildSpatialAssetKey,
  isSpatialLibraryCategory,
  listSpatialLibrarySubtypes,
  isKnownSpatialLibrarySubtype,
  validateSpatialLibraryMetadata,
  defineSpatialLibraryEntry,
} from "./spatial-library";

export { assetRegistry, type AssetKey } from "./registry.generated";

export type {
  TenantAssetPack,
  TenantAssetPackEntry,
} from "./tenant-pack";

export {
  registerTenantAssetPack,
  getTenantAssetPack,
  listRegisteredTenantAssetPacks,
  getTenantPackEntry,
  lifePanoramicaAssetPack,
  ensureFoundationTenantAssetPacks,
} from "./tenant-pack";

export {
  asset,
  getAsset,
  resolveAsset,
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

export {
  ensurePlatformSpatialCatalog,
  getSpatialCatalogAsset,
  hasSpatialCatalogAsset,
  listSpatialCatalogAssets,
  registerSpatialCatalogAsset,
} from "./spatial-catalog";

export type {
  SpatialAssetCategory,
  SpatialAssetFormat,
  SpatialAssetLodLevel,
  SpatialAssetLodEntry,
  SpatialAssetMetadata,
  SpatialAsset,
  SpatialAssetIssueCode,
  SpatialAssetIssue,
} from "./spatial-asset";
export {
  SPATIAL_ASSET_CATEGORIES,
  SPATIAL_ASSET_FORMATS,
  isSpatialAssetCategory,
  isSafeSpatialAssetUrl,
  validateSpatialAsset,
  selectSpatialAssetLodUrl,
} from "./spatial-asset";

export {
  PLATFORM_SPATIAL_ASSETS,
  SPATIAL_ASSET_KEY_ALIASES,
} from "./spatial-asset-library";

export type {
  SpatialAssetResolveContext,
  SpatialAssetRegistry,
} from "./spatial-asset-registry";
export {
  createSpatialAssetRegistry,
  getPlatformSpatialAssetRegistry,
  resolveSpatialAsset,
  resolveSpatialAssetUrl,
} from "./spatial-asset-registry";

export type {
  TerritorySpatialType,
  TerritoryObjectAssetRef,
} from "./spatial-asset-assignment";
export {
  DEFAULT_TERRITORY_SPATIAL_ASSIGNMENTS,
  assignSpatialAssetToTerritoryType,
  clearSpatialAssetAssignments,
  spatialAssetIdForTerritoryType,
  resolveSpatialAssetForTerritoryObject,
} from "./spatial-asset-assignment";

export { SPATIAL_GLB_ZOOM, shouldLoadSpatialGlb, spatialGlbUrlForView } from "./spatial-asset-pipeline";
