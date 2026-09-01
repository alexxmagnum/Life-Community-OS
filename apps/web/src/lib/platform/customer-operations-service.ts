/**
 * Commercial SaaS customer operations runtime.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  TenantActivationService,
  canAccessPlatformAdmin,
  emptyCustomerOperationsPlane,
  projectCustomerOperationsContext,
  rejectCustomerClientSpoof,
  type CustomerOperationsPlane,
  type ProductCapabilityMap,
  type TenantPlan,
  CustomerSuccessService,
  emptyCustomerSuccessPlane,
  projectCustomerSuccessContext,
  rejectCustomerSuccessClientSpoof,
  type CustomerSuccessPlane,
  type OnboardingChecklistKey,
  type TenantOperationalAlertType,
} from "@life-community-os/types";
import {
  recordInvalidPermission,
  recordPlatformAudit,
} from "@/lib/platform/platform-operations-store";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";

let plane: CustomerOperationsPlane = emptyCustomerOperationsPlane();
let successPlane: CustomerSuccessPlane = emptyCustomerSuccessPlane();

function requireOperator(actor: RequestActor): string {
  if (!actor.authenticated || !actor.personId) {
    throw new TenantFactoryDeniedError("unauthorized");
  }
  if (
    !canAccessPlatformAdmin({
      personId: actor.personId,
      operators: TenantFactoryRuntime.snapshot().operators,
    })
  ) {
    recordInvalidPermission({
      tenantId: actor.tenantSlug,
      actorPersonId: actor.personId,
      action: "security.permission.denied",
    });
    throw new TenantFactoryDeniedError(SAAS_CONTROL_PLANE_FORBIDDEN);
  }
  return actor.personId;
}

export function replaceCustomerOperationsStoreForTests(
  next: CustomerOperationsPlane = emptyCustomerOperationsPlane(),
): void {
  plane = next;
}

export function replaceCustomerSuccessStoreForTests(
  next: CustomerSuccessPlane = emptyCustomerSuccessPlane(),
): void {
  successPlane = next;
}

export function customerSuccessSnapshot(): CustomerSuccessPlane {
  return successPlane;
}

export function customerOperationsSnapshot(): CustomerOperationsPlane {
  return plane;
}

export const CustomerOperationsRuntime = {
  list(actor: RequestActor) {
    requireOperator(actor);
    const snapshot = TenantFactoryRuntime.snapshot();
    return snapshot.tenants
      .map((tenant) =>
        projectCustomerOperationsContext(snapshot, plane, tenant.id),
      )
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  },

  get(actor: RequestActor, tenantId: string) {
    requireOperator(actor);
    return projectCustomerOperationsContext(
      TenantFactoryRuntime.snapshot(),
      plane,
      tenantId,
    );
  },

  initialize(input: {
    actor: RequestActor;
    tenantId: string;
    companyName: string;
    contact: { name: string; email: string };
    plan: TenantPlan;
    body?: Record<string, unknown>;
  }) {
    const personId = requireOperator(input.actor);
    if (input.body) {
      const spoof = rejectCustomerClientSpoof(input.body);
      if (spoof) throw new TenantFactoryDeniedError("owner_immutable");
    }
    const result = TenantActivationService.initializeTenant(plane, {
      tenantId: input.tenantId,
      companyName: input.companyName,
      contact: input.contact,
      plan: input.plan,
    });
    plane = result.plane;
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.customer.created",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { plan: input.plan },
    });
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.customer.onboarding.started",
      entityType: "tenant",
      entityId: input.tenantId,
    });
    return result.customer;
  },

  configure(input: {
    actor: RequestActor;
    tenantId: string;
    companyName?: string;
    contact?: { name: string; email: string };
    body?: Record<string, unknown>;
  }) {
    requireOperator(input.actor);
    if (input.body) {
      const spoof = rejectCustomerClientSpoof(input.body);
      if (spoof) throw new TenantFactoryDeniedError("owner_immutable");
    }
    const result = TenantActivationService.configureTenant(plane, {
      tenantId: input.tenantId,
      companyName: input.companyName,
      contact: input.contact,
    });
    plane = result.plane;
    return result.customer;
  },

  activateFeatures(input: {
    actor: RequestActor;
    tenantId: string;
    features: Partial<ProductCapabilityMap>;
    body?: Record<string, unknown>;
  }) {
    requireOperator(input.actor);
    if (input.body) {
      const spoof = rejectCustomerClientSpoof(input.body);
      if (spoof) throw new TenantFactoryDeniedError("owner_immutable");
    }
    const result = TenantActivationService.activateFeatures(plane, {
      tenantId: input.tenantId,
      features: input.features,
    });
    plane = result.plane;
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: input.actor.personId ?? "platform",
      action: "platform.features.updated",
      entityType: "tenant",
      entityId: input.tenantId,
    });
    return result.customer;
  },

  inviteAdministrator(input: {
    actor: RequestActor;
    tenantId: string;
    email: string;
  }) {
    const personId = requireOperator(input.actor);
    const result = TenantActivationService.inviteAdministrator(plane, {
      tenantId: input.tenantId,
      email: input.email,
      invitedBy: personId,
    });
    plane = result.plane;
    return result.invitation;
  },

  completeOnboarding(input: { actor: RequestActor; tenantId: string }) {
    const personId = requireOperator(input.actor);
    const result = TenantActivationService.completeOnboarding(
      plane,
      input.tenantId,
    );
    plane = result.plane;
    TenantFactoryRuntime.setFeatures({
      actor: input.actor,
      tenantId: input.tenantId,
      features: result.customer.features,
    });
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.customer.ready",
      entityType: "tenant",
      entityId: input.tenantId,
    });
    return result.customer;
  },

  setPlan(input: {
    actor: RequestActor;
    tenantId: string;
    plan: TenantPlan;
    body?: Record<string, unknown>;
  }) {
    requireOperator(input.actor);
    if (input.body) {
      const spoof = rejectCustomerClientSpoof(input.body);
      if (spoof) throw new TenantFactoryDeniedError("owner_immutable");
    }
    const index = plane.customers.findIndex(
      (row) => row.tenantId === input.tenantId,
    );
    if (index >= 0) {
      const customers = [...plane.customers];
      customers[index] = { ...customers[index]!, plan: input.plan };
      plane = { ...plane, customers };
    }
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: input.actor.personId ?? "platform",
      action: "platform.plan.changed",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { plan: input.plan },
    });
    return this.get(input.actor, input.tenantId);
  },

  resolveCustomerHealth(actor: RequestActor, tenantId: string) {
    const personId = requireOperator(actor);
    const snapshot = TenantFactoryRuntime.snapshot();
    const customer = projectCustomerOperationsContext(snapshot, plane, tenantId);
    if (!customer) return null;
    recordPlatformAudit({
      tenantId,
      actorPersonId: personId,
      action: "platform.customer.health.viewed",
      entityType: "tenant",
      entityId: tenantId,
    });
    return projectCustomerSuccessContext(snapshot, plane, successPlane, tenantId);
  },

  getOnboardingStatus(actor: RequestActor, tenantId: string) {
    requireOperator(actor);
    const snapshot = TenantFactoryRuntime.snapshot();
    const ctx = projectCustomerSuccessContext(snapshot, plane, successPlane, tenantId);
    return ctx?.onboardingProgress ?? null;
  },

  createSupportNote(input: {
    actor: RequestActor;
    tenantId: string;
    summary: string;
    body?: Record<string, unknown>;
  }) {
    const personId = requireOperator(input.actor);
    if (input.body) {
      const spoof = rejectCustomerSuccessClientSpoof(input.body);
      if (spoof) throw new TenantFactoryDeniedError("owner_immutable");
    }
    const result = CustomerSuccessService.createSupportNote(successPlane, {
      tenantId: input.tenantId,
      summary: input.summary,
      createdBy: personId,
    });
    successPlane = result.plane;
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.customer.support.created",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { summary: input.summary },
    });
    return result.note;
  },

  resolveOperationalAlerts(actor: RequestActor, tenantId: string) {
    requireOperator(actor);
    const snapshot = TenantFactoryRuntime.snapshot();
    const ctx = projectCustomerSuccessContext(snapshot, plane, successPlane, tenantId);
    return ctx?.operationalAlerts ?? [];
  },

  completeChecklist(input: {
    actor: RequestActor;
    tenantId: string;
    key: OnboardingChecklistKey;
    body?: Record<string, unknown>;
  }) {
    const personId = requireOperator(input.actor);
    if (input.body) {
      const spoof = rejectCustomerSuccessClientSpoof(input.body);
      if (spoof) throw new TenantFactoryDeniedError("owner_immutable");
    }
    successPlane = CustomerSuccessService.completeChecklistItem(successPlane, {
      tenantId: input.tenantId,
      key: input.key,
    });
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.customer.onboarding.updated",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { checklistKey: input.key },
    });
    return this.getOnboardingStatus(input.actor, input.tenantId);
  },

  createAlert(input: {
    actor: RequestActor;
    tenantId: string;
    type: TenantOperationalAlertType;
    summary: string;
  }) {
    const personId = requireOperator(input.actor);
    const result = CustomerSuccessService.createAlert(successPlane, {
      tenantId: input.tenantId,
      type: input.type,
      summary: input.summary,
    });
    successPlane = result.plane;
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.customer.alert.created",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { type: input.type },
    });
    return result.alert;
  },

  resolveAlert(input: { actor: RequestActor; alertId: string; tenantId: string }) {
    const personId = requireOperator(input.actor);
    successPlane = CustomerSuccessService.resolveAlert(successPlane, {
      alertId: input.alertId,
    });
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.customer.alert.resolved",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { alertId: input.alertId },
    });
    return this.resolveOperationalAlerts(input.actor, input.tenantId);
  },

  listSuccess(actor: RequestActor) {
    requireOperator(actor);
    const snapshot = TenantFactoryRuntime.snapshot();
    return snapshot.tenants
      .map((tenant) =>
        projectCustomerSuccessContext(snapshot, plane, successPlane, tenant.id),
      )
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  },
};
