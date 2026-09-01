/**
 * Platform Operations — SaaS control plane projection.
 * Operates tenants, not community life.
 * Does not persist GlobalCommunityEntity, PlatformContentEntity,
 * UniversalAnalyticsEntity, UserRanking, EngagementScore,
 * CrossTenantDashboardData or FeatureScore.
 */

import type { AdminAuditLog } from "../domain/admin-audit-log";
import { sanitizeAuditMetadata } from "../domain/admin-audit-log";
import type { TenantStatus } from "../domain/tenant";
import { canAccessAdminOperations } from "../domain/admin-operations";
import type { MembershipRole } from "./membership-role";
import { capabilitiesForRole } from "./authorization";
import { CAPABILITIES } from "./capabilities";
import {
  PRODUCT_CAPABILITY_KEYS,
  type ProductCapabilityKey,
  type ProductCapabilityMap,
} from "./tenant-contract";
import {
  featuresForPlan,
  type TenantFactorySnapshot,
  type TenantPlan,
  type ProvisionedTenant,
} from "../tenant/factory";
import { filterTerritoriesForTenant as territoriesOfTenant } from "../domain/territory";

export const TENANT_HEALTH_STATUSES = [
  "active",
  "suspended",
  "provisioning",
  "archived",
] as const;

export type TenantHealthStatus = (typeof TENANT_HEALTH_STATUSES)[number];

export const TENANT_PROVISIONING_STATUSES = [
  "created",
  "configuring",
  "ready",
  "suspended",
  "archived",
] as const;

export type TenantProvisioningStatus =
  (typeof TENANT_PROVISIONING_STATUSES)[number];

export const TENANT_PROVISIONING_STEPS = [
  "create_tenant",
  "create_territory",
  "configure_features",
  "ready",
] as const;

export type TenantProvisioningStep =
  (typeof TENANT_PROVISIONING_STEPS)[number];

export const PLATFORM_ADMIN_SURFACES = [
  "tenants",
  "territories",
  "features",
  "plans",
  "security",
  "audit",
] as const;

export type PlatformAdminSurface = (typeof PLATFORM_ADMIN_SURFACES)[number];

export const PLATFORM_SECURITY_EVENT_KINDS = [
  "cross_tenant",
  "invalid_permission",
  "territory_mismatch",
  "admin_change",
] as const;

export type PlatformSecurityEventKind =
  (typeof PLATFORM_SECURITY_EVENT_KINDS)[number];

export type PlatformAlertKind = "provisioning" | "isolation" | "suspended";

export type PlatformAlert = {
  kind: PlatformAlertKind;
  tenantId?: string;
  detail: string;
};

export type SystemHealth = {
  status: "ok" | "attention";
  provisioningPending: number;
  isolationAlerts: number;
};

export type FeatureUsageMap = Record<ProductCapabilityKey, number>;

/** Per-tenant ON/OFF. Not a score, ranking, or FeatureScore. */
export type TenantFeatureObservability = {
  tenantId: string;
  marketplace: boolean;
  lifeMap: boolean;
  reservations: boolean;
  enabledFeatures: ProductCapabilityKey[];
};

export type PlatformOperationsContext = {
  tenantsCount: number;
  activeTenants: number;
  territoriesCount: number;
  featuresUsage: FeatureUsageMap;
  systemHealth: SystemHealth;
  alerts: PlatformAlert[];
};

export type TenantHealthContext = {
  tenantId: string;
  status: TenantHealthStatus;
  territories: Array<{ id: string; name: string; slug: string }>;
  enabledFeatures: ProductCapabilityKey[];
  lastActivity: string | null;
  configurationStatus: "incomplete" | "complete";
};

export type TenantPlanLimits = {
  territories: number;
  members: number | null;
};

export type TenantSubscription = {
  tenantId: string;
  plan: TenantPlan;
  features: ProductCapabilityMap;
  limits: TenantPlanLimits;
  billingProvider: "none";
};

export type PlatformSecurityEvent = {
  kind: PlatformSecurityEventKind;
  tenantId?: string;
  actorPersonId?: string;
  timestamp: string;
  action: string;
};

export type PlatformAuditRecord = {
  actor: string;
  tenantId: string;
  territoryId?: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type PlatformOperationsInput = {
  snapshot: TenantFactorySnapshot;
  audit: readonly AdminAuditLog[];
  securityEvents: readonly PlatformSecurityEvent[];
};

export function tenantHealthStatusFromTenant(
  status: TenantStatus,
): TenantHealthStatus {
  if (status === "active") return "active";
  if (status === "suspended") return "suspended";
  if (status === "archived" || status === "deleted") return "archived";
  return "provisioning";
}

export function provisioningStatusFromTenant(
  status: TenantStatus,
): TenantProvisioningStatus {
  if (status === "provisioned") return "created";
  if (status === "trial") return "configuring";
  if (status === "active") return "ready";
  if (status === "suspended") return "suspended";
  return "archived";
}

export function limitsForPlan(plan: TenantPlan): TenantPlanLimits {
  switch (plan) {
    case "starter":
      return { territories: 1, members: 50 };
    case "community":
      return { territories: 5, members: 500 };
    case "premium":
      return { territories: 25, members: 5000 };
    case "enterprise":
      return { territories: 100, members: null };
  }
}

export function projectTenantSubscription(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
): TenantSubscription | null {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) return null;
  const features =
    snapshot.featuresByTenant[tenantId] ?? featuresForPlan(tenant.plan);
  return {
    tenantId: tenant.id,
    plan: tenant.plan,
    features,
    limits: limitsForPlan(tenant.plan),
    billingProvider: "none",
  };
}

export function billingPlanDoesNotGrantPermissions(): boolean {
  return !capabilitiesForRole("member").has(CAPABILITIES.manageEnter);
}

export function communityAdminCannotMutateSaas(input: {
  role: MembershipRole | null | undefined;
  isPlatformOperator: boolean;
}): boolean {
  if (input.isPlatformOperator) return false;
  return canAccessAdminOperations(input.role);
}

export function emptyFeatureUsage(): FeatureUsageMap {
  return {
    golf: 0,
    hospitality: 0,
    marketplace: 0,
    reservations: 0,
    experiences: 0,
    housing: 0,
    community: 0,
    resources: 0,
    lifeMap: 0,
    work: 0,
    official: 0,
  };
}

export function projectFeatureUsage(
  snapshot: TenantFactorySnapshot,
): FeatureUsageMap {
  const usage = emptyFeatureUsage();
  for (const tenant of snapshot.tenants) {
    const features =
      snapshot.featuresByTenant[tenant.id] ?? featuresForPlan(tenant.plan);
    for (const key of PRODUCT_CAPABILITY_KEYS) {
      if (features[key]) usage[key] += 1;
    }
  }
  return usage;
}

function lastAuditForTenant(
  audit: readonly AdminAuditLog[],
  tenantId: string,
): string | null {
  const hit = audit.find((row) => row.tenantId === tenantId);
  return hit?.createdAt ?? null;
}

export function projectTenantHealth(
  snapshot: TenantFactorySnapshot,
  tenant: ProvisionedTenant,
  audit: readonly AdminAuditLog[] = [],
): TenantHealthContext {
  const territories = territoriesOfTenant(snapshot.territories, tenant.id);
  const features =
    snapshot.featuresByTenant[tenant.id] ?? featuresForPlan(tenant.plan);
  const enabledFeatures = PRODUCT_CAPABILITY_KEYS.filter(
    (key) => features[key],
  );
  const configurationStatus =
    territories.length > 0 && enabledFeatures.length > 0
      ? "complete"
      : "incomplete";
  return {
    tenantId: tenant.id,
    status: tenantHealthStatusFromTenant(tenant.status),
    territories: territories.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    })),
    enabledFeatures,
    lastActivity: lastAuditForTenant(audit, tenant.id) ?? tenant.createdAt,
    configurationStatus,
  };
}

export function projectPlatformAudit(
  log: AdminAuditLog,
): PlatformAuditRecord {
  return {
    actor: log.actorPersonId,
    tenantId: log.tenantId,
    territoryId: log.territoryId,
    action: log.action,
    timestamp: log.createdAt,
    metadata: sanitizeAuditMetadata(log.metadata),
  };
}

export function detectCrossTenantSecurityEvent(input: {
  actorTenantId: string;
  requestedTenantId: string;
  actorPersonId?: string;
  action?: string;
}): PlatformSecurityEvent | null {
  if (!input.requestedTenantId || input.actorTenantId === input.requestedTenantId) {
    return null;
  }
  return {
    kind: "cross_tenant",
    tenantId: input.actorTenantId,
    actorPersonId: input.actorPersonId,
    timestamp: new Date().toISOString(),
    action: input.action ?? "security.cross_tenant",
  };
}

export function detectInvalidPermissionEvent(input: {
  tenantId?: string;
  actorPersonId?: string;
  action?: string;
}): PlatformSecurityEvent {
  return {
    kind: "invalid_permission",
    tenantId: input.tenantId,
    actorPersonId: input.actorPersonId,
    timestamp: new Date().toISOString(),
    action: input.action ?? "security.permission.changed",
  };
}

export function detectTerritoryMismatchEvent(input: {
  actorTerritoryId: string;
  requestedTerritoryId: string;
  tenantId?: string;
  actorPersonId?: string;
  action?: string;
}): PlatformSecurityEvent | null {
  if (
    !input.requestedTerritoryId ||
    input.actorTerritoryId === input.requestedTerritoryId
  ) {
    return null;
  }
  return {
    kind: "territory_mismatch",
    tenantId: input.tenantId,
    actorPersonId: input.actorPersonId,
    timestamp: new Date().toISOString(),
    action: input.action ?? "security.territory_mismatch",
  };
}

export function detectAdminChangeEvent(input: {
  tenantId?: string;
  actorPersonId?: string;
  action?: string;
}): PlatformSecurityEvent {
  return {
    kind: "admin_change",
    tenantId: input.tenantId,
    actorPersonId: input.actorPersonId,
    timestamp: new Date().toISOString(),
    action: input.action ?? "platform.admin.action",
  };
}

export function projectTenantFeatureObservability(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
): TenantFeatureObservability | null {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) return null;
  const features =
    snapshot.featuresByTenant[tenantId] ?? featuresForPlan(tenant.plan);
  return {
    tenantId,
    marketplace: features.marketplace,
    lifeMap: features.lifeMap,
    reservations: features.reservations,
    enabledFeatures: PRODUCT_CAPABILITY_KEYS.filter((key) => features[key]),
  };
}

export function projectTenantHealthList(
  snapshot: TenantFactorySnapshot,
  audit: readonly AdminAuditLog[] = [],
): TenantHealthContext[] {
  return snapshot.tenants.map((tenant) =>
    projectTenantHealth(snapshot, tenant, audit),
  );
}

export function projectTenantFeatureObservabilityList(
  snapshot: TenantFactorySnapshot,
): TenantFeatureObservability[] {
  return snapshot.tenants.flatMap((tenant) => {
    const row = projectTenantFeatureObservability(snapshot, tenant.id);
    return row ? [row] : [];
  });
}

export function projectPlatformOperationsContext(
  input: PlatformOperationsInput,
): PlatformOperationsContext {
  const tenants = input.snapshot.tenants;
  const activeTenants = tenants.filter((row) => row.status === "active").length;
  const provisioningPending = tenants.filter((row) => {
    const stage = provisioningStatusFromTenant(row.status);
    return stage === "created" || stage === "configuring";
  }).length;
  const isolationAlerts = input.securityEvents.filter(
    (row) => row.kind === "cross_tenant" || row.kind === "territory_mismatch",
  ).length;
  const alerts: PlatformAlert[] = [];
  for (const tenant of tenants) {
    if (tenant.status === "suspended") {
      alerts.push({
        kind: "suspended",
        tenantId: tenant.id,
        detail: "tenant_suspended",
      });
    }
    const owned = territoriesOfTenant(input.snapshot.territories, tenant.id);
    if (owned.length === 0) {
      alerts.push({
        kind: "provisioning",
        tenantId: tenant.id,
        detail: "territory_missing",
      });
    }
  }
  if (isolationAlerts > 0) {
    alerts.push({
      kind: "isolation",
      detail: "cross_tenant_attempts",
    });
  }
  const systemHealth: SystemHealth = {
    status:
      isolationAlerts > 0 || provisioningPending > 0 ? "attention" : "ok",
    provisioningPending,
    isolationAlerts,
  };
  return {
    tenantsCount: tenants.length,
    activeTenants,
    territoriesCount: input.snapshot.territories.length,
    featuresUsage: projectFeatureUsage(input.snapshot),
    systemHealth,
    alerts,
  };
}

export function isOpaquePlatformOperationsEntity(name: string): boolean {
  return (
    name === "GlobalCommunityEntity" ||
    name === "PlatformContentEntity" ||
    name === "UniversalAnalyticsEntity" ||
    name === "UserRanking" ||
    name === "EngagementScore" ||
    name === "CrossTenantDashboardData" ||
    name === "FeatureScore"
  );
}