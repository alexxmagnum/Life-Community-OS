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
};
