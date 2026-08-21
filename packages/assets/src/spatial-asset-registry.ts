/**
 * SpatialAssetRegistry — platform catalog of loadable twin meshes.
 *
 * Components never import GLB URLs. Flow: Registry → TerritoryObject → Renderer.
 */

import {
  selectSpatialAssetLodUrl,
  validateSpatialAsset,
  type SpatialAsset,
  type SpatialAssetIssue,
} from "./spatial-asset";
import {
  PLATFORM_SPATIAL_ASSETS,
  SPATIAL_ASSET_KEY_ALIASES,
} from "./spatial-asset-library";

export type SpatialAssetResolveContext = {
  tenantId?: string;
  zoom?: number;
  visible?: boolean;
  hasPosition?: boolean;
};

export type SpatialAssetRegistry = {
  register(asset: SpatialAsset): { ok: true } | { ok: false; issues: SpatialAssetIssue[] };
  get(id: string): SpatialAsset | undefined;
  has(id: string): boolean;
  list(): SpatialAsset[];
  resolve(
    key: string,
    context?: SpatialAssetResolveContext,
  ): SpatialAsset | null;
  resolveUrl(
    key: string,
    context?: SpatialAssetResolveContext,
  ): string | null;
  clearExtras(): void;
};

function canonicalId(key: string): string {
  const trimmed = key.trim();
  return SPATIAL_ASSET_KEY_ALIASES[trimmed] ?? trimmed;
}

export function createSpatialAssetRegistry(
  seed: readonly SpatialAsset[] = PLATFORM_SPATIAL_ASSETS,
): SpatialAssetRegistry {
  const byId = new Map<string, SpatialAsset>();
  const extras = new Set<string>();

  for (const asset of seed) {
    if (validateSpatialAsset(asset).length === 0) {
      byId.set(asset.id, asset);
    }
  }

  return {
    register(asset) {
      const issues = validateSpatialAsset(asset);
      if (issues.length > 0) return { ok: false, issues };
      byId.set(asset.id, asset);
      extras.add(asset.id);
      return { ok: true };
    },

    get(id) {
      return byId.get(canonicalId(id));
    },

    has(id) {
      return byId.has(canonicalId(id));
    },

    list() {
      return [...byId.values()];
    },

    resolve(key, context = {}) {
      const asset = byId.get(canonicalId(key));
      if (!asset) return null;
      if (validateSpatialAsset(asset, context.tenantId).length > 0) {
        return null;
      }
      return asset;
    },

    resolveUrl(key, context = {}) {
      if (context.visible === false) return null;
      if (context.hasPosition === false) return null;
      const asset = this.resolve(key, context);
      if (!asset) return null;
      if (typeof context.zoom === "number") {
        const lod = selectSpatialAssetLodUrl(asset, context.zoom);
        return lod?.url ?? null;
      }
      return asset.url;
    },

    clearExtras() {
      for (const id of extras) byId.delete(id);
      extras.clear();
    },
  };
}

let platformRegistry: SpatialAssetRegistry | null = null;

/** Process-wide platform registry (idempotent). */
export function getPlatformSpatialAssetRegistry(): SpatialAssetRegistry {
  if (!platformRegistry) {
    platformRegistry = createSpatialAssetRegistry();
  }
  return platformRegistry;
}

export function resolveSpatialAsset(
  key: string,
  context?: SpatialAssetResolveContext,
): SpatialAsset | null {
  return getPlatformSpatialAssetRegistry().resolve(key, context);
}

export function resolveSpatialAssetUrl(
  key: string,
  context?: SpatialAssetResolveContext,
): string | null {
  return getPlatformSpatialAssetRegistry().resolveUrl(key, context);
}
