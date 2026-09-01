/**
 * Production readiness contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { canAccessPlatformAdmin } from "../tenant/factory";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canMutateSaasControlPlane,
} from "../domain/admin-operations";
import {
  backupVerificationRespectsTenantIsolation,
  databaseHealthMetadataSanitized,
  environmentContainsDomainData,
  isOpaqueProductionReadinessEntity,
  productionContextContainsDomainData,
  projectBackupVerificationContext,
  projectDatabaseOperationsContext,
  projectPlatformHealthContext,
  projectProductionEnvironmentContext,
  projectProductionReadinessContext,
  projectSupabaseSecurityReadiness,
  projectTenantLaunchChecklist,
  supabaseReadinessExposesSecrets,
  validateMigrationCheck,
} from "../platform/operations/index";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PANO = "life-panoramica";
const VALLEY = "life-valley";

describe("Production Readiness", () => {
  it("TEST 1 — Platform Operator puede ver operations", () => {
    assert.equal(
      canAccessPlatformAdmin({
        personId: "person-platform",
        operators: [{ personId: "person-platform", status: "active" }],
      }),
      true,
    );
  });

  it("TEST 2 — Community Admin no accede operations", () => {
    assert.equal(canMutateSaasControlPlane(false), false);
    assert.equal(SAAS_CONTROL_PLANE_FORBIDDEN, "saas_control_plane_forbidden");
  });

  it("TEST 3 — tenant isolation mantenido", () => {
    const verification = projectBackupVerificationContext({
      backupId: "bk-1",
      tenantId: PANO,
      targetTenantId: PANO,
    });
    assert.equal(
      backupVerificationRespectsTenantIsolation({
        backupTenantId: verification.tenantId,
        targetTenantId: VALLEY,
      }),
      false,
    );
  });

  it("TEST 4 — Database health no expone secretos", () => {
    const db = projectDatabaseOperationsContext({
      schemaVersion: "20260830160000",
      migrationStatus: "up_to_date",
      databaseHealth: "healthy",
    });
    assert.equal(
      databaseHealthMetadataSanitized({
        schemaVersion: db.schemaVersion,
        note: "checked",
      }),
      true,
    );
    assert.equal(
      databaseHealthMetadataSanitized({ api_key: "hidden" }),
      false,
    );
  });

  it("TEST 5 — Incident audit generado", () => {
    const source = readFileSync(
      path.join(HERE, "..", "domain", "admin-audit-log.ts"),
      "utf8",
    );
    assert.equal(source.includes("platform.incident.created"), true);
    assert.equal(source.includes("platform.incident.resolved"), true);
  });

  it("TEST 6 — Backup verification aislada", () => {
    const ok = projectBackupVerificationContext({
      backupId: "bk-pano",
      tenantId: PANO,
      verificationStatus: "verified",
      restoreTested: true,
      targetTenantId: PANO,
    });
    assert.equal(
      backupVerificationRespectsTenantIsolation({
        backupTenantId: ok.tenantId,
        targetTenantId: ok.targetTenantId,
      }),
      true,
    );
  });

  it("TEST 7 — Launch checklist tenant correcto", () => {
    const checklist = projectTenantLaunchChecklist({
      tenantId: PANO,
      items: {
        tenant_created: true,
        territory_configured: true,
        branding_ready: true,
        features_configured: true,
        admin_invited: true,
        validation_complete: true,
        launch_approved: true,
      },
    });
    assert.equal(checklist.tenantId, PANO);
    assert.equal(checklist.status, "ready");
  });

  it("TEST 8 — Valley separado de Panorámica", () => {
    const pano = projectTenantLaunchChecklist({
      tenantId: PANO,
      items: { tenant_created: true },
    });
    const valley = projectTenantLaunchChecklist({
      tenantId: VALLEY,
      items: { tenant_created: true },
    });
    assert.notEqual(pano.tenantId, valley.tenantId);
  });

  it("TEST 9 — Production context no contiene datos dominio", () => {
    const readiness = projectProductionReadinessContext({
      environment: projectProductionEnvironmentContext({
        environment: "staging",
        version: "0.0.0",
      }),
      database: projectDatabaseOperationsContext({
        schemaVersion: "1",
        migrationStatus: "up_to_date",
      }),
      supabase: projectSupabaseSecurityReadiness({
        authConfigured: true,
        rlsValidated: true,
        storagePoliciesConfigured: true,
        apiProtectionStatus: "protected",
      }),
      health: projectPlatformHealthContext({
        signals: [
          {
            component: "api",
            status: "healthy",
            checkedAt: new Date().toISOString(),
          },
        ],
      }),
    });
    assert.equal(environmentContainsDomainData(readiness.environment), false);
    assert.equal(productionContextContainsDomainData(readiness), false);
  });

  it("TEST 10 — No existe GlobalProductionEntity", () => {
    assert.equal(isOpaqueProductionReadinessEntity("GlobalProductionEntity"), true);
    assert.equal(isOpaqueProductionReadinessEntity("UniversalMonitoringEntity"), true);
    const check = validateMigrationCheck({ appliedCount: 10, availableCount: 12 });
    assert.equal(check.pendingMigrations, 2);
    const supabase = projectSupabaseSecurityReadiness({
      authConfigured: true,
      storagePoliciesConfigured: true,
      rlsValidated: true,
      apiProtectionStatus: "protected",
    });
    assert.equal(supabaseReadinessExposesSecrets(supabase), false);
  });
});
