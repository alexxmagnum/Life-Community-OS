/**
 * Tenant Lifecycle runtime — SaaS status, contract and limits.
 * Does not mutate community users, messages, or domain content.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  TenantLifecycleService,
  canAccessPlatformAdmin,
  lifecycleStatusFromTenant,
  projectTenantLifecycleContext,
  projectTenantSaaSContract,
  rejectClientAuthoritySpoof,
  tenantLifecycleBlocksAuth,
  tenantLifecycleBlocksMutations,
  type ClientAuthoritySpoof,
  type TenantLimits,
  type TenantPlan,
} from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import {
  recordInvalidPermission,
  recordPlatformAudit,
  recordSpoofSecurityEvent,
} from "@/lib/platform/platform-operations-store";

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
      action: "security.permission.changed",
    });
    throw new TenantFactoryDeniedError(SAAS_CONTROL_PLANE_FORBIDDEN);
  }
  return actor.personId;
}

function rejectSpoof(
  personId: string,
  tenantId: string,
  spoof?: ClientAuthoritySpoof | null,
): void {
  const spoofed = rejectClientAuthoritySpoof(spoof);
  if (spoofed) {
    recordSpoofSecurityEvent({
      field: spoofed,
      actorPersonId: personId,
      tenantId,
    });
    throw new TenantFactoryDeniedError(SAAS_CONTROL_PLANE_FORBIDDEN);
  }
}

function apply(
  next: ReturnType<typeof TenantFactoryRuntime.snapshot>,
): void {
  TenantFactoryRuntime.replaceSnapshot(next);
}

export function communityTenantBlocksAuth(tenantSlug: string): boolean {
  const tenant = TenantFactoryRuntime.list().find(
    (row) => row.slug === tenantSlug || row.id === tenantSlug,
  );
  if (!tenant) return false;
  return tenantLifecycleBlocksAuth(lifecycleStatusFromTenant(tenant.status));
}

export function communityTenantBlocksMutations(tenantSlug: string): boolean {
  const tenant = TenantFactoryRuntime.list().find(
    (row) => row.slug === tenantSlug || row.id === tenantSlug,
  );
  if (!tenant) return false;
  return tenantLifecycleBlocksMutations(
    lifecycleStatusFromTenant(tenant.status),
  );
}

export const TenantLifecycleRuntime = {
  context(tenantId: string) {
    return projectTenantLifecycleContext(
      TenantFactoryRuntime.snapshot(),
      tenantId,
    );
  },

  list() {
    return TenantFactoryRuntime.list().flatMap((row) => {
      const ctx = projectTenantLifecycleContext(
        TenantFactoryRuntime.snapshot(),
        row.id,
      );
      return ctx ? [ctx] : [];
    });
  },

  contracts() {
    return TenantFactoryRuntime.list().flatMap((row) => {
      const contract = projectTenantSaaSContract(
        TenantFactoryRuntime.snapshot(),
        row.id,
      );
      return contract ? [contract] : [];
    });
  },

  activate(input: {
    actor: RequestActor;
    tenantId: string;
    spoof?: ClientAuthoritySpoof | null;
    reason?: string;
  }) {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    apply(
      TenantLifecycleService.activateTenant(
        TenantFactoryRuntime.snapshot(),
        input.tenantId,
      ),
    );
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.tenant.activated",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: input.reason ? { reason: input.reason } : undefined,
    });
    return projectTenantLifecycleContext(
      TenantFactoryRuntime.snapshot(),
      input.tenantId,
    );
  },

  suspend(input: {
    actor: RequestActor;
    tenantId: string;
    spoof?: ClientAuthoritySpoof | null;
    reason?: string;
  }) {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    apply(
      TenantLifecycleService.suspendTenant(
        TenantFactoryRuntime.snapshot(),
        input.tenantId,
      ),
    );
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.tenant.suspended",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { reason: input.reason ?? "suspended" },
    });
    return projectTenantLifecycleContext(
      TenantFactoryRuntime.snapshot(),
      input.tenantId,
    );
  },

  restore(input: {
    actor: RequestActor;
    tenantId: string;
    spoof?: ClientAuthoritySpoof | null;
    reason?: string;
  }) {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    apply(
      TenantLifecycleService.restoreTenant(
        TenantFactoryRuntime.snapshot(),
        input.tenantId,
      ),
    );
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.tenant.restored",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: input.reason ? { reason: input.reason } : undefined,
    });
    return projectTenantLifecycleContext(
      TenantFactoryRuntime.snapshot(),
      input.tenantId,
    );
  },

  archive(input: {
    actor: RequestActor;
    tenantId: string;
    spoof?: ClientAuthoritySpoof | null;
    reason?: string;
  }) {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    apply(
      TenantLifecycleService.archiveTenant(
        TenantFactoryRuntime.snapshot(),
        input.tenantId,
      ),
    );
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.tenant.archived",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: input.reason ? { reason: input.reason } : undefined,
    });
    return projectTenantLifecycleContext(
      TenantFactoryRuntime.snapshot(),
      input.tenantId,
    );
  },

  setLimits(input: {
    actor: RequestActor;
    tenantId: string;
    limits: TenantLimits;
    spoof?: ClientAuthoritySpoof | null;
  }) {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    apply(
      TenantLifecycleService.setLimits(
        TenantFactoryRuntime.snapshot(),
        input.tenantId,
        input.limits,
      ),
    );
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.limit.changed",
      entityType: "tenant",
      entityId: input.tenantId,
    });
    return projectTenantSaaSContract(
      TenantFactoryRuntime.snapshot(),
      input.tenantId,
    );
  },

  setPlan(input: {
    actor: RequestActor;
    tenantId: string;
    plan: TenantPlan;
    spoof?: ClientAuthoritySpoof | null;
  }) {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    apply(
      TenantLifecycleService.setPlan(
        TenantFactoryRuntime.snapshot(),
        input.tenantId,
        input.plan,
      ),
    );
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.contract.changed",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { plan: input.plan },
    });
    return projectTenantSaaSContract(
      TenantFactoryRuntime.snapshot(),
      input.tenantId,
    );
  },
};
