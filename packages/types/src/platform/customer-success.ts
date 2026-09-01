/**
 * Customer Success & tenant operations — continuous SaaS operations projection.
 * Does not create GlobalCustomerSuccessEntity, CommunityEngagementScore,
 * UserRanking, ResidentActivityScore, PlatformSocialAnalytics,
 * CrossTenantSupportAccess, or CustomerContentMirror.
 * Never branches on a customer slug.
 */

import { sanitizeAuditMetadata } from "../domain/admin-audit-log";
import { SAAS_CONTROL_PLANE_FORBIDDEN } from "../domain/admin-operations";
import { assertTenantBoundary } from "./security-context";
import { rejectClientAuthoritySpoof } from "../tenant/factory";
import type { TenantFactorySnapshot, TenantPlan } from "../tenant/factory";
import type { ProductCapabilityMap } from "./tenant-contract";
import {
  lifecycleStatusFromTenant,
} from "./tenant-lifecycle";
import {
  projectTenantSubscription,
  type TenantSubscription,
} from "./operations";
import type {
  CustomerOperationsPlane,
  TenantCustomerContext,
} from "./customer-context";
import { projectTenantCustomerContext } from "./customer-context";

export const CUSTOMER_SUCCESS_HEALTH_STATUSES = [
  "healthy",
  "attention_required",
  "blocked",
  "critical",
] as const;

export type CustomerSuccessHealthStatus =
  (typeof CUSTOMER_SUCCESS_HEALTH_STATUSES)[number];

/** Operational SaaS health — not social engagement or user activity. */
export type CustomerSuccessTenantHealth = {
  tenantId: string;
  status: CustomerSuccessHealthStatus;
  configurationIssues: string[];
  systemIssues: string[];
  operationalIssues: string[];
};

export const ONBOARDING_CHECKLIST_KEYS = [
  "tenant_created",
  "territory_configured",
  "branding_configured",
  "features_active",
  "administrator_invited",
  "locations_available",
  "first_content_operational",
  "community_ready",
] as const;

export type OnboardingChecklistKey = (typeof ONBOARDING_CHECKLIST_KEYS)[number];

export type OnboardingChecklistItemStatus =
  | "pending"
  | "in_progress"
  | "completed";

export type TenantOnboardingChecklistItem = {
  key: OnboardingChecklistKey;
  label: string;
  status: OnboardingChecklistItemStatus;
};

export type TenantOnboardingChecklist = {
  tenantId: string;
  items: TenantOnboardingChecklistItem[];
  overallStatus: OnboardingChecklistItemStatus;
  completedCount: number;
  totalCount: number;
};

export const OPERATIONAL_ALERT_TYPES = [
  "configuration_missing",
  "backup_issue",
  "feature_misconfiguration",
  "security_warning",
  "integration_failure",
] as const;

export type TenantOperationalAlertType =
  (typeof OPERATIONAL_ALERT_TYPES)[number];

export type TenantOperationalAlert = {
  id: string;
  tenantId: string;
  type: TenantOperationalAlertType;
  summary: string;
  status: "open" | "resolved";
  createdAt: string;
  resolvedAt?: string;
};

export const SUPPORT_NOTE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
] as const;

export type CustomerSupportNoteStatus =
  (typeof SUPPORT_NOTE_STATUSES)[number];

export type CustomerSupportNote = {
  id: string;
  tenantId: string;
  summary: string;
  status: CustomerSupportNoteStatus;
  createdBy: string;
  createdAt: string;
  resolvedAt?: string;
};

export type CustomerSupportContext = {
  tenantId: string;
  status: "none" | "attention" | "active_incidents";
  openIncidents: number;
  notes: CustomerSupportNote[];
};

export const SUBSCRIPTION_HEALTH_STATUSES = [
  "trial",
  "active",
  "attention",
  "expired",
] as const;

export type SubscriptionHealthStatus =
  (typeof SUBSCRIPTION_HEALTH_STATUSES)[number];

export type SubscriptionHealth = {
  tenantId: string;
  plan: TenantPlan;
  status: SubscriptionHealthStatus;
  billingProvider: "none";
};

export type CustomerSuccessContext = {
  tenantId: string;
  lifecycleStatus: string;
  onboardingProgress: TenantOnboardingChecklist;
  configurationHealth: "complete" | "incomplete";
  supportStatus: CustomerSupportContext["status"];
  operationalAlerts: TenantOperationalAlert[];
  health: CustomerSuccessTenantHealth;
  subscriptionHealth: SubscriptionHealth | null;
};

export type CustomerSuccessPlane = {
  supportNotes: CustomerSupportNote[];
  alerts: TenantOperationalAlert[];
  checklist: Record<
    string,
    Partial<Record<OnboardingChecklistKey, OnboardingChecklistItemStatus>>
  >;
};

const CHECKLIST_LABELS: Record<OnboardingChecklistKey, string> = {
  tenant_created: "Tenant creado",
  territory_configured: "Territory configurado",
  branding_configured: "Branding configurado",
  features_active: "Features activas",
  administrator_invited: "Administrador invitado",
  locations_available: "Locations disponibles",
  first_content_operational: "Primer contenido operativo",
  community_ready: "Comunidad preparada",
};

export function emptyCustomerSuccessPlane(): CustomerSuccessPlane {
  return { supportNotes: [], alerts: [], checklist: {} };
}

export function isOpaqueCustomerSuccessEntity(name: string): boolean {
  return [
    "GlobalCustomerSuccessEntity",
    "CommunityEngagementScore",
    "UserRanking",
    "ResidentActivityScore",
    "PlatformSocialAnalytics",
    "CrossTenantSupportAccess",
    "CustomerContentMirror",
    "EngagementScore",
    "CommunityScore",
    "ResidentScore",
  ].includes(name);
}

export function successDoesNotMeasureEngagement(): boolean {
  return true;
}

export function personalDataExcludedFromSuccess(): boolean {
  return true;
}

export function subscriptionHealthFromContract(
  subscription: TenantSubscription | null,
): SubscriptionHealth | null {
  if (!subscription) return null;
  let status: SubscriptionHealthStatus = "active";
  if (subscription.subscriptionStatus === "trial") status = "trial";
  else if (subscription.subscriptionStatus === "past_due") status = "attention";
  else if (subscription.subscriptionStatus === "cancelled") status = "expired";
  return {
    tenantId: subscription.tenantId,
    plan: subscription.plan,
    status,
    billingProvider: "none",
  };
}

function brandingConfigured(
  snapshot: TenantFactorySnapshot,
  tenantId: string,
): boolean {
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  if (!tenant) return false;
  return Boolean(
    tenant.branding.name?.trim() &&
      (tenant.branding.primaryColor?.trim() || tenant.branding.shortName?.trim()),
  );
}

function featuresActive(features: ProductCapabilityMap): boolean {
  return Object.values(features).some(Boolean);
}

export function buildOnboardingChecklist(input: {
  snapshot: TenantFactorySnapshot;
  customerPlane: CustomerOperationsPlane;
  successPlane: CustomerSuccessPlane;
  tenantId: string;
  customer: TenantCustomerContext;
}): TenantOnboardingChecklist {
  const { snapshot, customerPlane, successPlane, tenantId, customer } = input;
  const overrides = successPlane.checklist[tenantId] ?? {};
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  const territories = snapshot.territories.filter(
    (row) => row.tenantId === tenantId,
  );
  const hasAdminInvite = customerPlane.adminInvitations.some(
    (row) => row.tenantId === tenantId,
  );

  function statusFor(
    key: OnboardingChecklistKey,
    inferred: OnboardingChecklistItemStatus,
  ): OnboardingChecklistItemStatus {
    return overrides[key] ?? inferred;
  }

  const items: TenantOnboardingChecklistItem[] = [
    {
      key: "tenant_created",
      label: CHECKLIST_LABELS.tenant_created,
      status: statusFor("tenant_created", tenant ? "completed" : "pending"),
    },
    {
      key: "territory_configured",
      label: CHECKLIST_LABELS.territory_configured,
      status: statusFor(
        "territory_configured",
        territories.length > 0 ? "completed" : "pending",
      ),
    },
    {
      key: "branding_configured",
      label: CHECKLIST_LABELS.branding_configured,
      status: statusFor(
        "branding_configured",
        brandingConfigured(snapshot, tenantId)
          ? "completed"
          : territories.length > 0
            ? "in_progress"
            : "pending",
      ),
    },
    {
      key: "features_active",
      label: CHECKLIST_LABELS.features_active,
      status: statusFor(
        "features_active",
        featuresActive(customer.features) ? "completed" : "in_progress",
      ),
    },
    {
      key: "administrator_invited",
      label: CHECKLIST_LABELS.administrator_invited,
      status: statusFor(
        "administrator_invited",
        hasAdminInvite ? "completed" : "pending",
      ),
    },
    {
      key: "locations_available",
      label: CHECKLIST_LABELS.locations_available,
      status: statusFor(
        "locations_available",
        overrides.locations_available ??
          (customer.onboardingStatus === "ready"
            ? "completed"
            : territories.length > 0
              ? "in_progress"
              : "pending"),
      ),
    },
    {
      key: "first_content_operational",
      label: CHECKLIST_LABELS.first_content_operational,
      status: statusFor(
        "first_content_operational",
        overrides.first_content_operational ??
          (customer.onboardingStatus === "ready" ? "completed" : "pending"),
      ),
    },
    {
      key: "community_ready",
      label: CHECKLIST_LABELS.community_ready,
      status: statusFor(
        "community_ready",
        customer.onboardingStatus === "ready" ? "completed" : "in_progress",
      ),
    },
  ];

  const completedCount = items.filter((row) => row.status === "completed").length;
  let overallStatus: OnboardingChecklistItemStatus = "pending";
  if (completedCount === items.length) overallStatus = "completed";
  else if (completedCount > 0) overallStatus = "in_progress";

  return {
    tenantId,
    items,
    overallStatus,
    completedCount,
    totalCount: items.length,
  };
}

export function resolveOperationalAlerts(input: {
  successPlane: CustomerSuccessPlane;
  tenantId: string;
  snapshot: TenantFactorySnapshot;
  customerPlane: CustomerOperationsPlane;
  customer: TenantCustomerContext;
}): TenantOperationalAlert[] {
  const { successPlane, tenantId, snapshot, customerPlane, customer } = input;
  const stored = successPlane.alerts.filter((row) => row.tenantId === tenantId);
  const generated: TenantOperationalAlert[] = [];
  const now = new Date().toISOString();

  if (!brandingConfigured(snapshot, tenantId)) {
    generated.push({
      id: `auto-branding-${tenantId}`,
      tenantId,
      type: "configuration_missing",
      summary: "Falta configurar branding",
      status: "open",
      createdAt: now,
    });
  }
  if (
    !customerPlane.adminInvitations.some(
      (row) => row.tenantId === tenantId && row.status === "pending",
    ) &&
    !customerPlane.adminInvitations.some(
      (row) => row.tenantId === tenantId && row.status === "accepted",
    )
  ) {
    generated.push({
      id: `auto-admin-${tenantId}`,
      tenantId,
      type: "configuration_missing",
      summary: "Administrador pendiente",
      status: "open",
      createdAt: now,
    });
  }

  const merged = [...stored];
  for (const alert of generated) {
    if (
      !merged.some(
        (row) =>
          row.type === alert.type &&
          row.summary === alert.summary &&
          row.status === "open",
      )
    ) {
      merged.push(alert);
    }
  }
  return merged.filter((row) => row.status === "open");
}

export function resolveCustomerHealth(input: {
  snapshot: TenantFactorySnapshot;
  customerPlane: CustomerOperationsPlane;
  successPlane: CustomerSuccessPlane;
  tenantId: string;
  customer: TenantCustomerContext;
}): CustomerSuccessTenantHealth {
  const { snapshot, customerPlane, successPlane, tenantId, customer } = input;
  const tenant = snapshot.tenants.find((row) => row.id === tenantId);
  const configurationIssues: string[] = [];
  const systemIssues: string[] = [];
  const operationalIssues: string[] = [];

  if (!brandingConfigured(snapshot, tenantId)) {
    configurationIssues.push("branding_pending");
  }
  if (
    snapshot.territories.filter((row) => row.tenantId === tenantId).length === 0
  ) {
    configurationIssues.push("territory_incomplete");
  }
  if (
    !customerPlane.adminInvitations.some((row) => row.tenantId === tenantId)
  ) {
    configurationIssues.push("administrator_pending");
  }

  const openAlerts = resolveOperationalAlerts({
    successPlane,
    tenantId,
    snapshot,
    customerPlane,
    customer,
  });
  for (const alert of openAlerts) {
    if (alert.type === "backup_issue" || alert.type === "integration_failure") {
      systemIssues.push(alert.summary);
    } else if (alert.type === "security_warning") {
      operationalIssues.push(alert.summary);
    } else if (alert.type === "feature_misconfiguration") {
      configurationIssues.push(alert.summary);
    }
  }

  if (tenant?.status === "suspended") {
    operationalIssues.push("tenant_suspended");
  }

  let status: CustomerSuccessHealthStatus = "healthy";
  if (tenant?.status === "suspended" || tenant?.status === "deleted") {
    status = "blocked";
  } else if (
    systemIssues.length > 0 ||
    openAlerts.some((row) => row.type === "security_warning")
  ) {
    status = "critical";
  } else if (
    configurationIssues.length > 0 ||
    operationalIssues.length > 0 ||
    openAlerts.length > 0
  ) {
    status = "attention_required";
  }

  return {
    tenantId,
    status,
    configurationIssues,
    systemIssues,
    operationalIssues,
  };
}

export function projectCustomerSupportContext(
  successPlane: CustomerSuccessPlane,
  tenantId: string,
): CustomerSupportContext {
  const notes = successPlane.supportNotes.filter(
    (row) => row.tenantId === tenantId,
  );
  const openIncidents = notes.filter((row) => row.status !== "resolved").length;
  let status: CustomerSupportContext["status"] = "none";
  if (openIncidents > 0) status = "active_incidents";
  else if (
    successPlane.alerts.some(
      (row) => row.tenantId === tenantId && row.status === "open",
    )
  ) {
    status = "attention";
  }
  return { tenantId, status, openIncidents, notes };
}

export function projectCustomerSuccessContext(
  snapshot: TenantFactorySnapshot,
  customerPlane: CustomerOperationsPlane,
  successPlane: CustomerSuccessPlane,
  tenantId: string,
): CustomerSuccessContext | null {
  const customer = projectTenantCustomerContext(snapshot, customerPlane, tenantId);
  if (!customer) return null;
  const tenant = snapshot.tenants.find((row) => row.id === tenantId)!;
  const onboardingProgress = buildOnboardingChecklist({
    snapshot,
    customerPlane,
    successPlane,
    tenantId,
    customer,
  });
  const health = resolveCustomerHealth({
    snapshot,
    customerPlane,
    successPlane,
    tenantId,
    customer,
  });
  const operationalAlerts = resolveOperationalAlerts({
    successPlane,
    tenantId,
    snapshot,
    customerPlane,
    customer,
  });
  const support = projectCustomerSupportContext(successPlane, tenantId);
  const subscription = projectTenantSubscription(snapshot, tenantId);
  const configurationHealth =
    onboardingProgress.completedCount >= 5 ? "complete" : "incomplete";

  return {
    tenantId,
    lifecycleStatus: lifecycleStatusFromTenant(tenant.status),
    onboardingProgress,
    configurationHealth,
    supportStatus: support.status,
    operationalAlerts,
    health,
    subscriptionHealth: subscriptionHealthFromContract(subscription),
  };
}

export function communityAdminBlockedFromCustomerSuccess(
  isPlatformOperator: boolean,
): boolean {
  return !isPlatformOperator;
}

export function rejectCustomerSuccessClientSpoof(
  body: Record<string, unknown>,
): string | null {
  return rejectClientAuthoritySpoof(body);
}

export function assertCustomerSuccessTenantBoundary(input: {
  actorTenantId: string;
  resourceTenantId: string;
}): void {
  assertTenantBoundary({
    actorTenantId: input.actorTenantId,
    resourceTenantId: input.resourceTenantId,
  });
}

export function customerSuccessAuditMetadata(input: Record<string, unknown>) {
  return sanitizeAuditMetadata(
    input as Record<string, string | number | boolean | null>,
  );
}

export const CustomerSuccessService = {
  completeChecklistItem(
    plane: CustomerSuccessPlane,
    input: {
      tenantId: string;
      key: OnboardingChecklistKey;
      status?: OnboardingChecklistItemStatus;
    },
  ): CustomerSuccessPlane {
    const tenantChecklist = { ...(plane.checklist[input.tenantId] ?? {}) };
    tenantChecklist[input.key] = input.status ?? "completed";
    return {
      ...plane,
      checklist: {
        ...plane.checklist,
        [input.tenantId]: tenantChecklist,
      },
    };
  },

  createSupportNote(
    plane: CustomerSuccessPlane,
    input: {
      tenantId: string;
      summary: string;
      createdBy: string;
      now?: string;
    },
  ): { plane: CustomerSuccessPlane; note: CustomerSupportNote } {
    const note: CustomerSupportNote = {
      id: `support-${plane.supportNotes.length + 1}`,
      tenantId: input.tenantId,
      summary: input.summary.trim(),
      status: "open",
      createdBy: input.createdBy,
      createdAt: input.now ?? new Date().toISOString(),
    };
    return {
      plane: { ...plane, supportNotes: [...plane.supportNotes, note] },
      note,
    };
  },

  createAlert(
    plane: CustomerSuccessPlane,
    input: {
      tenantId: string;
      type: TenantOperationalAlertType;
      summary: string;
      now?: string;
    },
  ): { plane: CustomerSuccessPlane; alert: TenantOperationalAlert } {
    const alert: TenantOperationalAlert = {
      id: `alert-${plane.alerts.length + 1}`,
      tenantId: input.tenantId,
      type: input.type,
      summary: input.summary.trim(),
      status: "open",
      createdAt: input.now ?? new Date().toISOString(),
    };
    return {
      plane: { ...plane, alerts: [...plane.alerts, alert] },
      alert,
    };
  },

  resolveAlert(
    plane: CustomerSuccessPlane,
    input: { alertId: string; now?: string },
  ): CustomerSuccessPlane {
    const alerts = plane.alerts.map((row) =>
      row.id === input.alertId
        ? {
            ...row,
            status: "resolved" as const,
            resolvedAt: input.now ?? new Date().toISOString(),
          }
        : row,
    );
    return { ...plane, alerts };
  },
};

export function saasControlPlaneForbiddenMessage(): string {
  return SAAS_CONTROL_PLANE_FORBIDDEN;
}
