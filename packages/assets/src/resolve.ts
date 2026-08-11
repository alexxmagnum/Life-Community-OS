import {
  type AssetMetadata,
  type AssetResolveOptions,
  MissingAssetError,
  TenantIsolationError,
  UnsafeAssetPathError,
} from "./types";
import { assetRegistry, type AssetKey } from "./registry.generated";

const ASSET_ROOT_PREFIX = "/assets/3d/";

/** Future tenant overrides of global keys: tenant → logicalKey → AssetKey */
const tenantOverrides: Record<string, Partial<Record<string, AssetKey>>> = {
  // Empty by design until catalog ships same-concept tenant overrides.
};

export function assertSafeAssetPath(path: string): void {
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

function toMetadata(key: string, raw: (typeof assetRegistry)[AssetKey]): AssetMetadata {
  return {
    key,
    path: raw.path,
    type: raw.type,
    domain: raw.domain,
    variant: raw.variant,
    scope: raw.scope,
    tenant: raw.tenant,
    width: raw.width,
    height: raw.height,
  };
}

/**
 * Resolve asset metadata by semantic key.
 * Global keys resolve for any tenant. Tenant branding never crosses tenants.
 */
export function getAsset(key: AssetKey | string, options?: AssetResolveOptions): AssetMetadata {
  const requestedTenant = options?.tenant?.trim() || undefined;

  if (requestedTenant) {
    const overrideKey = tenantOverrides[requestedTenant]?.[key];
    if (overrideKey && overrideKey in assetRegistry) {
      const overridden = assetRegistry[overrideKey as AssetKey];
      assertSafeAssetPath(overridden.path);
      return toMetadata(overrideKey, overridden);
    }
  }

  if (!(key in assetRegistry)) {
    throw new MissingAssetError(String(key));
  }

  const raw = assetRegistry[key as AssetKey];
  assertSafeAssetPath(raw.path);

  if (raw.scope === "global") {
    return toMetadata(String(key), raw);
  }

  // Tenant-scoped asset (e.g. branding)
  if (requestedTenant && raw.tenant !== requestedTenant) {
    throw new TenantIsolationError(String(key), requestedTenant, raw.tenant);
  }

  return toMetadata(String(key), raw);
}

/** Resolve public URL path for an asset key. */
export function asset(key: AssetKey | string, options?: AssetResolveOptions): string {
  return getAsset(key, options).path;
}

export function hasAsset(key: string): key is AssetKey {
  return Object.prototype.hasOwnProperty.call(assetRegistry, key);
}

export function listAssetKeys(): AssetKey[] {
  return Object.keys(assetRegistry) as AssetKey[];
}

/** Enumerate all registered assets as readonly runtime metadata. */
export function listAssets(): readonly AssetMetadata[] {
  return listAssetKeys().map((key) => getAsset(key));
}

/**
 * Logical concept id: `{domain}.{id}` derived from the asset key shape
 * `{domain}.{id}.{type}[.{variant}...]`.
 */
export function getAssetConceptId(meta: AssetMetadata | string): string {
  const key = typeof meta === "string" ? meta : meta.key;
  const parts = key.split(".");
  if (parts.length < 2) return key;
  return `${parts[0]}.${parts[1]}`;
}

/** Same concept, any type/variant — for family inspection. */
export function getRelatedAssets(key: AssetKey | string): readonly AssetMetadata[] {
  if (!(key in assetRegistry)) return [];
  const conceptId = getAssetConceptId(String(key));
  return listAssets().filter((a) => getAssetConceptId(a) === conceptId);
}

/** Same concept + type — all registered variants. */
export function getAssetVariants(key: AssetKey | string): readonly AssetMetadata[] {
  if (!(key in assetRegistry)) return [];
  const base = getAsset(key);
  const conceptId = getAssetConceptId(base);
  return listAssets().filter(
    (a) => getAssetConceptId(a) === conceptId && a.type === base.type,
  );
}

export function getRegistryStats() {
  const metas = listAssets();
  const byType: Record<string, number> = {};
  let global = 0;
  let tenant = 0;
  for (const m of metas) {
    byType[m.type] = (byType[m.type] ?? 0) + 1;
    if (m.scope === "global") global += 1;
    else tenant += 1;
  }
  return {
    total: metas.length,
    global,
    tenant,
    byType,
  };
}
