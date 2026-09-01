/**
 * SaaS security hardening runtime — boundaries, spoof denial, security center.
 * Does not store domain content, users, or scores.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  AuthorizationService,
  CLIENT_CAPABILITY_SPOOF,
  CROSS_TENANT_ACCESS_DENIED,
  SAAS_CONTROL_PLANE_FORBIDDEN,
  TERRITORY_BOUNDARY_VIOLATION,
  assertMediaOwnership,
  assertTenantBoundary,
  canAccessPlatformAdmin,
  projectConfigurationRisks,
  projectSecurityCenter,
  projectSecurityPolicyContext,
  rejectClientAuthoritySpoof,
  requirePrivilegedConfirmation,
  spoofDenialCode,
  type AuthorizationAction,
  type AuthorizationActorKind,
  type ClientAuthoritySpoof,
  type TenantOwnedMedia,
} from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import {
  listPlatformAudit,
  listPlatformSecurityEvents,
  recordCrossTenantDenied,
  recordInvalidPermission,
  recordSpoofSecurityEvent,
  recordTerritoryMismatch,
} from "@/lib/platform/platform-operations-store";

function actorKind(actor: RequestActor): AuthorizationActorKind {
  if (
    actor.personId &&
    canAccessPlatformAdmin({
      personId: actor.personId,
      operators: TenantFactoryRuntime.snapshot().operators,
    })
  ) {
    return "platformOperator";
  }
  if (actor.role === "administrator" || actor.role === "moderator") {
    return "communityAdministrator";
  }
  return "member";
}

export function denyClientAuthoritySpoof(input: {
  personId: string;
  tenantId?: string;
  spoof?: ClientAuthoritySpoof | null;
}): void {
  const field = rejectClientAuthoritySpoof(input.spoof);
  if (!field) return;
  recordSpoofSecurityEvent({
    field,
    actorPersonId: input.personId,
    tenantId: input.tenantId,
  });
  throw new TenantFactoryDeniedError(spoofDenialCode(field));
}

export function requirePlatformSecurityOperator(actor: RequestActor): string {
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

export const SecurityHardeningRuntime = {
  policy(tenantId: string, platformAccess: boolean) {
    return projectSecurityPolicyContext({
      tenantId,
      platformAccess,
      communityAccess: !platformAccess,
    });
  },

  authorize(input: {
    actor: RequestActor;
    action: AuthorizationAction | string;
    resourceTenantId?: string;
    resourceTerritoryId?: string;
  }) {
    return AuthorizationService.authorize({
      actor: {
        kind: actorKind(input.actor),
        tenantId: input.actor.tenantSlug,
        territoryId: input.actor.territoryId ?? undefined,
      },
      action: input.action,
      resource: {
        tenantId: input.resourceTenantId,
        territoryId: input.resourceTerritoryId,
      },
    });
  },

  assertTenantRead(input: {
    actor: RequestActor;
    resourceTenantId: string;
  }) {
    try {
      assertTenantBoundary({
        actorTenantId: input.actor.tenantSlug,
        resourceTenantId: input.resourceTenantId,
      });
    } catch (error) {
      recordCrossTenantDenied({
        actorTenantId: input.actor.tenantSlug,
        requestedTenantId: input.resourceTenantId,
        actorPersonId: input.actor.personId ?? undefined,
      });
      throw error instanceof Error
        ? error
        : new Error(CROSS_TENANT_ACCESS_DENIED);
    }
  },

  assertTerritory(input: {
    actor: RequestActor;
    resourceTenantId: string;
    resourceTerritoryId: string;
  }) {
    try {
      assertTenantBoundary({
        actorTenantId: input.actor.tenantSlug,
        resourceTenantId: input.resourceTenantId,
        actorTerritoryId: input.actor.territoryId ?? undefined,
        resourceTerritoryId: input.resourceTerritoryId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : TERRITORY_BOUNDARY_VIOLATION;
      if (message === CROSS_TENANT_ACCESS_DENIED) {
        recordCrossTenantDenied({
          actorTenantId: input.actor.tenantSlug,
          requestedTenantId: input.resourceTenantId,
          actorPersonId: input.actor.personId ?? undefined,
        });
      } else {
        recordTerritoryMismatch({
          actorTerritoryId: input.actor.territoryId ?? "unknown",
          requestedTerritoryId: input.resourceTerritoryId,
          tenantId: input.resourceTenantId,
          actorPersonId: input.actor.personId ?? undefined,
        });
      }
      throw error instanceof Error ? error : new Error(message);
    }
  },

  assertMedia(media: TenantOwnedMedia, tenantId: string) {
    assertMediaOwnership(media, tenantId);
  },

  confirmPrivileged(action: string, explicitConfirmation?: boolean) {
    requirePrivilegedConfirmation({ action, explicitConfirmation });
  },

  center() {
    const snapshot = TenantFactoryRuntime.snapshot();
    const incomplete = snapshot.tenants.filter(
      (row) => row.status !== "active",
    ).length;
    return projectSecurityCenter({
      events: listPlatformSecurityEvents(),
      audit: listPlatformAudit().map((row) => ({
        actor: row.actorPersonId,
        tenantId: row.tenantId,
        territoryId: row.territoryId,
        action: String(row.action),
        timestamp: row.createdAt,
        metadata: row.metadata,
      })),
      configurationRisks: projectConfigurationRisks({
        incompleteTenants: incomplete,
        frontendSecretKeys: ["NEXT_PUBLIC_SUPABASE_URL"],
      }),
    });
  },
};

export { CLIENT_CAPABILITY_SPOOF };
