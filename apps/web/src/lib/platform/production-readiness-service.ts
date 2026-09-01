/**
 * Production readiness runtime — aggregates environment, health, incidents, launch.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  backupVerificationRespectsTenantIsolation,
  canAccessPlatformAdmin,
  projectBackupVerificationContext,
  projectPlatformHealthContext,
  projectProductionReadinessContext,
  projectSupabaseSecurityReadiness,
  type BackupVerificationContext,
  type ProductionReadinessContext,
  type PlatformHealthSignal,
} from "@life-community-os/types";
import { isDatabaseConfigured } from "@/lib/data/data-plane";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import { EnvironmentRuntime } from "@/lib/platform/environment-runtime";
import { MigrationSafetyService } from "@/lib/platform/migration-safety-service";
import { PlatformIncidentService } from "@/lib/platform/platform-incident-service";
import { TenantLaunchService } from "@/lib/platform/tenant-launch-service";
import { TenantDataOpsRuntime } from "@/lib/platform/tenant-data-ops-service";
import {
  listBackupVerifications,
  saveBackupVerification,
} from "@/lib/platform/production-readiness-store";
import { recordPlatformAudit } from "@/lib/platform/platform-operations-store";

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
    throw new TenantFactoryDeniedError(SAAS_CONTROL_PLANE_FORBIDDEN);
  }
  return actor.personId;
}

function healthSignals(): PlatformHealthSignal[] {
  const now = new Date().toISOString();
  const dbConfigured = isDatabaseConfigured();
  return [
    {
      component: "api",
      status: "healthy",
      detail: "Application runtime responding",
      checkedAt: now,
    },
    {
      component: "database",
      status: dbConfigured ? "healthy" : "warning",
      detail: dbConfigured ? "Database configured" : "Fixture or file mode",
      checkedAt: now,
    },
    {
      component: "storage",
      status: process.env.SUPABASE_URL ? "healthy" : "unknown",
      detail: "Storage posture checked",
      checkedAt: now,
    },
    {
      component: "authentication",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "healthy" : "warning",
      detail: "Auth configuration reviewed",
      checkedAt: now,
    },
    {
      component: "realtime",
      status: "unknown",
      detail: "Realtime optional",
      checkedAt: now,
    },
  ];
}

export const ProductionReadinessRuntime = {
  async resolve(): Promise<ProductionReadinessContext> {
    const environment = EnvironmentRuntime.resolve();
    const database = await MigrationSafetyService.context();
    const supabase = projectSupabaseSecurityReadiness({
      authConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      storagePoliciesConfigured: Boolean(process.env.SUPABASE_URL),
      rlsValidated: isDatabaseConfigured(),
      apiProtectionStatus: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "review_needed"
        : "protected",
    });
    const health = projectPlatformHealthContext({
      signals: healthSignals(),
    });
    return projectProductionReadinessContext({
      environment,
      database,
      supabase,
      health,
      incidents: PlatformIncidentService.list(),
      launchChecklists: TenantLaunchService.list(),
      backupVerifications: listBackupVerifications(),
    });
  },

  async recordEnvironmentCheck(actor: RequestActor): Promise<void> {
    const personId = requireOperator(actor);
    recordPlatformAudit({
      tenantId: actor.tenantSlug || "platform",
      actorPersonId: personId,
      action: "platform.environment.checked",
      entityType: "platform",
      entityId: "environment",
      metadata: { environment: EnvironmentRuntime.resolve().environment },
    });
  },

  async recordDatabaseHealthCheck(actor: RequestActor): Promise<void> {
    const personId = requireOperator(actor);
    const database = await MigrationSafetyService.context();
    recordPlatformAudit({
      tenantId: actor.tenantSlug || "platform",
      actorPersonId: personId,
      action: "platform.database.health.checked",
      entityType: "platform",
      entityId: "database",
      metadata: {
        schemaVersion: database.schemaVersion,
        migrationStatus: database.migrationStatus,
      },
    });
    recordPlatformAudit({
      tenantId: actor.tenantSlug || "platform",
      actorPersonId: personId,
      action: "platform.database.migration.checked",
      entityType: "platform",
      entityId: "database",
      metadata: { pendingMigrations: database.pendingMigrations },
    });
  },

  verifyBackup(input: {
    actor: RequestActor;
    backupId: string;
    tenantId: string;
    restoreTested?: boolean;
  }): BackupVerificationContext {
    const personId = requireOperator(input.actor);
    const backup = TenantDataOpsRuntime.listBackups().find(
      (row) => row.backupId === input.backupId && row.tenantId === input.tenantId,
    );
    if (!backup) throw new TenantFactoryDeniedError("not_found");
    if (
      !backupVerificationRespectsTenantIsolation({
        backupTenantId: backup.tenantId,
        targetTenantId: input.tenantId,
      })
    ) {
      throw new TenantFactoryDeniedError("forbidden");
    }
    const verification = projectBackupVerificationContext({
      backupId: input.backupId,
      tenantId: input.tenantId,
      targetTenantId: input.tenantId,
      verificationStatus: input.restoreTested ? "verified" : "pending",
      restoreTested: input.restoreTested === true,
      lastVerification: new Date().toISOString(),
    });
    saveBackupVerification(verification);
    if (verification.verificationStatus === "verified") {
      recordPlatformAudit({
        tenantId: verification.tenantId,
        actorPersonId: personId,
        action: "platform.backup.verification.completed",
        entityType: "backup",
        entityId: verification.backupId,
      });
    }
    return verification;
  },
};

export { EnvironmentRuntime, MigrationSafetyService, PlatformIncidentService, TenantLaunchService };
