/**
 * Tenant Data Operations runtime — export, backup, restore.
 * Does not clone tenants, copy community content, or mix tenant data.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  TenantBackupService,
  TenantDataExportService,
  TenantRestoreService,
  canAccessPlatformAdmin,
  emptyTenantDataPlane,
  projectDisasterRecoveryReadiness,
  rejectClientAuthoritySpoof,
  type ClientAuthoritySpoof,
  type TenantBackupType,
  type TenantDataExport,
  type TenantDataPlane,
  type TenantMembershipReference,
  type TenantOwnedMedia,
  type TenantOwnedRecord,
} from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import {
  listPlatformAudit,
  recordInvalidPermission,
  recordPlatformAudit,
  recordSpoofSecurityEvent,
} from "@/lib/platform/platform-operations-store";

let plane: TenantDataPlane = emptyTenantDataPlane();

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

function currentPlane(): TenantDataPlane {
  return {
    ...plane,
    factory: TenantFactoryRuntime.snapshot(),
  };
}

function commit(next: TenantDataPlane): void {
  plane = {
    ...next,
    factory: TenantFactoryRuntime.snapshot(),
  };
}

export function replaceTenantDataOpsStoreForTests(
  next: TenantDataPlane = emptyTenantDataPlane(),
): void {
  plane = next;
}

export function seedTenantDataOpsForTests(input: {
  memberships?: TenantMembershipReference[];
  domain?: TenantOwnedRecord[];
  media?: TenantOwnedMedia[];
}): void {
  plane = {
    ...currentPlane(),
    memberships: input.memberships ?? plane.memberships,
    domain: input.domain ?? plane.domain,
    media: input.media ?? plane.media,
  };
}

export const TenantDataOpsRuntime = {
  listExports() {
    return currentPlane().exports;
  },

  listBackups() {
    return currentPlane().backups;
  },

  listRestores() {
    return currentPlane().restores;
  },

  recovery() {
    return projectDisasterRecoveryReadiness();
  },

  exportTenant(input: {
    actor: RequestActor;
    tenantId: string;
    spoof?: ClientAuthoritySpoof | null;
    reason?: string;
  }): TenantDataExport {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.export.started",
      entityType: "export",
      entityId: input.tenantId,
      metadata: input.reason ? { reason: input.reason } : undefined,
    });
    const exported = TenantDataExportService.exportTenant(
      currentPlane(),
      input.tenantId,
      listPlatformAudit().map((row) => ({
        action: String(row.action),
        tenantId: row.tenantId,
        timestamp: row.createdAt,
        metadata: row.metadata,
      })),
    );
    commit({
      ...currentPlane(),
      exports: [exported, ...currentPlane().exports],
    });
    recordPlatformAudit({
      tenantId: input.tenantId,
      actorPersonId: personId,
      action: "platform.export.completed",
      entityType: "export",
      entityId: input.tenantId,
      metadata: { size: exported.domain.length + exported.media.length },
    });
    return exported;
  },

  createBackup(input: {
    actor: RequestActor;
    tenantId: string;
    type?: TenantBackupType;
    spoof?: ClientAuthoritySpoof | null;
    reason?: string;
  }) {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    const next = TenantBackupService.createBackup(
      currentPlane(),
      input.tenantId,
      input.type ?? "manual",
    );
    commit(next);
    const backup = next.backups[0];
    if (backup) {
      recordPlatformAudit({
        tenantId: input.tenantId,
        actorPersonId: personId,
        action: "platform.backup.created",
        entityType: "backup",
        entityId: backup.backupId,
        metadata: {
          type: backup.type,
          checksum: backup.checksum,
          ...(input.reason ? { reason: input.reason } : {}),
        },
      });
    }
    return backup;
  },

  restoreTenant(input: {
    actor: RequestActor;
    tenantId: string;
    backupId?: string;
    spoof?: ClientAuthoritySpoof | null;
    explicitConfirmation?: boolean;
    reason?: string;
  }) {
    const personId = requireOperator(input.actor);
    rejectSpoof(personId, input.tenantId, input.spoof);
    try {
      const next = TenantRestoreService.restoreTenant(currentPlane(), {
        tenantId: input.tenantId,
        backupId: input.backupId,
        explicitConfirmation: input.explicitConfirmation,
      });
      commit(next);
      const restore = next.restores[0];
      if (restore?.status === "failed") {
        recordPlatformAudit({
          tenantId: input.tenantId,
          actorPersonId: personId,
          action: "platform.restore.failed",
          entityType: "restore",
          entityId: restore.restoreId,
        });
        throw new Error("restore_failed");
      }
      if (restore?.status === "completed") {
        recordPlatformAudit({
          tenantId: input.tenantId,
          actorPersonId: personId,
          action: "platform.backup.restored",
          entityType: "restore",
          entityId: restore.backupId,
          metadata: input.reason ? { reason: input.reason } : undefined,
        });
      }
      return restore;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "cross_tenant_restore_forbidden" ||
          error.message === "restore_confirmation_required" ||
          error.message === "cross_tenant_backup_forbidden" ||
          error.message === "cross_tenant_media_forbidden")
      ) {
        recordPlatformAudit({
          tenantId: input.tenantId,
          actorPersonId: personId,
          action: "platform.restore.failed",
          entityType: "restore",
          entityId: input.tenantId,
          metadata: { reason: error.message },
        });
      }
      throw error;
    }
  },
};
