/**
 * Architecture for creating / inspecting tenants without a full admin UI.
 * Provisioning a customer is: pack + manifest row. This module is the contract.
 */

import type {
  ProductCapabilityMap,
  TenantContract,
  TenantIdentityRecord,
} from "@life-community-os/types";
import { PRODUCT_CAPABILITY_KEYS } from "@life-community-os/types";
import { getTenantManifestRecord } from "./manifest";
import { listTenantPacks, requireTenantPack } from "./registry";

export type TenantAdminSnapshot = {
  slug: string;
  name: string;
  locale: string;
  timezone: string;
  branding: {
    name: string;
    shortName: string;
    tagline: string;
    primaryColor: string;
  };
  capabilities: ProductCapabilityMap;
  modules: Record<string, boolean>;
  catalogCounts: Record<string, number>;
  locationSeedCount: number;
};

export function snapshotTenant(slug: string): TenantAdminSnapshot {
  const pack = requireTenantPack(slug);
  const identity = getTenantManifestRecord(pack.slug);
  const domains = [
    "community",
    "experiences",
    "marketplace",
    "resources",
  ] as const;
  const catalogCounts = Object.fromEntries(
    domains.map((domain) => [domain, pack.getCatalogSeed(domain).length]),
  );
  return {
    slug: pack.slug,
    name: identity?.name ?? pack.displayName,
    locale: pack.locale,
    timezone: pack.timezone,
    branding: {
      name: pack.theme.name,
      shortName: pack.theme.shortName ?? pack.theme.name,
      tagline: pack.theme.tagline ?? "",
      primaryColor: pack.theme.colors.brandPrimary,
    },
    capabilities: pack.productCapabilities,
    modules: { ...pack.features },
    catalogCounts,
    locationSeedCount: pack.getLocationSeeds().length,
  };
}

export function listTenantAdminSnapshots(): TenantAdminSnapshot[] {
  return listTenantPacks().map((pack) => snapshotTenant(pack.slug));
}

export function resolveTenantContract(slug: string): TenantContract {
  const pack = requireTenantPack(slug);
  const identity = getTenantManifestRecord(pack.slug);
  if (!identity) {
    throw new Error(`Tenant identity missing from manifest: ${slug}`);
  }
  return {
    id: identity.tenantUuid,
    slug: pack.slug,
    name: identity.name,
    branding: {
      name: pack.theme.name,
      shortName: pack.theme.shortName,
      logoText: pack.theme.logoText,
      tagline: pack.theme.tagline,
      colors: { brandPrimary: pack.theme.colors.brandPrimary },
      assets: {
        logo: pack.theme.imagery?.logo,
        homeHero: pack.theme.imagery?.homeHero,
      },
    },
    locale: pack.locale,
    timezone: pack.timezone,
    territory: {
      id: identity.territoryUuid,
      name: pack.theme.identity?.territoryName ?? identity.name,
    },
    capabilities: pack.productCapabilities,
    assets: {
      catalogDomains: ["community", "experiences", "marketplace", "resources"],
      locationSeedMode: pack.locationSeedMode,
    },
    configuration: {
      homeMode: pack.homeMode,
      hostHints: identity.hostHints,
    },
  };
}

export type TenantProvisionPlan = {
  slug: string;
  steps: string[];
  identity: TenantIdentityRecord;
};

/**
 * Does not write files. Documents what a factory run must produce
 * so core product code stays unchanged.
 */
export function planTenantProvision(
  identity: TenantIdentityRecord,
  capabilities: ProductCapabilityMap,
): TenantProvisionPlan {
  return {
    slug: identity.slug,
    identity,
    steps: [
      `Create tenants/${identity.slug} pack (theme, features, catalogs, locations).`,
      `Append identity to the tenant manifest (UUID, host hints, locale).`,
      `Register the pack in the tenant registry catalog.`,
      `Add workspace dependency + transpile for ${identity.slug}.`,
      `Seed public.tenants / public.territories with ${identity.tenantUuid}.`,
      `Enable product capabilities: ${PRODUCT_CAPABILITY_KEYS.filter((key) => capabilities[key]).join(", ") || "(none)"}.`,
    ],
  };
}
