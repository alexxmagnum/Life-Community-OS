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
  type TerritoryProvisionInput,
} from "@life-community-os/types";

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
    requirePlatformOperator(input.actor);
    const spoofed = rejectClientAuthoritySpoof(input.spoof);
    if (spoofed) throw new TenantFactoryDeniedError("forbidden");
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
    return provisioned.result;
  },

  addTerritory(input: {
    actor: RequestActor;
    territory: TerritoryProvisionInput;
    spoof?: ClientAuthoritySpoof | null;
  }) {
    requirePlatformOperator(input.actor);
    const spoofed = rejectClientAuthoritySpoof(input.spoof);
    if (spoofed) throw new TenantFactoryDeniedError("forbidden");
    const next = TenantFactoryService.addTerritory(snapshot, input.territory);
    snapshot = next.snapshot;
    return next.territory;
  },
};
