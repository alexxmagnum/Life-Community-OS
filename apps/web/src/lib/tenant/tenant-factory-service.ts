/**
 * Tenant Factory runtime — persists provisioned SaaS customers.
 * Does not write pack files or community content.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  TenantFactoryService,
  adoptConfiguredTenant,
  canAccessPlatformAdmin,
  emptyTenantFactorySnapshot,
  rejectClientAuthoritySpoof,
  type ClientAuthoritySpoof,
  type PlatformOperator,
  type ProductCapabilityMap,
  type TenantBrandingSlice,
  type TenantFactorySnapshot,
  type TenantIdentityRecord,
  type TenantPlan,
  type TenantProvisionRequest,
  type TenantProvisionResult,
  type TenantStatus,
  type TerritoryBounds,
  type TerritoryProvisionInput,
} from "@life-community-os/types";
import {
  recordAdminChange,
  recordInvalidPermission,
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
    recordInvalidPermission({
      tenantId: actor.tenantSlug,
      actorPersonId: actor.personId,
      action: "security.permission.changed",
    });
    throw new TenantFactoryDeniedError("saas_control_plane_forbidden");
  }
  return actor.personId;
}

export const TenantFactoryRuntime = {
  snapshot(): TenantFactorySnapshot {
    return snapshot;
  },

  replaceSnapshot(next: TenantFactorySnapshot): void {
    snapshot = next;
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
      throw new TenantFactoryDeniedError("saas_control_plane_forbidden");
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
      throw new TenantFactoryDeniedError("saas_control_plane_forbidden");
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
      throw new TenantFactoryDeniedError("saas_control_plane_forbidden");
    }
    snapshot = TenantFactoryService.setStatus(
      snapshot,
      input.tenantId,
      input.status,
    );
    recordAdminChange({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.admin.action",
    });
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

  setFeatures(input: {
    actor: RequestActor;
    tenantId: string;
    features: Partial<ProductCapabilityMap>;
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
      throw new TenantFactoryDeniedError("saas_control_plane_forbidden");
    }
    snapshot = TenantFactoryService.setFeatures(
      snapshot,
      input.tenantId,
      input.features,
    );
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.feature.changed",
      entityType: "tenant",
      entityId: input.tenantId,
    });
    return snapshot.featuresByTenant[input.tenantId] ?? null;
  },

  adoptConfigured(input: {
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
  }): TenantProvisionResult {
    if (
      snapshot.tenants.some(
        (row) =>
          row.id === input.identity.tenantUuid ||
          row.slug === input.identity.slug,
      )
    ) {
      const existing = snapshot.tenants.find(
        (row) =>
          row.id === input.identity.tenantUuid ||
          row.slug === input.identity.slug,
      )!;
      return {
        tenantId: existing.id,
        territories: snapshot.territories.filter(
          (row) => row.tenantId === existing.id,
        ),
        status: existing.status,
      };
    }
    const adopted = adoptConfiguredTenant({
      snapshot,
      identity: input.identity,
      branding: input.branding,
      features: input.features,
      territories: input.territories,
    });
    snapshot = adopted.snapshot;
    return adopted.result;
  },
};
