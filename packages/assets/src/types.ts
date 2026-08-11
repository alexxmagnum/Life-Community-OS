/**
 * Runtime 3D asset types for Life Community OS.
 * Keep these aligned with apps/web/public/assets/3d/manifest.json — not the master library catalog.
 */

export type AssetType =
  | "symbol"
  | "card"
  | "object"
  | "scene"
  | "hero"
  | "branding";

export type AssetScope = "global" | "tenant";

export type AssetMetadata = {
  key: string;
  path: string;
  type: AssetType;
  domain: string;
  variant: string;
  scope: AssetScope;
  tenant: string | null;
  width: number;
  height: number;
};

export type AssetResolveOptions = {
  /**
   * Active tenant slug (e.g. "life-panoramica").
   * Used for tenant isolation and future tenant overrides of global concepts.
   */
  tenant?: string;
};

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
