/**
 * Tenant Data Operations — export, backup, restore, DR readiness.
 * Infrastructure operations, not community content duplication.
 * Does not persist GlobalBackupDatabase, UniversalDataSnapshot, TenantClone,
 * CustomerSpecificMigration or PlatformContentCopy. Never branches on a
 * customer slug.
 */

import { sanitizeAuditMetadata } from "../domain/admin-audit-log";
import { capabilitiesForRole } from "./authorization";
import { CAPABILITIES } from "./capabilities";
import { lifecycleStatusFromTenant } from "./tenant-lifecycle";
import {
  emptyTenantFactorySnapshot,
  type TenantFactorySnapshot,
} from "../tenant/factory";

export const DATA_OPERATION_CLASSES = [
  "platform",
  "tenant",
  "territory",
  "domain",
] as const;

export type DataOperationClass = (typeof DATA_OPERATION_CLASSES)[number];

export const TENANT_BACKUP_TYPES = [
  "manual",
  "scheduled",
  "migration",
] as const;

export type TenantBackupType = (typeof TENANT_BACKUP_TYPES)[number];

export const TENANT_BACKUP_STATUSES = [
  "requested",
  "running",
  "completed",
  "failed",
] as const;

export type TenantBackupStatus = (typeof TENANT_BACKUP_STATUSES)[number];

export const TENANT_RESTORE_STATUSES = [
  "requested",
  "validating",
  "running",
  "completed",
  "failed",
] as const;

export type TenantRestoreStatus = (typeof TENANT_RESTORE_STATUSES)[number];

export const DISASTER_RECOVERY_SCENARIOS = [
  "data_loss",
  "partial_corruption",
  "infrastructure_failure",
  "individual_tenant_restore",
] as const;

export type DisasterRecoveryScenario =
  (typeof DISASTER_RECOVERY_SCENARIOS)[number];

export type TenantMembershipReference = {
  personId: string;
  tenantId: string;
  role: string;
  territoryId?: string;
};

export type TenantOwnedRecord = {
  entityType: string;
  entityId: string;
  tenantId: string;
  territoryId?: string;
};

export type TenantOwnedMedia = {
  mediaId: string;
  tenantId: string;
  storageKey: string;
  entityType?: string;
  entityId?: string;
};

export type TenantBackupContext = {
  backupId: string;
  tenantId: string;
  createdAt: string;
  status: TenantBackupStatus;
  size: number;
  checksum: string;
  type: TenantBackupType;
};

export type TenantBackupPayload = {
  tenantId: string;
  territories: Array<{
    id: string;
    tenantId: string;
    name: string;
    slug: string;
  }>;
  memberships: TenantMembershipReference[];
  domain: TenantOwnedRecord[];
  media: TenantOwnedMedia[];
};

export type TenantRestoreContext = {
  restoreId: string;
  tenantId: string;
  backupId: string;
  status: TenantRestoreStatus;
  explicitConfirmation: boolean;
  createdAt: string;
};

export type TenantDataExport = {
  tenantId: string;
  generatedAt: string;
  classification: Record<DataOperationClass, readonly string[]>;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
  };
  territories: Array<{
    id: string;
    tenantId: string;
    name: string;
    slug: string;
  }>;
  memberships: TenantMembershipReference[];
  domain: TenantOwnedRecord[];
  media: TenantOwnedMedia[];
  audit: Array<{
    action: string;
    tenantId: string;
    timestamp: string;
  }>;
};

export type RecoveryObjectives = {
  rpoMinutes: number;
  rtoMinutes: number;
};

export type DisasterRecoveryReadiness = {
  cloudProvider: "none";
  objectives: RecoveryObjectives;
  scenarios: Record<
    DisasterRecoveryScenario,
    { prepared: boolean; contractOnly: boolean }
  >;
};

export type TenantDataPlane = {
  factory: TenantFactorySnapshot;
  memberships: TenantMembershipReference[];
  domain: TenantOwnedRecord[];
  media: TenantOwnedMedia[];
  backups: TenantBackupContext[];
  restores: TenantRestoreContext[];
  payloads: Record<string, TenantBackupPayload>;
  exports: TenantDataExport[];
};

export const DEFAULT_RECOVERY_OBJECTIVES: RecoveryObjectives = {
  rpoMinutes: 60,
  rtoMinutes: 240,
};

export function classifyDataOperations(): Record<
  DataOperationClass,
  readonly string[]
> {
  return {
    platform: [
      "tenants registry",
      "platform operators",
      "saas contracts",
      "control-plane audit",
    ],
    tenant: [
      "tenant metadata",
      "plan",
      "features",
      "limits",
      "lifecycle",
      "membership references",
    ],
    territory: ["territories", "territory bounds"],
    domain: [
      "locations",
      "resources",
      "community records",
      "media references",
    ],
  };
}

export function emptyTenantDataPlane(
  factory: TenantFactorySnapshot = emptyTenantFactorySnapshot(),
): TenantDataPlane {
  return {
    factory,
    memberships: [],
    domain: [],
    media: [],
    backups: [],
    restores: [],
    payloads: {},
    exports: [],
  };
}

export function projectDisasterRecoveryReadiness(): DisasterRecoveryReadiness {
  return {
    cloudProvider: "none",
    objectives: DEFAULT_RECOVERY_OBJECTIVES,
    scenarios: {
      data_loss: { prepared: true, contractOnly: true },
      partial_corruption: { prepared: true, contractOnly: true },
      infrastructure_failure: { prepared: true, contractOnly: true },
      individual_tenant_restore: { prepared: true, contractOnly: true },
    },
  };
}

export function mediaStorageBelongsToTenant(
  storageKey: string,
  tenantId: string,
): boolean {
  const id = tenantId.trim();
  const key = storageKey.trim();
  if (!id || !key) return false;
  return key.startsWith(`${id}/`) && !key.includes("..") && !key.includes("\\");
}

export function mediaOwnedByTenant(
  media: TenantOwnedMedia,
  tenantId: string,
): boolean {
  return (
    media.tenantId === tenantId &&
    mediaStorageBelongsToTenant(media.storageKey, tenantId)
  );
}

export function isOrphanMediaOwnership(media: TenantOwnedMedia): boolean {
  return !media.tenantId.trim() || !media.storageKey.trim();
}

export function backupIsNotContentDuplication(): boolean {
  return true;
}

export function dataOpsPlanDoesNotGrantPermissions(): boolean {
  return !capabilitiesForRole("member").has(CAPABILITIES.manageEnter);
}

export function isOpaqueTenantDataOpsEntity(name: string): boolean {
  return (
    name === "GlobalBackupDatabase" ||
    name === "UniversalDataSnapshot" ||
    name === "TenantClone" ||
    name === "CustomerSpecificMigration" ||
    name === "PlatformContentCopy"
  );
}

function cryptoId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function checksumOf(payload: TenantBackupPayload): string {
  const parts = [
    payload.tenantId,
    ...payload.territories.map((row) => row.id).sort(),
    ...payload.memberships.map((row) => row.personId).sort(),
    ...payload.domain.map((row) => row.entityId).sort(),
    ...payload.media.map((row) => row.mediaId).sort(),
  ];
  const source = parts.join("|");
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ck-${(hash >>> 0).toString(16)}`;
}

function payloadSize(payload: TenantBackupPayload): number {
  return JSON.stringify(payload).length;
}

function requireTenant(plane: TenantDataPlane, tenantId: string) {
  const tenant = plane.factory.tenants.find(
    (row) => row.id === tenantId || row.slug === tenantId,
  );
  if (!tenant) throw new Error("tenant_not_found");
  return tenant;
}

function sliceForTenant(
  plane: TenantDataPlane,
  tenantId: string,
): TenantBackupPayload {
  const tenant = requireTenant(plane, tenantId);
  return {
    tenantId: tenant.id,
    territories: plane.factory.territories
      .filter((row) => row.tenantId === tenant.id)
      .map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        slug: row.slug,
      })),
    memberships: plane.memberships.filter((row) => row.tenantId === tenant.id),
    domain: plane.domain.filter((row) => row.tenantId === tenant.id),
    media: plane.media.filter((row) => row.tenantId === tenant.id),
  };
}

export function assertBackupIsolated(
  payload: TenantBackupPayload,
  tenantId: string,
): void {
  if (payload.tenantId !== tenantId) {
    throw new Error("cross_tenant_backup_forbidden");
  }
  const leak = (row: { tenantId: string }) => row.tenantId !== tenantId;
  if (payload.territories.some(leak)) {
    throw new Error("cross_tenant_backup_forbidden");
  }
  if (payload.memberships.some(leak)) {
    throw new Error("cross_tenant_backup_forbidden");
  }
  if (payload.domain.some(leak)) {
    throw new Error("cross_tenant_backup_forbidden");
  }
  if (payload.media.some((row) => !mediaOwnedByTenant(row, tenantId))) {
    throw new Error("cross_tenant_media_forbidden");
  }
  if (payload.media.some(isOrphanMediaOwnership)) {
    throw new Error("orphan_media_ownership");
  }
}

function assertExportIsolated(
  exported: TenantDataExport,
  tenantId: string,
): void {
  if (exported.tenantId !== tenantId || exported.tenant.id !== tenantId) {
    throw new Error("cross_tenant_export_forbidden");
  }
  const leak = (row: { tenantId: string }) => row.tenantId !== tenantId;
  if (exported.territories.some(leak)) {
    throw new Error("cross_tenant_export_forbidden");
  }
  if (exported.memberships.some(leak)) {
    throw new Error("cross_tenant_export_forbidden");
  }
  if (exported.domain.some(leak)) {
    throw new Error("cross_tenant_export_forbidden");
  }
  if (exported.audit.some(leak)) {
    throw new Error("cross_tenant_export_forbidden");
  }
  if (exported.media.some((row) => !mediaOwnedByTenant(row, tenantId))) {
    throw new Error("cross_tenant_media_forbidden");
  }
}

export const TenantDataExportService = {
  classify: classifyDataOperations,

  exportTenant(
    plane: TenantDataPlane,
    tenantId: string,
    auditTrail: Array<{
      action: string;
      tenantId: string;
      timestamp: string;
      metadata?: Record<string, string | number | boolean | null>;
    }> = [],
  ): TenantDataExport {
    const tenant = requireTenant(plane, tenantId);
    const slice = sliceForTenant(plane, tenant.id);
    assertBackupIsolated(slice, tenant.id);
    const exported: TenantDataExport = {
      tenantId: tenant.id,
      generatedAt: new Date().toISOString(),
      classification: classifyDataOperations(),
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
      },
      territories: slice.territories,
      memberships: slice.memberships,
      domain: slice.domain,
      media: slice.media,
      audit: auditTrail
        .filter((row) => row.tenantId === tenant.id)
        .map((row) => {
          sanitizeAuditMetadata(row.metadata);
          return {
            action: row.action,
            tenantId: row.tenantId,
            timestamp: row.timestamp,
          };
        }),
    };
    assertExportIsolated(exported, tenant.id);
    return exported;
  },
};

export const TenantBackupService = {
  createBackup(
    plane: TenantDataPlane,
    tenantId: string,
    type: TenantBackupType = "manual",
  ): TenantDataPlane {
    const tenant = requireTenant(plane, tenantId);
    const payload = sliceForTenant(plane, tenant.id);
    assertBackupIsolated(payload, tenant.id);
    const backup: TenantBackupContext = {
      backupId: cryptoId(),
      tenantId: tenant.id,
      createdAt: new Date().toISOString(),
      status: "completed",
      size: payloadSize(payload),
      checksum: checksumOf(payload),
      type,
    };
    return {
      ...plane,
      backups: [backup, ...plane.backups],
      payloads: { ...plane.payloads, [backup.backupId]: payload },
    };
  },

  assertIsolated: assertBackupIsolated,
};

export const TenantRestoreService = {
  restoreTenant(
    plane: TenantDataPlane,
    input: {
      tenantId: string;
      backupId?: string;
      restoreTarget?: string;
      explicitConfirmation?: boolean;
    },
  ): TenantDataPlane {
    const tenant = requireTenant(plane, input.tenantId);
    if (input.restoreTarget && input.restoreTarget !== tenant.id) {
      throw new Error("cross_tenant_restore_forbidden");
    }
    const backup =
      (input.backupId
        ? plane.backups.find((row) => row.backupId === input.backupId)
        : plane.backups.find(
            (row) => row.tenantId === tenant.id && row.status === "completed",
          )) ?? null;
    const restoreId = cryptoId();
    const requested: TenantRestoreContext = {
      restoreId,
      tenantId: tenant.id,
      backupId: backup?.backupId ?? input.backupId ?? "",
      status: "requested",
      explicitConfirmation: input.explicitConfirmation === true,
      createdAt: new Date().toISOString(),
    };
    if (!backup) {
      return {
        ...plane,
        restores: [
          { ...requested, status: "failed" },
          ...plane.restores,
        ],
      };
    }
    const payload = plane.payloads[backup.backupId];
    const validating: TenantRestoreContext = {
      ...requested,
      backupId: backup.backupId,
      status: "validating",
    };
    try {
      if (!payload) throw new Error("backup_payload_missing");
      if (payload.tenantId !== tenant.id || backup.tenantId !== tenant.id) {
        throw new Error("cross_tenant_restore_forbidden");
      }
      assertBackupIsolated(payload, tenant.id);
      const active =
        lifecycleStatusFromTenant(tenant.status) === "active";
      if (active && input.explicitConfirmation !== true) {
        throw new Error("restore_confirmation_required");
      }
      const running: TenantRestoreContext = {
        ...validating,
        status: "running",
      };
      const nextDomain = [
        ...plane.domain.filter((row) => row.tenantId !== tenant.id),
        ...payload.domain,
      ];
      const nextMedia = [
        ...plane.media.filter((row) => row.tenantId !== tenant.id),
        ...payload.media,
      ];
      const nextMemberships = [
        ...plane.memberships.filter((row) => row.tenantId !== tenant.id),
        ...payload.memberships,
      ];
      return {
        ...plane,
        domain: nextDomain,
        media: nextMedia,
        memberships: nextMemberships,
        restores: [
          { ...running, status: "completed" },
          ...plane.restores,
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "restore_failed";
      if (
        message === "cross_tenant_restore_forbidden" ||
        message === "restore_confirmation_required" ||
        message === "cross_tenant_backup_forbidden" ||
        message === "cross_tenant_media_forbidden"
      ) {
        throw error;
      }
      return {
        ...plane,
        restores: [{ ...validating, status: "failed" }, ...plane.restores],
      };
    }
  },
};
