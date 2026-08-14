/**
 * Tenant Asset Pack — foundation for separating platform registry vs tenant assets.
 *
 * Logical keys (e.g. `branding.symbol`) live in a pack scoped to one tenant.
 * Binaries stay on existing public paths; no generate/manifest migration yet.
 */

import type { AssetMetadata, AssetSpatialMetadata, AssetType } from "./types";
import { UnsafeAssetPathError } from "./types";

const ASSET_ROOT_PREFIX = "/assets/3d/";

/** Pack entry — always tenant-scoped; `logicalKey` is the map key. */
export type TenantAssetPackEntry = {
  path: string;
  type: AssetType;
  domain: string;
  variant: string;
  scope: "tenant";
  /** Must match the pack's `tenant`. */
  tenant: string;
  width: number;
  height: number;
  spatial?: AssetSpatialMetadata;
};

export type TenantAssetPack = {
  tenant: string;
  /**
   * Logical keys → metadata.
   * Example: `"branding.symbol"` (no tenant slug in the key).
   */
  assets: Readonly<Record<string, TenantAssetPackEntry>>;
};

const packsByTenant = new Map<string, TenantAssetPack>();

function assertSafePackPath(path: string): void {
  if (typeof path !== "string" || path.length === 0) {
    throw new UnsafeAssetPathError(String(path), "empty");
  }
  if (!path.startsWith(ASSET_ROOT_PREFIX)) {
    throw new UnsafeAssetPathError(path, "must start with /assets/3d/");
  }
  if (path.includes("..")) {
    throw new UnsafeAssetPathError(path, "path traversal");
  }
  if (/^[A-Za-z]:[\\/]/.test(path) || path.startsWith("\\\\")) {
    throw new UnsafeAssetPathError(path, "absolute windows path");
  }
  if (/^https?:\/\//i.test(path)) {
    throw new UnsafeAssetPathError(path, "external url");
  }
}

/**
 * Register or replace a tenant pack.
 * Validates path safety and that every entry.tenant matches pack.tenant.
 */
export function registerTenantAssetPack(pack: TenantAssetPack): void {
  const tenant = pack.tenant.trim();
  if (!tenant) {
    throw new Error("[assets] TenantAssetPack.tenant is required");
  }

  const assets: Record<string, TenantAssetPackEntry> = {};
  for (const [logicalKey, entry] of Object.entries(pack.assets)) {
    if (!logicalKey.trim()) {
      throw new Error("[assets] TenantAssetPack logicalKey must be non-empty");
    }
    if (entry.scope !== "tenant") {
      throw new Error(
        `[assets] TenantAssetPack entry "${logicalKey}" must have scope "tenant"`,
      );
    }
    if (entry.tenant !== tenant) {
      throw new Error(
        `[assets] TenantAssetPack entry "${logicalKey}" tenant "${entry.tenant}" must match pack "${tenant}"`,
      );
    }
    assertSafePackPath(entry.path);
    assets[logicalKey] = entry;
  }

  packsByTenant.set(tenant, { tenant, assets });
}

export function getTenantAssetPack(tenant: string): TenantAssetPack | undefined {
  const id = tenant.trim();
  if (!id) return undefined;
  return packsByTenant.get(id);
}

export function listRegisteredTenantAssetPacks(): readonly string[] {
  return [...packsByTenant.keys()].sort((a, b) => a.localeCompare(b));
}

/** Lookup one logical key inside a tenant pack (no isolation checks). */
export function getTenantPackEntry(
  tenant: string,
  logicalKey: string,
): TenantAssetPackEntry | undefined {
  return getTenantAssetPack(tenant)?.assets[logicalKey];
}

/** True if any registered pack defines this logical key. */
export function tenantPackDefinesLogicalKey(logicalKey: string): boolean {
  for (const pack of packsByTenant.values()) {
    if (logicalKey in pack.assets) return true;
  }
  return false;
}

export function tenantPackEntryToMetadata(
  logicalKey: string,
  entry: TenantAssetPackEntry,
): AssetMetadata {
  return {
    key: logicalKey,
    path: entry.path,
    type: entry.type,
    domain: entry.domain,
    variant: entry.variant,
    scope: entry.scope,
    tenant: entry.tenant,
    width: entry.width,
    height: entry.height,
    ...(entry.spatial ? { spatial: entry.spatial } : {}),
  };
}

/**
 * Foundation pack — Life Panoramica branding logical keys.
 * Paths reuse existing public files (no physical move).
 * Legacy slug keys remain in the platform-generated registry until migration.
 */
export const lifePanoramicaAssetPack: TenantAssetPack = {
  tenant: "life-panoramica",
  assets: {
    "branding.symbol": {
      path: "/assets/3d/tenants/life-panoramica/branding/life-panoramica-symbol/branding/life-panoramica-symbol--symbol.webp",
      type: "branding",
      domain: "branding",
      variant: "symbol",
      scope: "tenant",
      tenant: "life-panoramica",
      width: 512,
      height: 448,
    },
    "branding.wordmark": {
      path: "/assets/3d/tenants/life-panoramica/branding/life-panoramica-wordmark/branding/life-panoramica-wordmark--wordmark.webp",
      type: "branding",
      domain: "branding",
      variant: "wordmark",
      scope: "tenant",
      tenant: "life-panoramica",
      width: 768,
      height: 465,
    },
  },
};

/** Ensure foundation pack is available for resolve. Idempotent. */
export function ensureFoundationTenantAssetPacks(): void {
  if (!packsByTenant.has(lifePanoramicaAssetPack.tenant)) {
    registerTenantAssetPack(lifePanoramicaAssetPack);
  }
}

ensureFoundationTenantAssetPacks();
