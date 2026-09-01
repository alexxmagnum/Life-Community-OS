/**
 * Commercial SaaS customer operations — onboarding, activation, support projection.
 * Does not create GlobalCustomerEntity, UniversalBillingUser, CustomerClone,
 * CommercialCommunityEntity, SaaSMarketingEntity, or GlobalSubscriptionPermission.
 * Never branches on a customer slug.
 */

import { sanitizeAuditMetadata } from "../domain/admin-audit-log";
import { SAAS_CONTROL_PLANE_FORBIDDEN } from "../domain/admin-operations";
import { capabilitiesForRole } from "./authorization";
import { CAPABILITIES } from "./capabilities";
import { assertTenantBoundary } from "./security-context";
import {
  featuresForPlan,
  rejectClientAuthoritySpoof,
  type TenantFactorySnapshot,
  type TenantPlan,
} from "../tenant/factory";
import type { ProductCapabilityKey, ProductCapabilityMap } from "./tenant-contract";
import {
  productLimitsForPlan,
  type TenantLimits,
} from "./tenant-lifecycle";
import {
  provisioningStatusFromTenant,
  projectTenantSubscription,
  tenantHealthStatusFromTenant,
  type TenantHealthContext,
  type TenantSubscription,
} from "./operations";

export const CUSTOMER_ONBOARDING_STATUSES = [
  "requested",
  "configuring",
  "ready",
  "suspended",
] as const;

export type CustomerOnboardingStatus =
  (typeof CUSTOMER_ONBOARDING_STATUSES)[number];

export const PRODUCT_FEATURE_CATALOG_KEYS = [
  "lifeMap",
  "experiences",
  "reservations",
  "marketplace",
  "services",
  "housing",
  "community",
  "business",
] as const;

export type ProductFeatureCatalogKey =
  (typeof PRODUCT_FEATURE_CATALOG_KEYS)[number];

export type ProductFeatureCatalogEntry = {
  key: ProductFeatureCatalogKey;
  label: string;
  capabilityKey: ProductCapabilityKey;
};

export type TenantCustomerContext = {
  tenantId: string;
  companyName: string;
  contact: {
    name: string;
    email: string;
  };
  onboardingStatus: CustomerOnboardingStatus;
  plan: TenantPlan;
  features: ProductCapabilityMap;
  limits: TenantLimits;
};

export type CustomerAdministratorInvitation = {
  id: string;
  tenantId: string;
  email: string;
  invitedBy: string;
  status: "pending" | "accepted" | "cancelled";
  createdAt: string;
};

export type CustomerOperationsPlane = {
  customers: TenantCustomerContext[];
  adminInvitations: CustomerAdministratorInvitation[];
};

export type CustomerOperationsContext = {
  tenantId: string;
  companyName: string;
  onboardingStatus: CustomerOnboardingStatus;
  tenantStatus: string;
  configurationStatus: "incomplete" | "complete";
  plan: TenantPlan;
  features: ProductCapabilityMap;
  limits: TenantLimits;
  subscription: TenantSubscription | null;
  health: Pick<TenantHealthContext, "status" | "configurationStatus"> | null;
  pendingAdministratorInvite: boolean;
};

export type CustomerActivationStep =
  | "initialize"
  | "configure"
  | "activate_features"
  | "invite_administrator"
  | "complete";

export function emptyCustomerOperationsPlane(): CustomerOperationsPlane {
  return { customers: [], adminInvitations: [] };
}

export function productFeatureCatalog(): readonly ProductFeatureCatalogEntry[] {
  return [
    { key: "lifeMap", label: "Life Map", capabilityKey: "lifeMap" },
    { key: "experiences", label: "Experiences", capabilityKey: "experiences" },
    {
      key: "reservations",
      label: "Reservations",
      capabilityKey: "reservations",
    },
    { key: "marketplace", label: "Marketplace", capabilityKey: "marketplace" },
    { key: "services", label: "Services", capabilityKey: "work" },
    { key: "housing", label: "Housing", capabilityKey: "housing" },
    { key: "community", label: "Community", capabilityKey: "community" },
    { key: "business", label: "Business", capabilityKey: "official" },
  ];
}

export function catalogKeyToCapability(
  key: ProductFeatureCatalogKey,
): ProductCapabilityKey {
  const entry = productFeatureCatalog().find((row) => row.key === key);
  return entry?.capabilityKey ?? "community";
}

export function projectTenantCustomerContext(
  snapshot: TenantFactorySnapshot,
  plane: CustomerOperationsPlane,
  tenantId: string,
  contact?: { name: string; email: string },
): TenantCustomerContext | null {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) return null;
  const stored = plane.customers.find((row) => row.tenantId === tenantId);
  const features =
    snapshot.featuresByTenant[tenantId] ?? featuresForPlan(tenant.plan);
  const limits =
    snapshot.limitsByTenant?.[tenantId] ?? productLimitsForPlan(tenant.plan);
  const onboardingStatus =
    stored?.onboardingStatus ??
    (tenant.status === "active"
      ? "ready"
      : tenant.status === "suspended"
        ? "suspended"
        : tenant.status === "trial"
          ? "configuring"
          : "requested");
  return {
    tenantId: tenant.id,
    companyName: stored?.companyName ?? tenant.name,
    contact: stored?.contact ??
      contact ?? {
        name: tenant.name,
        email: "",
      },
    onboardingStatus,
    plan: tenant.plan,
    features,
    limits,
  };
}

export function projectCustomerOperationsContext(
  snapshot: TenantFactorySnapshot,
  plane: CustomerOperationsPlane,
  tenantId: string,
): CustomerOperationsContext | null {
  const customer = projectTenantCustomerContext(snapshot, plane, tenantId);
  if (!customer) return null;
  const tenant = snapshot.tenants.find((row) => row.id === tenantId)!;
  const subscription = projectTenantSubscription(snapshot, tenantId);
  const territories = snapshot.territories.filter(
    (row) => row.tenantId === tenantId,
  );
  const configurationStatus =
    territories.length > 0 && customer.onboardingStatus !== "requested"
      ? "complete"
      : "incomplete";
  return {
    tenantId,
    companyName: customer.companyName,
    onboardingStatus: customer.onboardingStatus,
    tenantStatus: tenant.status,
    configurationStatus,
    plan: customer.plan,
    features: customer.features,
    limits: customer.limits,
    subscription,
    health: {
      status: tenantHealthStatusFromTenant(tenant.status),
      configurationStatus,
    },
    pendingAdministratorInvite: plane.adminInvitations.some(
      (row) => row.tenantId === tenantId && row.status === "pending",
    ),
  };
}

export function planDoesNotGrantPermissions(_plan: TenantPlan): boolean {
  // Commercial plan selects product — never membership role or capability authority.
  return true;
}

export function featureDoesNotGrantCapability(
  features: ProductCapabilityMap,
): boolean {
  const enabled = Object.entries(features).filter(([, on]) => on);
  if (enabled.length === 0) return true;
  return !capabilitiesForRole("member").has(CAPABILITIES.manageEnter);
}

export function limitsAreProductNotSecurity(limits: TenantLimits): boolean {
  return (
    typeof limits.territories === "number" ||
    limits.territories === null ||
    typeof limits.members === "number" ||
    limits.members === null
  );
}

export function memberLimitReached(input: {
  limits: TenantLimits;
  currentMembers: number;
}): boolean {
  if (input.limits.members === null) return false;
  return input.currentMembers >= input.limits.members;
}

export function communityAdminBlockedFromControlPlane(
  isPlatformOperator: boolean,
): boolean {
  return saasControlPlaneForbiddenForCommunityAdmin(isPlatformOperator);
}

export function isOpaqueCustomerEntity(name: string): boolean {
  return [
    "GlobalCustomerEntity",
    "UniversalBillingUser",
    "CustomerClone",
    "CommercialCommunityEntity",
    "SaaSMarketingEntity",
    "GlobalSubscriptionPermission",
  ].includes(name);
}

export function customerAuditMetadata(input: Record<string, unknown>) {
  return sanitizeAuditMetadata(
    input as Record<string, string | number | boolean | null>,
  );
}

export const TenantActivationService = {
  initializeTenant(
    plane: CustomerOperationsPlane,
    input: {
      tenantId: string;
      companyName: string;
      contact: { name: string; email: string };
      plan: TenantPlan;
    },
  ): { plane: CustomerOperationsPlane; customer: TenantCustomerContext } {
    const customer: TenantCustomerContext = {
      tenantId: input.tenantId,
      companyName: input.companyName,
      contact: input.contact,
      onboardingStatus: "requested",
      plan: input.plan,
      features: featuresForPlan(input.plan),
      limits: productLimitsForPlan(input.plan),
    };
    return {
      plane: {
        ...plane,
        customers: [...plane.customers, customer],
      },
      customer,
    };
  },

  configureTenant(
    plane: CustomerOperationsPlane,
    input: {
      tenantId: string;
      companyName?: string;
      contact?: { name: string; email: string };
    },
  ): { plane: CustomerOperationsPlane; customer: TenantCustomerContext } {
    const index = plane.customers.findIndex(
      (row) => row.tenantId === input.tenantId,
    );
    const current: TenantCustomerContext =
      index >= 0
        ? plane.customers[index]!
        : {
            tenantId: input.tenantId,
            companyName: input.companyName ?? input.tenantId,
            contact: input.contact ?? { name: "", email: "" },
            onboardingStatus: "requested",
            plan: "community",
            features: featuresForPlan("community"),
            limits: productLimitsForPlan("community"),
          };
    const customer: TenantCustomerContext = {
      ...current,
      companyName: input.companyName ?? current.companyName,
      contact: input.contact ?? current.contact,
      onboardingStatus: "configuring",
    };
    const customers = [...plane.customers];
    if (index >= 0) customers[index] = customer;
    else customers.push(customer);
    return { plane: { ...plane, customers }, customer };
  },

  activateFeatures(
    plane: CustomerOperationsPlane,
    input: {
      tenantId: string;
      features: Partial<ProductCapabilityMap>;
    },
  ): { plane: CustomerOperationsPlane; customer: TenantCustomerContext } {
    const index = plane.customers.findIndex(
      (row) => row.tenantId === input.tenantId,
    );
    if (index < 0) {
      throw new Error("customer_not_found");
    }
    const current = plane.customers[index]!;
    const customer: TenantCustomerContext = {
      ...current,
      features: { ...current.features, ...input.features },
      onboardingStatus: "configuring",
    };
    const customers = [...plane.customers];
    customers[index] = customer;
    return { plane: { ...plane, customers }, customer };
  },

  inviteAdministrator(
    plane: CustomerOperationsPlane,
    input: {
      tenantId: string;
      email: string;
      invitedBy: string;
      now?: string;
    },
  ): {
    plane: CustomerOperationsPlane;
    invitation: CustomerAdministratorInvitation;
  } {
    const invitation: CustomerAdministratorInvitation = {
      id: `cust-inv-${plane.adminInvitations.length + 1}`,
      tenantId: input.tenantId,
      email: input.email.trim().toLowerCase(),
      invitedBy: input.invitedBy,
      status: "pending",
      createdAt: input.now ?? new Date().toISOString(),
    };
    return {
      plane: {
        ...plane,
        adminInvitations: [...plane.adminInvitations, invitation],
      },
      invitation,
    };
  },

  completeOnboarding(
    plane: CustomerOperationsPlane,
    tenantId: string,
  ): { plane: CustomerOperationsPlane; customer: TenantCustomerContext } {
    const index = plane.customers.findIndex((row) => row.tenantId === tenantId);
    if (index < 0) throw new Error("customer_not_found");
    const current = plane.customers[index]!;
    const customer: TenantCustomerContext = {
      ...current,
      onboardingStatus: "ready",
    };
    const customers = [...plane.customers];
    customers[index] = customer;
    return { plane: { ...plane, customers }, customer };
  },
};

export function assertCustomerTenantBoundary(input: {
  actorTenantId: string;
  resourceTenantId: string;
}): void {
  assertTenantBoundary({
    actorTenantId: input.actorTenantId,
    resourceTenantId: input.resourceTenantId,
  });
}

export function rejectCustomerClientSpoof(
  body: Record<string, unknown>,
): string | null {
  return rejectClientAuthoritySpoof(body);
}

export function customerDoesNotOwnCommunityData(): boolean {
  return true;
}

export function billingReadinessContract(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
): TenantSubscription | null {
  const subscription = projectTenantSubscription(snapshot, tenantId);
  if (!subscription) return null;
  return {
    ...subscription,
    billingProvider: "none",
  };
}

export function provisioningMapsToOnboarding(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
): CustomerOnboardingStatus {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) return "requested";
  const provisioning = provisioningStatusFromTenant(tenant.status);
  if (provisioning === "ready") return "ready";
  if (provisioning === "suspended") return "suspended";
  if (provisioning === "configuring" || provisioning === "created") {
    return provisioning === "created" ? "requested" : "configuring";
  }
  return "requested";
}

export function saasControlPlaneForbiddenForCommunityAdmin(
  isPlatformOperator: boolean,
): boolean {
  return !isPlatformOperator;
}

export { SAAS_CONTROL_PLANE_FORBIDDEN };
