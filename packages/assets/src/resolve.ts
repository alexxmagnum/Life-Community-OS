import {
  type AssetMetadata,
  type AssetResolveOptions,
  type AssetSpatialMetadata,
  type AssetType,
  type SpatialAssetType,
  isSpatialAssetType,
  MissingAssetError,
  TenantIsolationError,
  UnsafeAssetPathError,
} from "./types";
import { assetRegistry, type AssetKey } from "./registry.generated";
import {
  ensureFoundationTenantAssetPacks,
  getTenantAssetPack,
  getTenantPackEntry,
  tenantPackDefinesLogicalKey,
  tenantPackEntryToMetadata,
} from "./tenant-pack";

ensureFoundationTenantAssetPacks();

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
  const spatial =
    "spatial" in raw && raw.spatial
      ? (raw.spatial as AssetSpatialMetadata)
      : undefined;
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
    ...(spatial ? { spatial } : {}),
  };
}

function resolveFromTenantPack(
  logicalKey: string,
  requestedTenant: string,
): AssetMetadata {
  const entry = getTenantPackEntry(requestedTenant, logicalKey);
  if (!entry) {
    throw new MissingAssetError(logicalKey);
  }
  assertSafeAssetPath(entry.path);
  if (entry.scope !== "tenant" || entry.tenant !== requestedTenant) {
    throw new TenantIsolationError(logicalKey, requestedTenant, entry.tenant);
  }
  return tenantPackEntryToMetadata(logicalKey, entry);
}

/**
 * Resolve asset metadata by semantic / logical key.
 *
 * Order:
 * 1. Platform registry (generated)
 * 2. Tenant asset pack for `options.tenant` (if key missing on platform)
 *
 * Global keys resolve with or without tenant context.
 * Tenant-scoped keys (registry or pack) require matching tenant (fail-closed).
 */
export function getAsset(key: AssetKey | string, options?: AssetResolveOptions): AssetMetadata {
  const requestedTenant = options?.tenant?.trim() || undefined;
  const logicalKey = String(key);

  if (requestedTenant) {
    const overrideKey = tenantOverrides[requestedTenant]?.[logicalKey];
    if (overrideKey && overrideKey in assetRegistry) {
      const overridden = assetRegistry[overrideKey as AssetKey];
      assertSafeAssetPath(overridden.path);
      return toMetadata(overrideKey, overridden);
    }
  }

  if (logicalKey in assetRegistry) {
    const raw = assetRegistry[logicalKey as AssetKey];
    assertSafeAssetPath(raw.path);

    if (raw.scope === "global") {
      return toMetadata(logicalKey, raw);
    }

    if (!requestedTenant || raw.tenant !== requestedTenant) {
      throw new TenantIsolationError(
        logicalKey,
        requestedTenant ?? "",
        raw.tenant,
      );
    }

    return toMetadata(logicalKey, raw);
  }

  // Platform miss → tenant pack (never without tenant context).
  if (!requestedTenant) {
    if (tenantPackDefinesLogicalKey(logicalKey)) {
      throw new TenantIsolationError(logicalKey, "", null);
    }
    throw new MissingAssetError(logicalKey);
  }

  return resolveFromTenantPack(logicalKey, requestedTenant);
}

/**
 * Resolve asset metadata by logical key + tenant context.
 * Alias of {@link getAsset} for the TenantAssetPack contract.
 */
export function resolveAsset(
  logicalKey: AssetKey | string,
  options?: AssetResolveOptions,
): AssetMetadata {
  return getAsset(logicalKey, options);
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

/**
 * Enumerate assets visible under the given tenant context.
 * Without tenant: platform/global only (tenant-scoped entries excluded).
 * With tenant: platform globals + matching platform tenant entries + that tenant's pack.
 */
export function listAssets(options?: AssetResolveOptions): readonly AssetMetadata[] {
  const requestedTenant = options?.tenant?.trim() || undefined;
  const fromPlatform = listAssetKeys()
    .filter((key) => {
      const raw = assetRegistry[key];
      if (raw.scope === "global") return true;
      return Boolean(requestedTenant && raw.tenant === requestedTenant);
    })
    .map((key) => getAsset(key, options));

  if (!requestedTenant) return fromPlatform;

  const pack = getTenantAssetPack(requestedTenant);
  if (!pack) return fromPlatform;

  const fromPack = Object.keys(pack.assets)
    .filter((logicalKey) => !(logicalKey in assetRegistry))
    .map((logicalKey) => getAsset(logicalKey, options));

  return [...fromPlatform, ...fromPack];
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

function isResolvableKey(key: string, options?: AssetResolveOptions): boolean {
  if (key in assetRegistry) return true;
  const tenant = options?.tenant?.trim();
  if (!tenant) return false;
  return Boolean(getTenantPackEntry(tenant, key));
}

/** Same concept, any type/variant — for family inspection. */
export function getRelatedAssets(
  key: AssetKey | string,
  options?: AssetResolveOptions,
): readonly AssetMetadata[] {
  if (!isResolvableKey(String(key), options)) return [];
  const conceptId = getAssetConceptId(String(key));
  return listAssets(options).filter((a) => getAssetConceptId(a) === conceptId);
}

/** Same concept + type — all registered variants. */
export function getAssetVariants(
  key: AssetKey | string,
  options?: AssetResolveOptions,
): readonly AssetMetadata[] {
  if (!isResolvableKey(String(key), options)) return [];
  const base = getAsset(key, options);
  const conceptId = getAssetConceptId(base);
  return listAssets(options).filter(
    (a) => getAssetConceptId(a) === conceptId && a.type === base.type,
  );
}

export function getRegistryStats(options?: AssetResolveOptions) {
  const metas = listAssets(options);
  const byType: Record<string, number> = {};
  let global = 0;
  let tenant = 0;
  let ui = 0;
  let spatial = 0;
  for (const m of metas) {
    byType[m.type] = (byType[m.type] ?? 0) + 1;
    if (m.scope === "global") global += 1;
    else tenant += 1;
    if (isSpatialAssetType(m.type)) spatial += 1;
    else ui += 1;
  }
  return {
    total: metas.length,
    global,
    tenant,
    ui,
    spatial,
    byType,
  };
}

/** Filter registered assets by exact type. */
export function listAssetsByType(
  type: AssetType,
  options?: AssetResolveOptions,
): readonly AssetMetadata[] {
  return listAssets(options).filter((a) => a.type === type);
}

/** All spatial twin assets currently registered (may be empty until catalog ships). */
export function listSpatialAssets(
  type?: SpatialAssetType,
  options?: AssetResolveOptions,
): readonly AssetMetadata[] {
  return listAssets(options).filter((a) => {
    if (!isSpatialAssetType(a.type)) return false;
    if (type !== undefined && a.type !== type) return false;
    return true;
  });
}

export function getAssetSpatialMetadata(
  key: AssetKey | string,
  options?: AssetResolveOptions,
): AssetSpatialMetadata | undefined {
  return getAsset(key, options).spatial;
}

/**
 * Resolve `LifeMapObject.asset3DKey` against the shared registry.
 * Prefers spatial types; still allows registered dual-use keys until
 * dedicated spatial entries exist (fail only on missing / unsafe / tenant).
 */
export function resolveLifeMapAsset3DKey(
  asset3DKey: AssetKey | string,
  options?: AssetResolveOptions,
): AssetMetadata {
  return getAsset(asset3DKey, options);
}

export function isRegisteredSpatialAssetKey(key: string): boolean {
  if (!hasAsset(key)) return false;
  return isSpatialAssetType(getAsset(key).type);
}
