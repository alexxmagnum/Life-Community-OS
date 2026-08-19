/**
 * Tenant pack registry — configuration-driven factory.
 * Core never branches on a customer slug. Packs register themselves here.
 */

import type {
  ProductCapabilityMap,
  TenantCatalogDomain,
  TenantConfiguration,
  TenantHomeMode,
  TenantLocationSeed,
} from "@life-community-os/types";
import {
  productCapabilitiesFromFeatures,
  isProductCapabilityEnabled,
  type ProductCapabilityKey,
} from "@life-community-os/types";
import type { TenantBrandTokens } from "@life-community-os/design-tokens";
import {
  CAPABILITIES,
  capabilitiesForRole,
  communityContentCatalog,
  experienceCatalog,
  lifePanoramicaFeatures,
  lifePanoramicaTheme,
  marketplaceCatalog,
  resolveLifePanoramicaTenantConfiguration,
  resourceCatalog,
  type CapabilityKey,
  type DemoRole,
  type TenantFeatureFlags,
} from "@life-community-os/tenant-life-panoramica";
import {
  lifeValleyCatalogSeed,
  lifeValleyFeatures,
  lifeValleyLocationSeeds,
  lifeValleyTheme,
  resolveLifeValleyTenantConfiguration,
} from "@life-community-os/tenant-life-valley";
import {
  oceanHillsCatalogSeed,
  oceanHillsFeatures,
  oceanHillsLocationSeeds,
  oceanHillsTheme,
  resolveOceanHillsTenantConfiguration,
} from "@life-community-os/tenant-life-ocean-hills";
import { defaultTenantSlug, getTenantManifestRecord } from "./manifest";
import {
  LIFE_OCEAN_HILLS_TENANT_SLUG,
  LIFE_PANORAMICA_TENANT_SLUG,
  LIFE_VALLEY_TENANT_SLUG,
  resolveTenantPublicId,
} from "./ids";

export type TenantPackRuntime = {
  slug: string;
  displayName: string;
  locale: string;
  timezone: string;
  theme: TenantBrandTokens;
  features: TenantFeatureFlags;
  productCapabilities: ProductCapabilityMap;
  homeMode: TenantHomeMode;
  locationSeedMode: "pack" | "local-entity-catalog";
  resolveConfiguration: () => TenantConfiguration;
  capabilitiesForRole: (role: DemoRole) => Set<CapabilityKey>;
  getCatalogSeed: (domain: TenantCatalogDomain) => unknown[];
  getLocationSeeds: () => TenantLocationSeed[];
};

const packs = new Map<string, TenantPackRuntime>();

function registerPack(pack: TenantPackRuntime): void {
  packs.set(pack.slug, pack);
}

function identityMeta(slug: string) {
  const row = getTenantManifestRecord(slug);
  return {
    locale: row?.locale ?? "es",
    timezone: row?.timezone ?? "Europe/Madrid",
    displayName: row?.name ?? slug,
  };
}

function panoramicaCatalogSeed(domain: TenantCatalogDomain): unknown[] {
  switch (domain) {
    case "community":
      return [...communityContentCatalog];
    case "experiences":
      return [...experienceCatalog];
    case "marketplace":
      return [...marketplaceCatalog];
    case "resources":
      return [...resourceCatalog];
  }
}

registerPack({
  slug: LIFE_PANORAMICA_TENANT_SLUG,
  ...identityMeta(LIFE_PANORAMICA_TENANT_SLUG),
  theme: lifePanoramicaTheme,
  features: lifePanoramicaFeatures,
  productCapabilities: productCapabilitiesFromFeatures(lifePanoramicaFeatures, {
    golf: true,
    hospitality: true,
  }),
  homeMode: "premium",
  locationSeedMode: "local-entity-catalog",
  resolveConfiguration: resolveLifePanoramicaTenantConfiguration,
  capabilitiesForRole,
  getCatalogSeed: panoramicaCatalogSeed,
  getLocationSeeds: () => [],
});

registerPack({
  slug: LIFE_VALLEY_TENANT_SLUG,
  ...identityMeta(LIFE_VALLEY_TENANT_SLUG),
  theme: lifeValleyTheme,
  features: lifeValleyFeatures,
  productCapabilities: productCapabilitiesFromFeatures(lifeValleyFeatures, {
    golf: false,
    hospitality: false,
  }),
  homeMode: "catalog",
  locationSeedMode: "pack",
  resolveConfiguration: resolveLifeValleyTenantConfiguration,
  capabilitiesForRole,
  getCatalogSeed: lifeValleyCatalogSeed,
  getLocationSeeds: () => lifeValleyLocationSeeds,
});

registerPack({
  slug: LIFE_OCEAN_HILLS_TENANT_SLUG,
  ...identityMeta(LIFE_OCEAN_HILLS_TENANT_SLUG),
  theme: oceanHillsTheme,
  features: oceanHillsFeatures,
  productCapabilities: productCapabilitiesFromFeatures(oceanHillsFeatures, {
    golf: false,
    hospitality: true,
    marketplace: false,
    housing: false,
    lifeMap: false,
  }),
  homeMode: "catalog",
  locationSeedMode: "pack",
  resolveConfiguration: resolveOceanHillsTenantConfiguration,
  capabilitiesForRole,
  getCatalogSeed: oceanHillsCatalogSeed,
  getLocationSeeds: () => oceanHillsLocationSeeds,
});

export function listRegisteredTenantSlugs(): string[] {
  return [...packs.keys()];
}

export function listTenantPacks(): TenantPackRuntime[] {
  return [...packs.values()];
}

export function getTenantPack(slugOrId: string): TenantPackRuntime | null {
  const slug = resolveTenantPublicId(slugOrId);
  return packs.get(slug) ?? null;
}

export function requireTenantPack(slugOrId: string): TenantPackRuntime {
  const pack = getTenantPack(slugOrId);
  if (!pack) {
    throw new Error(`Unknown tenant pack: ${slugOrId}`);
  }
  return pack;
}

export function resolveActiveTenantSlug(hint?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim();
  const fallback = defaultTenantSlug();
  const candidate = hint?.trim() || fromEnv || fallback;
  const slug = resolveTenantPublicId(candidate);
  if (packs.has(slug)) return slug;
  return fallback;
}

export function packProductCapability(
  slugOrId: string,
  key: ProductCapabilityKey,
): boolean {
  const pack = getTenantPack(slugOrId);
  if (!pack) return false;
  return isProductCapabilityEnabled(pack.productCapabilities, key);
}

export { CAPABILITIES, isProductCapabilityEnabled };
