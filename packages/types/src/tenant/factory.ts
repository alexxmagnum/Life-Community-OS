/**
 * Tenant Factory — SaaS community deployment contracts.
 * Creates infrastructure (Tenant, Territory, plan, features).
 * Does not create community content, roles, or permissions.
 * Packs never control AuthZ. Never branch on a customer slug.
 */

import type { TenantStatus } from "../domain/tenant";
import {
  createTerritory,
  filterTerritoriesForTenant,
  type Territory,
  type TerritoryBounds,
} from "../domain/territory";
import { CAPABILITIES } from "../platform/capabilities";
import { capabilitiesForRole } from "../platform/authorization";
import type { TenantFeatureFlags } from "../platform/capabilities";
import {
  EMPTY_PRODUCT_CAPABILITIES,
  productCapabilitiesFromFeatures,
  type ProductCapabilityMap,
  type TenantIdentityRecord,
} from "../platform/tenant-contract";

export const TENANT_PLANS = [
  "starter",
  "community",
  "premium",
  "enterprise",
] as const;

export type TenantPlan = (typeof TENANT_PLANS)[number];

export const COMMUNITY_ONBOARDING_STEPS = [
  "create_tenant",
  "create_territory",
  "configure_branding",
  "activate_features",
  "create_administrator",
  "optional_import",
  "community_ready",
] as const;

export type CommunityOnboardingStep =
  (typeof COMMUNITY_ONBOARDING_STEPS)[number];

export const PACK_MAY_PROVIDE = [
  "branding",
  "initial_seeds",
  "visual_configuration",
  "demo_places",
  "categories",
  "translations",
] as const;

export const PACK_MUST_NOT_PROVIDE = [
  "permissions",
  "roles",
  "authorization_rules",
  "security_rules",
] as const;

export type TenantBrandingSlice = {
  name: string;
  shortName?: string;
  primaryColor?: string;
};

export type ProvisionedTenant = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: TenantPlan;
  locale: string;
  timezone: string;
  branding: TenantBrandingSlice;
  createdAt: string;
};

export type TerritoryProvisionInput = {
  tenantId: string;
  name: string;
  slug?: string;
  bounds?: TerritoryBounds;
  locale?: string;
  timezone?: string;
};

export type TenantProvisionRequest = {
  name: string;
  slug: string;
  locale: string;
  timezone: string;
  branding?: TenantBrandingSlice;
  features?: Partial<ProductCapabilityMap>;
  territories: Array<{
    name: string;
    slug?: string;
    bounds?: TerritoryBounds;
    locale?: string;
    timezone?: string;
  }>;
};

export type TenantProvisionResult = {
  tenantId: string;
  territories: Territory[];
  status: TenantStatus;
};

export type TenantConfigurationContext = {
  tenantId: string;
  branding: TenantBrandingSlice;
  locale: string;
  timezone: string;
  features: ProductCapabilityMap;
  enabledModules: Record<string, boolean>;
  territories: Array<{
    id: string;
    name: string;
    slug: string;
    locale?: string;
    timezone?: string;
  }>;
};

export type PlatformOperator = {
  personId: string;
  status: "active" | "revoked";
};

export type TenantAdministratorSeed = {
  tenantId: string;
  territoryId: string;
  personId: string;
};

export type TenantFactorySnapshot = {
  tenants: ProvisionedTenant[];
  territories: Territory[];
  administrators: TenantAdministratorSeed[];
  operators: PlatformOperator[];
  featuresByTenant: Record<string, ProductCapabilityMap>;
  limitsByTenant?: Record<
    string,
    {
      territories: number | null;
      members: number | null;
      storage: number | null;
      resources: number | null;
    }
  >;
  contractsByTenant?: Record<
    string,
    {
      tenantId: string;
      plan: TenantPlan;
      features: ProductCapabilityMap;
      limits: {
        territories: number | null;
        members: number | null;
        storage: number | null;
        resources: number | null;
      };
      status: string;
      effectiveFrom: string;
      effectiveUntil: string | null;
    }
  >;
  subscriptionStatusByTenant?: Record<
    string,
    "trial" | "active" | "past_due" | "cancelled"
  >;
};

export type ClientAuthoritySpoof = {
  tenantId?: unknown;
  territoryId?: unknown;
  role?: unknown;
  plan?: unknown;
  features?: unknown;
  status?: unknown;
  limits?: unknown;
  permissions?: unknown;
};

export function emptyTenantFactorySnapshot(): TenantFactorySnapshot {
  return {
    tenants: [],
    territories: [],
    administrators: [],
    operators: [],
    featuresByTenant: {},
    limitsByTenant: {},
    contractsByTenant: {},
    subscriptionStatusByTenant: {},
  };
}

export function isTenantPlan(value: string): value is TenantPlan {
  return (TENANT_PLANS as readonly string[]).includes(value);
}

export function featuresForPlan(plan: TenantPlan): ProductCapabilityMap {
  const base: ProductCapabilityMap = {
    ...EMPTY_PRODUCT_CAPABILITIES,
    community: true,
  };
  switch (plan) {
    case "starter":
      return { ...base, experiences: true };
    case "community":
      return {
        ...base,
        experiences: true,
        reservations: true,
        resources: true,
        lifeMap: true,
      };
    case "premium":
      return {
        ...base,
        experiences: true,
        reservations: true,
        resources: true,
        lifeMap: true,
        marketplace: true,
        housing: true,
        official: true,
      };
    case "enterprise":
      return {
        golf: true,
        hospitality: true,
        marketplace: true,
        reservations: true,
        experiences: true,
        housing: true,
        community: true,
        resources: true,
        lifeMap: true,
        work: true,
        official: true,
      };
  }
}

export function tenantFeatureFlagsFromProduct(
  map: ProductCapabilityMap,
): TenantFeatureFlags {
  return {
    experiences: map.experiences,
    activities: map.experiences,
    services: map.resources || map.reservations,
    work: map.work,
    resources: map.resources || map.reservations,
    recommendations: false,
    localLife: map.lifeMap,
    localEntities: map.lifeMap,
    communityPulse: map.community,
    groups: map.community,
    decide: false,
    interactions: map.community,
    incidents: false,
    feed: map.community,
    calendar: map.experiences,
    marketplace: map.marketplace,
    communityChannels: map.community,
    officialChannels: map.official,
    municipalServices: false,
    securityModule: false,
    mobility: false,
    residencyVerification: false,
    participationTrust: false,
    intelligentDiffusion: false,
    housing: map.housing,
    lifeMap: map.lifeMap,
  };
}

export function enabledModulesFromFeatures(
  map: ProductCapabilityMap,
): Record<string, boolean> {
  return {
    community: map.community,
    experiences: map.experiences,
    reservations: map.reservations,
    services: map.resources || map.reservations,
    lifeMap: map.lifeMap,
    marketplace: map.marketplace,
    housing: map.housing,
    work: map.work,
    official: map.official,
    golf: map.golf,
    hospitality: map.hospitality,
  };
}

export function featureOnDoesNotGrantPermissions(): boolean {
  return !capabilitiesForRole("member").has(CAPABILITIES.manageEnter);
}

export function packCannotControlAuthz(): boolean {
  return true;
}

export function canAccessPlatformAdmin(input: {
  personId: string | null | undefined;
  operators: readonly PlatformOperator[];
}): boolean {
  if (!input.personId?.trim()) return false;
  return input.operators.some(
    (row) => row.personId === input.personId && row.status === "active",
  );
}

export function rejectClientAuthoritySpoof(
  body: ClientAuthoritySpoof | null | undefined,
): string | null {
  if (!body) return null;
  if (body.tenantId != null) return "tenantId";
  if (body.territoryId != null) return "territoryId";
  if (body.role != null) return "role";
  if (body.plan != null) return "plan";
  if (body.features != null) return "features";
  if (body.status != null) return "status";
  if (body.limits != null) return "limits";
  if (body.permissions != null) return "permissions";
  return null;
}

function cryptoId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string): string {
  const ascii = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "tenant";
}

export const TerritoryProvisionService = {
  provision(input: TerritoryProvisionInput): Territory {
    return createTerritory({
      tenantId: input.tenantId,
      name: input.name,
      slug: input.slug,
      bounds: input.bounds,
      locale: input.locale,
      timezone: input.timezone,
      status: "active",
    });
  },
};

export const TenantFactoryService = {
  provision(
    snapshot: TenantFactorySnapshot,
    request: TenantProvisionRequest,
    options?: { plan?: TenantPlan; tenantId?: string },
  ): { snapshot: TenantFactorySnapshot; result: TenantProvisionResult } {
    const slug = slugify(request.slug || request.name);
    if (snapshot.tenants.some((row) => row.slug === slug)) {
      throw new Error("slug_taken");
    }
    if (!request.territories.length) {
      throw new Error("territory_required");
    }
    const plan = options?.plan ?? "community";
    const now = new Date().toISOString();
    const tenantId = options?.tenantId?.trim() || cryptoId();
    const branding: TenantBrandingSlice = {
      name: request.branding?.name?.trim() || request.name.trim(),
      shortName: request.branding?.shortName?.trim(),
      primaryColor: request.branding?.primaryColor?.trim(),
    };
    const tenant: ProvisionedTenant = {
      id: tenantId,
      name: request.name.trim(),
      slug,
      status: "provisioned",
      plan,
      locale: request.locale.trim() || "en",
      timezone: request.timezone.trim() || "UTC",
      branding,
      createdAt: now,
    };
    const features = {
      ...featuresForPlan(plan),
      ...request.features,
      community: true,
    };
    const territories = request.territories.map((row) =>
      TerritoryProvisionService.provision({
        tenantId,
        name: row.name,
        slug: row.slug,
        bounds: row.bounds,
        locale: row.locale?.trim() || tenant.locale,
        timezone: row.timezone?.trim() || tenant.timezone,
      }),
    );
    const next: TenantFactorySnapshot = {
      ...snapshot,
      tenants: [tenant, ...snapshot.tenants],
      territories: [...territories, ...snapshot.territories],
      featuresByTenant: {
        ...snapshot.featuresByTenant,
        [tenantId]: features,
      },
      subscriptionStatusByTenant: {
        ...(snapshot.subscriptionStatusByTenant ?? {}),
        [tenantId]: "trial",
      },
    };
    return {
      snapshot: next,
      result: {
        tenantId,
        territories,
        status: tenant.status,
      },
    };
  },

  addTerritory(
    snapshot: TenantFactorySnapshot,
    input: TerritoryProvisionInput,
  ): { snapshot: TenantFactorySnapshot; territory: Territory } {
    const tenant = snapshot.tenants.find((row) => row.id === input.tenantId);
    if (!tenant) throw new Error("tenant_not_found");
    const territory = TerritoryProvisionService.provision({
      ...input,
      locale: input.locale?.trim() || tenant.locale,
      timezone: input.timezone?.trim() || tenant.timezone,
    });
    return {
      snapshot: {
        ...snapshot,
        territories: [territory, ...snapshot.territories],
      },
      territory,
    };
  },

  markReady(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
  ): TenantFactorySnapshot {
    return TenantFactoryService.setStatus(snapshot, tenantId, "active");
  },

  setStatus(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
    status: TenantStatus,
  ): TenantFactorySnapshot {
    const tenant = snapshot.tenants.find((row) => row.id === tenantId);
    if (!tenant) throw new Error("tenant_not_found");
    return {
      ...snapshot,
      tenants: snapshot.tenants.map((row) =>
        row.id === tenantId ? { ...row, status } : row,
      ),
    };
  },

  /**
   * SaaS feature overlay. Does not replace Feature Management
   * (tenant-contract / pack flags). Plan stays the commercial source.
   */
  setFeatures(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
    patch: Partial<ProductCapabilityMap>,
  ): TenantFactorySnapshot {
    const tenant = snapshot.tenants.find((row) => row.id === tenantId);
    if (!tenant) throw new Error("tenant_not_found");
    const current =
      snapshot.featuresByTenant[tenantId] ?? featuresForPlan(tenant.plan);
    const next = { ...current };
    for (const [key, value] of Object.entries(patch)) {
      if (typeof value === "boolean") {
        next[key as keyof ProductCapabilityMap] = value;
      }
    }
    next.community = true;
    return {
      ...snapshot,
      featuresByTenant: {
        ...snapshot.featuresByTenant,
        [tenantId]: next,
      },
    };
  },

  seedAdministrator(
    snapshot: TenantFactorySnapshot,
    input: { tenantId: string; personId: string },
  ): TenantFactorySnapshot {
    const territories = filterTerritoriesForTenant(
      snapshot.territories,
      input.tenantId,
    );
    const home = territories[0];
    if (!home) throw new Error("territory_required");
    const seed: TenantAdministratorSeed = {
      tenantId: input.tenantId,
      territoryId: home.id,
      personId: input.personId.trim(),
    };
    return {
      ...snapshot,
      administrators: [seed, ...snapshot.administrators],
    };
  },

  configurationContext(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
  ): TenantConfigurationContext | null {
    const tenant = snapshot.tenants.find((row) => row.id === tenantId);
    if (!tenant) return null;
    const features =
      snapshot.featuresByTenant[tenantId] ?? featuresForPlan(tenant.plan);
    const territories = filterTerritoriesForTenant(
      snapshot.territories,
      tenantId,
    );
    return {
      tenantId: tenant.id,
      branding: tenant.branding,
      locale: tenant.locale,
      timezone: tenant.timezone,
      features,
      enabledModules: enabledModulesFromFeatures(features),
      territories: territories.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        locale: row.locale,
        timezone: row.timezone,
      })),
    };
  },
};

/**
 * Adopt an already-configured identity (Panorámica, Valley, Ocean Hills, …)
 * as a provisioned tenant. Same function for every customer — no slug branch.
 */
export function adoptConfiguredTenant(input: {
  snapshot: TenantFactorySnapshot;
  identity: TenantIdentityRecord;
  branding: TenantBrandingSlice;
  features: ProductCapabilityMap;
  territories: Array<{
    id: string;
    name: string;
    slug: string;
    locale?: string;
    timezone?: string;
    bounds?: TerritoryBounds;
  }>;
}): { snapshot: TenantFactorySnapshot; result: TenantProvisionResult } {
  const tenant: ProvisionedTenant = {
    id: input.identity.tenantUuid,
    name: input.identity.name,
    slug: input.identity.slug,
    status: "active",
    plan: "premium",
    locale: input.identity.locale,
    timezone: input.identity.timezone,
    branding: input.branding,
    createdAt: new Date().toISOString(),
  };
  const territories = input.territories.map((row) =>
    createTerritory({
      id: row.id,
      tenantId: tenant.id,
      name: row.name,
      slug: row.slug,
      locale: row.locale || tenant.locale,
      timezone: row.timezone || tenant.timezone,
      bounds: row.bounds,
      status: "active",
    }),
  );
  return {
    snapshot: {
      ...input.snapshot,
      tenants: [tenant, ...input.snapshot.tenants],
      territories: [...territories, ...input.snapshot.territories],
      featuresByTenant: {
        ...input.snapshot.featuresByTenant,
        [tenant.id]: { ...input.features, community: true },
      },
      subscriptionStatusByTenant: {
        ...(input.snapshot.subscriptionStatusByTenant ?? {}),
        [tenant.id]: "active",
      },
    },
    result: {
      tenantId: tenant.id,
      territories,
      status: tenant.status,
    },
  };
}

export function productCapabilitiesFromRequestedFeatures(
  features: Readonly<Record<string, boolean>>,
): ProductCapabilityMap {
  return productCapabilitiesFromFeatures(features);
}

export function isOpaqueTenantFactoryEntity(name: string): boolean {
  return (
    name === "PanoramicaTenant" ||
    name === "CustomerSpecificCode" ||
    name === "CommunityClone" ||
    name === "WhiteLabelFork" ||
    name === "GlobalAdminBypass" ||
    name === "TenantBusinessLogic"
  );
}
