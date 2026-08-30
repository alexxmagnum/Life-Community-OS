/**
 * White-label tenant contract — configuration, not product if-slug.
 *
 * Identity + branding + product capabilities live here.
 * AuthZ capabilities (RBAC strings) remain separate.
 */

export const PRODUCT_CAPABILITY_KEYS = [
  "golf",
  "hospitality",
  "marketplace",
  "reservations",
  "experiences",
  "housing",
  "community",
  "resources",
  "lifeMap",
  "work",
  "official",
] as const;

export type ProductCapabilityKey = (typeof PRODUCT_CAPABILITY_KEYS)[number];

export type ProductCapabilityMap = Record<ProductCapabilityKey, boolean>;

export type TenantHomeMode = "premium" | "catalog";

export type TenantCatalogDomain =
  | "community"
  | "experiences"
  | "marketplace"
  | "resources";

export type TenantIdentityRecord = {
  slug: string;
  name: string;
  tenantUuid: string;
  /** Default / active Territory for this Tenant (operational fallback). */
  territoryUuid: string;
  /** All Territories owned by this Tenant. Defaults to [territoryUuid]. */
  territoryUuids?: readonly string[];
  hostHints: readonly string[];
  locale: string;
  timezone: string;
  /** Unknown slugs resolve here (must be a registered slug). */
  defaultFallback?: boolean;
};

/**
 * Stable white-label tenant contract.
 * Product code consumes this shape — never a customer slug.
 */
export type TenantContract = {
  id: string;
  slug: string;
  name: string;
  branding: {
    name: string;
    shortName?: string;
    logoText: string;
    tagline?: string;
    colors: { brandPrimary: string };
    assets: {
      logo?: string;
      homeHero?: string;
    };
  };
  locale: string;
  timezone: string;
  territory: {
    id: string;
    name: string;
  };
  capabilities: ProductCapabilityMap;
  assets: {
    catalogDomains: readonly TenantCatalogDomain[];
    locationSeedMode: "pack" | "local-entity-catalog";
  };
  configuration: {
    homeMode: TenantHomeMode;
    hostHints: readonly string[];
  };
};

export type TenantLocationSeed = {
  id: string;
  name: string;
  category: string;
  type?: "business" | "service" | "facility" | "event" | "community-place";
  summary: string;
  areaLabel: string;
  latitude: number;
  longitude: number;
  address?: string;
  hours?: string;
  contact?: string;
  imageUrl?: string;
};

export const EMPTY_PRODUCT_CAPABILITIES: ProductCapabilityMap = {
  golf: false,
  hospitality: false,
  marketplace: false,
  reservations: false,
  experiences: false,
  housing: false,
  community: true,
  resources: false,
  lifeMap: false,
  work: false,
  official: false,
};

export function productCapabilitiesFromFeatures(
  features: Readonly<Record<string, boolean>>,
  overrides: Partial<ProductCapabilityMap> = {},
): ProductCapabilityMap {
  return {
    golf: overrides.golf ?? false,
    hospitality: overrides.hospitality ?? false,
    marketplace: overrides.marketplace ?? Boolean(features.marketplace),
    reservations: overrides.reservations ?? Boolean(features.resources),
    experiences: overrides.experiences ?? Boolean(features.experiences),
    housing: overrides.housing ?? Boolean(features.housing),
    community:
      overrides.community ??
      Boolean(features.feed || features.groups || features.communityChannels),
    resources: overrides.resources ?? Boolean(features.resources),
    lifeMap: overrides.lifeMap ?? Boolean(features.lifeMap),
    work: overrides.work ?? Boolean(features.work),
    official: overrides.official ?? Boolean(features.officialChannels),
  };
}

export function isProductCapabilityEnabled(
  map: ProductCapabilityMap,
  key: ProductCapabilityKey,
): boolean {
  return map[key] === true;
}

export function resolveHostHintToSlug(
  host: string,
  records: readonly TenantIdentityRecord[],
): string | null {
  const normalized = host.split(":")[0]?.toLowerCase() ?? "";
  if (!normalized) return null;
  for (const record of records) {
    for (const hint of record.hostHints) {
      const needle = hint.toLowerCase();
      if (normalized === needle || normalized.startsWith(`${needle}.`)) {
        return record.slug;
      }
      if (needle.includes(".") && normalized.includes(needle)) {
        return record.slug;
      }
      if (!needle.includes(".") && normalized.includes(needle)) {
        return record.slug;
      }
    }
  }
  return null;
}

/** Tenant 1:N Territory — identity record may list many; default is territoryUuid. */
export function territoryIdsForTenant(
  record: TenantIdentityRecord,
): readonly string[] {
  if (record.territoryUuids && record.territoryUuids.length > 0) {
    return record.territoryUuids;
  }
  return [record.territoryUuid];
}
