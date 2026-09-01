/**
 * Production readiness isolation tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canMutateSaasControlPlane,
  databaseHealthMetadataSanitized,
  emptyTenantFactorySnapshot,
  isOpaqueProductionReadinessEntity,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { EnvironmentRuntime } from "@/lib/platform/environment-runtime";
import { MigrationSafetyService } from "@/lib/platform/migration-safety-service";
import {
  PlatformIncidentService,
  ProductionReadinessRuntime,
  TenantLaunchService,
} from "@/lib/platform/production-readiness-service";
import {
  replacePlatformOperationsStoreForTests,
  listPlatformAudit,
} from "@/lib/platform/platform-operations-store";
import { replaceProductionReadinessStoreForTests } from "@/lib/platform/production-readiness-store";
import {
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import { replaceTenantDataOpsStoreForTests } from "@/lib/platform/tenant-data-ops-service";
import { TenantDataOpsRuntime } from "@/lib/platform/tenant-data-ops-service";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PANO_SLUG = "life-panoramica";
const VALLEY_SLUG = "life-valley";

let panoTenantId = "";
let valleyTenantId = "";

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole;
  personId?: string;
}): RequestActor {
  const role = input.role ?? "member";
  const personId = input.personId ?? "person-alex";
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(role, input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: input.tenantSlug,
      role,
    },
  };
}

const operator = () =>
  actor({
    tenantSlug: PANO_SLUG,
    personId: "person-platform",
    role: "administrator",
  });

describe("Production readiness isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
    replaceProductionReadinessStoreForTests();
    replacePlatformOperationsStoreForTests();
    replaceTenantDataOpsStoreForTests();
    panoTenantId = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Life Panoramica",
        slug: PANO_SLUG,
        locale: "es",
        timezone: "UTC",
        territories: [{ name: "Panoramica" }],
      },
    }).tenantId;
    valleyTenantId = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Life Valley",
        slug: VALLEY_SLUG,
        locale: "es",
        timezone: "UTC",
        territories: [{ name: "Valley" }],
      },
    }).tenantId;
  });

  it("TEST 1 — Platform Operator puede ver operations", async () => {
    const readiness = await ProductionReadinessRuntime.resolve();
    assert.equal(readiness.environment.environment.length > 0, true);
    assert.equal(readiness.health.signals.length >= 5, true);
  });

  it("TEST 2 — Community Admin no accede operations", async () => {
    assert.equal(canMutateSaasControlPlane(false), false);
    await assert.rejects(
      async () => {
        PlatformIncidentService.create({
          actor: actor({
            tenantSlug: PANO_SLUG,
            role: "administrator",
            personId: "person-admin",
          }),
          title: "Test",
          description: "Denied",
        });
      },
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });

  it("TEST 3 — tenant isolation mantenido", async () => {
    const pano = TenantLaunchService.get(panoTenantId);
    const valley = TenantLaunchService.get(valleyTenantId);
    assert.notEqual(pano.tenantId, valley.tenantId);
  });

  it("TEST 4 — Database health no expone secretos", async () => {
    const database = await MigrationSafetyService.context();
    assert.equal(
      databaseHealthMetadataSanitized({
        schemaVersion: database.schemaVersion,
        migrationStatus: database.migrationStatus,
      }),
      true,
    );
    assert.equal(JSON.stringify(database).includes("service_role"), false);
  });

  it("TEST 5 — Incident audit generado", () => {
    PlatformIncidentService.create({
      actor: operator(),
      title: "API latency",
      description: "Elevated response times",
      tenantId: panoTenantId,
    });
    const audit = listPlatformAudit();
    assert.equal(
      audit.some((row) => row.action === "platform.incident.created"),
      true,
    );
  });

  it("TEST 6 — Backup verification aislada", () => {
    const backup = TenantDataOpsRuntime.createBackup({
      actor: operator(),
      tenantId: panoTenantId,
      type: "manual",
    });
    assert.ok(backup);
    const verification = ProductionReadinessRuntime.verifyBackup({
      actor: operator(),
      backupId: backup.backupId,
      tenantId: panoTenantId,
      restoreTested: true,
    });
    assert.equal(verification.tenantId, panoTenantId);
    assert.throws(
      () =>
        ProductionReadinessRuntime.verifyBackup({
          actor: operator(),
          backupId: backup.backupId,
          tenantId: valleyTenantId,
          restoreTested: true,
        }),
      TenantFactoryDeniedError,
    );
  });

  it("TEST 7 — Launch checklist tenant correcto", () => {
    const checklist = TenantLaunchService.get(panoTenantId);
    assert.equal(checklist.tenantId, panoTenantId);
    assert.equal(checklist.items.tenant_created, true);
  });

  it("TEST 8 — Valley separado de Panorámica", () => {
    const pano = TenantLaunchService.get(panoTenantId);
    const valley = TenantLaunchService.get(valleyTenantId);
    assert.equal(pano.tenantId, panoTenantId);
    assert.equal(valley.tenantId, valleyTenantId);
    assert.notEqual(pano.tenantId, valley.tenantId);
  });

  it("TEST 9 — Production context no contiene datos dominio", async () => {
    const readiness = await ProductionReadinessRuntime.resolve();
    assert.equal(JSON.stringify(readiness).includes('"messages"'), false);
    assert.equal(EnvironmentRuntime.resolve().environment.length > 0, true);
  });

  it("TEST 10 — No existe GlobalProductionEntity", () => {
    assert.equal(isOpaqueProductionReadinessEntity("GlobalProductionEntity"), true);
    const source = readFileSync(
      path.join(HERE, "production-readiness-service.ts"),
      "utf8",
    );
    assert.equal(source.includes("GlobalProductionEntity"), false);
  });
});
