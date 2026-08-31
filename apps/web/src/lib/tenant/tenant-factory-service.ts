/**
 * Tenant Factory runtime — persists provisioned SaaS customers.
 * Does not write pack files or community content.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  TenantFactoryService,
  canAccessPlatformAdmin,
  emptyTenantFactorySnapshot,
  rejectClientAuthoritySpoof,
  type ClientAuthoritySpoof,
  type PlatformOperator,
  type TenantFactorySnapshot,
  type TenantPlan,
  type TenantProvisionRequest,
  type TenantProvisionResult,
  type TenantStatus,
  type TerritoryProvisionInput,
} from "@life-community-os/types";
import {
  recordPlatformAudit,
  recordSpoofSecurityEvent,
  replacePlatformOperationsStoreForTests,
} from "@/lib/platform/platform-operations-store";

export class TenantFactoryDeniedError extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "TenantFactoryDeniedError";
  }
}

let snapshot = emptyTenantFactorySnapshot();

export function replaceTenantFactoryStoreForTests(
  next: TenantFactorySnapshot = emptyTenantFactorySnapshot(),
): void {
  snapshot = next;
  replacePlatformOperationsStoreForTests();
}

export function listPlatformOperators(): PlatformOperator[] {
  return [...snapshot.operators];
}

export function replacePlatformOperatorsForTests(
  operators: PlatformOperator[],
): void {
  snapshot = { ...snapshot, operators: [...operators] };
}

function requirePlatformOperator(actor: RequestActor): string {
  if (!actor.authenticated || !actor.personId) {
    throw new TenantFactoryDeniedError("unauthorized");
  }
  if (
    !canAccessPlatformAdmin({
      personId: actor.personId,
      operators: snapshot.operators,
    })
  ) {
    throw new TenantFactoryDeniedError("forbidden");
  }
  return actor.personId;
}

export const TenantFactoryRuntime = {
  snapshot(): TenantFactorySnapshot {
    return snapshot;
  },

  assertOperator(actor: RequestActor): string {
    return requirePlatformOperator(actor);
  },

  list() {
    return snapshot.tenants;
  },

  configuration(tenantId: string) {
    return TenantFactoryService.configurationContext(snapshot, tenantId);
  },

  provision(input: {
    actor: RequestActor;
    request: TenantProvisionRequest;
    spoof?: ClientAuthoritySpoof | null;
    plan?: TenantPlan;
    administratorPersonId?: string;
  }): TenantProvisionResult {
    const personId = requirePlatformOperator(input.actor);
    const spoofed = rejectClientAuthoritySpoof(input.spoof);
    if (spoofed) {
      recordSpoofSecurityEvent({
        field: spoofed,
        actorPersonId: personId,
      });
      throw new TenantFactoryDeniedError("forbidden");
    }
    const provisioned = TenantFactoryService.provision(
      snapshot,
      input.request,
      { plan: input.plan ?? "community" },
    );
    snapshot = provisioned.snapshot;
    if (input.administratorPersonId?.trim()) {
      snapshot = TenantFactoryService.seedAdministrator(snapshot, {
        tenantId: provisioned.result.tenantId,
        personId: input.administratorPersonId,
      });
    }
    recordPlatformAudit({
      tenantId: provisioned.result.tenantId,
      territoryId: provisioned.result.territories[0]?.id,
      actorPersonId: personId,
      action: "platform.tenant.created",
      entityType: "tenant",
      entityId: provisioned.result.tenantId,
      metadata: { slug: input.request.slug },
    });
    return provisioned.result;
  },

  addTerritory(input: {
    actor: RequestActor;
    territory: TerritoryProvisionInput;
    spoof?: ClientAuthoritySpoof | null;
  }) {
    const personId = requirePlatformOperator(input.actor);
    const spoofed = rejectClientAuthoritySpoof(input.spoof);
    if (spoofed) {
      recordSpoofSecurityEvent({
        field: spoofed,
        actorPersonId: personId,
        tenantId: input.territory.tenantId,
      });
      throw new TenantFactoryDeniedError("forbidden");
    }
    const next = TenantFactoryService.addTerritory(snapshot, input.territory);
    snapshot = next.snapshot;
    recordPlatformAudit({
      tenantId: next.territory.tenantId,
      territoryId: next.territory.id,
      actorPersonId: personId,
      action: "platform.territory.created",
      entityType: "territory",
      entityId: next.territory.id,
      metadata: { slug: next.territory.slug },
    });
    return next.territory;
  },

  setStatus(input: {
    actor: RequestActor;
    tenantId: string;
    status: TenantStatus;
    spoof?: ClientAuthoritySpoof | null;
  }) {
    const personId = requirePlatformOperator(input.actor);
    const spoofed = rejectClientAuthoritySpoof(input.spoof);
    if (spoofed) {
      recordSpoofSecurityEvent({
        field: spoofed,
        actorPersonId: personId,
        tenantId: input.tenantId,
      });
      throw new TenantFactoryDeniedError("forbidden");
    }
    snapshot = TenantFactoryService.setStatus(
      snapshot,
      input.tenantId,
      input.status,
    );
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.admin.action",
      entityType: "tenant",
      entityId: input.tenantId,
      metadata: { status: input.status },
    });
    return snapshot.tenants.find((row) => row.id === input.tenantId) ?? null;
  },
};
