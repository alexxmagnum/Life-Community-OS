/**
 * Tenant Lifecycle — SaaS maturity, not community life.
 * Operates tenant status, contract and product limits.
 * Does not persist GlobalCommunityManager, TenantOverrideLogic,
 * CustomerSpecificTenant, PlatformContentStore, UniversalBusinessRules
 * or GlobalModerationAuthority. Never branches on a customer slug.
 */

import type { TenantStatus } from "../domain/tenant";
import { capabilitiesForRole } from "./authorization";
import { CAPABILITIES } from "./capabilities";
import {
  featuresForPlan,
  type TenantFactorySnapshot,
  type TenantPlan,
} from "../tenant/factory";
import type { ProductCapabilityMap } from "./tenant-contract";

export const TENANT_LIFECYCLE_STATUSES = [
  "draft",
  "provisioning",
  "active",
  "suspended",
  "archived",
] as const;

export type TenantLifecycleStatus =
  (typeof TENANT_LIFECYCLE_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = [
  "trial",
  "active",
  "past_due",
  "cancelled",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Product limits. Not security. null = unlimited. */
export type TenantLimits = {
  territories: number | null;
  members: number | null;
  storage: number | null;
  resources: number | null;
};

/**
 * SaaS commercial contract. Distinct from runtime TenantContract
 * (white-label identity + branding in tenant-contract.ts).
 */
export type TenantSaaSContract = {
  tenantId: string;
  plan: TenantPlan;
  features: ProductCapabilityMap;
  limits: TenantLimits;
  status: TenantLifecycleStatus;
  effectiveFrom: string;
  effectiveUntil: string | null;
};

export type TenantLifecycleContext = {
  tenantId: string;
  status: TenantLifecycleStatus;
  allowedTransitions: TenantLifecycleStatus[];
  suspended: boolean;
  dataPreserved: boolean;
  authBlocked: boolean;
  mutationsBlocked: boolean;
};

export const TENANT_LIFECYCLE_TRANSITIONS: Readonly<
  Record<TenantLifecycleStatus, readonly TenantLifecycleStatus[]>
> = {
  draft: ["provisioning", "active"],
  provisioning: ["active"],
  active: ["suspended"],
  suspended: ["active", "archived"],
  archived: [],
};

export function lifecycleStatusFromTenant(
  status: TenantStatus,
): TenantLifecycleStatus {
  if (status === "active") return "active";
  if (status === "suspended") return "suspended";
  if (status === "archived" || status === "deleted") return "archived";
  if (status === "trial") return "provisioning";
  return "draft";
}

export function tenantStatusFromLifecycle(
  status: TenantLifecycleStatus,
): TenantStatus {
  if (status === "active") return "active";
  if (status === "suspended") return "suspended";
  if (status === "archived") return "archived";
  if (status === "provisioning") return "trial";
  return "provisioned";
}

export function productLimitsForPlan(plan: TenantPlan): TenantLimits {
  switch (plan) {
    case "starter":
      return {
        territories: 1,
        members: 50,
        storage: 1024,
        resources: 10,
      };
    case "community":
      return {
        territories: 1,
        members: 500,
        storage: 5120,
        resources: 50,
      };
    case "premium":
      return {
        territories: 25,
        members: 5000,
        storage: 51200,
        resources: 500,
      };
    case "enterprise":
      return {
        territories: null,
        members: null,
        storage: null,
        resources: null,
      };
  }
}

export function canTransitionLifecycle(
  from: TenantLifecycleStatus,
  to: TenantLifecycleStatus,
  options?: { explicitRestore?: boolean },
): boolean {
  if (from === "archived" && to === "active") {
    return options?.explicitRestore === true;
  }
  return TENANT_LIFECYCLE_TRANSITIONS[from].includes(to);
}

export function subscriptionStatusForLifecycle(
  status: TenantLifecycleStatus,
  overlay?: SubscriptionStatus,
): SubscriptionStatus {
  if (overlay) return overlay;
  if (status === "archived") return "cancelled";
  if (status === "draft" || status === "provisioning") return "trial";
  return "active";
}

export function tenantLifecycleBlocksAuth(
  status: TenantLifecycleStatus,
): boolean {
  return status === "suspended" || status === "archived";
}

export function tenantLifecycleBlocksMutations(
  status: TenantLifecycleStatus,
): boolean {
  return status === "suspended" || status === "archived";
}

export function productLimitsDoNotGrantPermissions(): boolean {
  return !capabilitiesForRole("member").has(CAPABILITIES.manageEnter);
}

export function saasPlanDoesNotGrantPermissions(): boolean {
  return productLimitsDoNotGrantPermissions();
}

function featuresOf(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
  plan: TenantPlan,
): ProductCapabilityMap {
  return snapshot.featuresByTenant[tenantId] ?? featuresForPlan(plan);
}

function limitsOf(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
  plan: TenantPlan,
): TenantLimits {
  return snapshot.limitsByTenant?.[tenantId] ?? productLimitsForPlan(plan);
}

export function projectTenantLifecycleContext(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
): TenantLifecycleContext | null {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) return null;
  const status = lifecycleStatusFromTenant(tenant.status);
  const allowed = [...TENANT_LIFECYCLE_TRANSITIONS[status]];
  if (status === "archived") {
    /* restore is explicit, not a free transition */
  }
  return {
    tenantId: tenant.id,
    status,
    allowedTransitions: allowed,
    suspended: status === "suspended",
    dataPreserved: true,
    authBlocked: tenantLifecycleBlocksAuth(status),
    mutationsBlocked: tenantLifecycleBlocksMutations(status),
  };
}

export function projectTenantSaaSContract(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
): TenantSaaSContract | null {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) return null;
  const stored = snapshot.contractsByTenant?.[tenantId];
  const status = lifecycleStatusFromTenant(tenant.status);
  return {
    tenantId: tenant.id,
    plan: tenant.plan,
    features: featuresOf(snapshot, tenant.id, tenant.plan),
    limits: limitsOf(snapshot, tenant.id, tenant.plan),
    status,
    effectiveFrom: stored?.effectiveFrom ?? tenant.createdAt,
    effectiveUntil: stored?.effectiveUntil ?? null,
  };
}

export function wouldExceedTerritoryLimit(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
): boolean {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) return false;
  const limits = limitsOf(snapshot, tenantId, tenant.plan);
  if (limits.territories == null) return false;
  const owned = snapshot.territories.filter((row) => row.tenantId === tenantId)
    .length;
  return owned >= limits.territories;
}

function applyLifecycle(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
  next: TenantLifecycleStatus,
  options?: { subscriptionStatus?: SubscriptionStatus },
): TenantFactorySnapshot {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) throw new Error("tenant_not_found");
  const domainStatus = tenantStatusFromLifecycle(next);
  const subscription =
    options?.subscriptionStatus ??
    subscriptionStatusForLifecycle(
      next,
      snapshot.subscriptionStatusByTenant?.[tenantId],
    );
  const contract = projectTenantSaaSContract(snapshot, tenantId);
  return {
    ...snapshot,
    tenants: snapshot.tenants.map((row) =>
      row.id === tenantId ? { ...row, status: domainStatus } : row,
    ),
    subscriptionStatusByTenant: {
      ...(snapshot.subscriptionStatusByTenant ?? {}),
      [tenantId]: subscription,
    },
    contractsByTenant: contract
      ? {
          ...(snapshot.contractsByTenant ?? {}),
          [tenantId]: { ...contract, status: next },
        }
      : snapshot.contractsByTenant,
  };
}

export const TenantLifecycleService = {
  context: projectTenantLifecycleContext,
  contract: projectTenantSaaSContract,

  canTransition: canTransitionLifecycle,

  startProvisioning(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
  ): TenantFactorySnapshot {
    const current = projectTenantLifecycleContext(snapshot, tenantId);
    if (!current) throw new Error("tenant_not_found");
    if (!canTransitionLifecycle(current.status, "provisioning")) {
      throw new Error("invalid_transition");
    }
    return applyLifecycle(snapshot, tenantId, "provisioning", {
      subscriptionStatus: "trial",
    });
  },

  activateTenant(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
  ): TenantFactorySnapshot {
    const current = projectTenantLifecycleContext(snapshot, tenantId);
    if (!current) throw new Error("tenant_not_found");
    if (!canTransitionLifecycle(current.status, "active")) {
      throw new Error("invalid_transition");
    }
    return applyLifecycle(snapshot, tenantId, "active", {
      subscriptionStatus: "active",
    });
  },

  suspendTenant(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
  ): TenantFactorySnapshot {
    const current = projectTenantLifecycleContext(snapshot, tenantId);
    if (!current) throw new Error("tenant_not_found");
    if (!canTransitionLifecycle(current.status, "suspended")) {
      throw new Error("invalid_transition");
    }
    return applyLifecycle(snapshot, tenantId, "suspended");
  },

  restoreTenant(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
  ): TenantFactorySnapshot {
    const current = projectTenantLifecycleContext(snapshot, tenantId);
    if (!current) throw new Error("tenant_not_found");
    if (
      !canTransitionLifecycle(current.status, "active", {
        explicitRestore: true,
      })
    ) {
      throw new Error("invalid_transition");
    }
    return applyLifecycle(snapshot, tenantId, "active", {
      subscriptionStatus: "active",
    });
  },

  archiveTenant(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
  ): TenantFactorySnapshot {
    const current = projectTenantLifecycleContext(snapshot, tenantId);
    if (!current) throw new Error("tenant_not_found");
    if (!canTransitionLifecycle(current.status, "archived")) {
      throw new Error("invalid_transition");
    }
    return applyLifecycle(snapshot, tenantId, "archived", {
      subscriptionStatus: "cancelled",
    });
  },

  setLimits(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
    limits: TenantLimits,
  ): TenantFactorySnapshot {
    const tenant = snapshot.tenants.find((row) => row.id === tenantId);
    if (!tenant) throw new Error("tenant_not_found");
    const contract = projectTenantSaaSContract(snapshot, tenantId);
    return {
      ...snapshot,
      limitsByTenant: {
        ...(snapshot.limitsByTenant ?? {}),
        [tenantId]: limits,
      },
      contractsByTenant: contract
        ? {
            ...(snapshot.contractsByTenant ?? {}),
            [tenantId]: { ...contract, limits },
          }
        : snapshot.contractsByTenant,
    };
  },

  setPlan(
    snapshot: TenantFactorySnapshot,
    tenantId: string,
    plan: TenantPlan,
  ): TenantFactorySnapshot {
    const tenant = snapshot.tenants.find((row) => row.id === tenantId);
    if (!tenant) throw new Error("tenant_not_found");
    const nextLimits = productLimitsForPlan(plan);
    const contract = projectTenantSaaSContract(snapshot, tenantId);
    return {
      ...snapshot,
      tenants: snapshot.tenants.map((row) =>
        row.id === tenantId ? { ...row, plan } : row,
      ),
      limitsByTenant: {
        ...(snapshot.limitsByTenant ?? {}),
        [tenantId]: nextLimits,
      },
      contractsByTenant: contract
        ? {
            ...(snapshot.contractsByTenant ?? {}),
            [tenantId]: { ...contract, plan, limits: nextLimits },
          }
        : snapshot.contractsByTenant,
    };
  },
};

export function isOpaqueTenantLifecycleEntity(name: string): boolean {
  return (
    name === "GlobalCommunityManager" ||
    name === "TenantOverrideLogic" ||
    name === "CustomerSpecificTenant" ||
    name === "PlatformContentStore" ||
    name === "UniversalBusinessRules" ||
    name === "GlobalModerationAuthority"
  );
}
