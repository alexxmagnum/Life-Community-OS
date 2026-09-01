/**
 * Tenant Data Operations contract tests — export, backup, restore, DR.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAdminAuditLog,
  sanitizeAuditMetadata,
} from "../domain/admin-audit-log";
import {
  canMutateSaasControlPlane,
  SAAS_CONTROL_PLANE_FORBIDDEN,
} from "../domain/admin-operations";
import {
  TenantFactoryService,
  adoptConfiguredTenant,
  emptyTenantFactorySnapshot,
  featuresForPlan,
  rejectClientAuthoritySpoof,
} from "../tenant/factory";
import {
  TenantBackupService,
  TenantDataExportService,
  TenantRestoreService,
  assertBackupIsolated,
  backupIsNotContentDuplication,
  classifyDataOperations,
  dataOpsPlanDoesNotGrantPermissions,
  emptyTenantDataPlane,
  isOpaqueTenantDataOpsEntity,
  isOrphanMediaOwnership,
  mediaOwnedByTenant,
  mediaStorageBelongsToTenant,
  projectDisasterRecoveryReadiness,
  type TenantDataPlane,
} from "./data-export";

function luxuryPlane(): { plane: TenantDataPlane; luxuryId: string; bId: string } {
  const luxury = TenantFactoryService.provision(emptyTenantFactorySnapshot(), {
    name: "Luxury Communities Inc",
    slug: "luxury-communities",
    locale: "en",
    timezone: "UTC",
    territories: [{ name: "Panorámica Golf" }],
  });
  const withHills = TenantFactoryService.addTerritory(luxury.snapshot, {
    tenantId: luxury.result.tenantId,
    name: "Ocean Hills",
  });
  const withValley = TenantFactoryService.addTerritory(withHills.snapshot, {
    tenantId: luxury.result.tenantId,
    name: "Valley",
  });
  const tenantB = TenantFactoryService.provision(withValley.snapshot, {
    name: "Tenant B",
    slug: "tenant-b",
    locale: "en",
    timezone: "UTC",
    territories: [{ name: "North Ridge" }],
  });
  const plane = emptyTenantDataPlane(tenantB.snapshot);
  plane.memberships = [
    {
      personId: "person-alex",
      tenantId: luxury.result.tenantId,
      role: "member",
    },
    {
      personId: "person-blake",
      tenantId: tenantB.result.tenantId,
      role: "member",
    },
  ];
  plane.domain = [
    {
      entityType: "location",
      entityId: "loc-pano",
      tenantId: luxury.result.tenantId,
    },
    {
      entityType: "location",
      entityId: "loc-b",
      tenantId: tenantB.result.tenantId,
    },
  ];
  plane.media = [
    {
      mediaId: "media-pano",
      tenantId: luxury.result.tenantId,
      storageKey: `${luxury.result.tenantId}/media-pano/cover.webp`,
      entityType: "location",
      entityId: "loc-pano",
    },
    {
      mediaId: "media-b",
      tenantId: tenantB.result.tenantId,
      storageKey: `${tenantB.result.tenantId}/media-b/cover.webp`,
      entityType: "location",
      entityId: "loc-b",
    },
  ];
  return {
    plane,
    luxuryId: luxury.result.tenantId,
    bId: tenantB.result.tenantId,
  };
}

describe("Tenant Data Operations", () => {
  it("TEST 1 — export tenant correcto", () => {
    const { plane, luxuryId } = luxuryPlane();
    const exported = TenantDataExportService.exportTenant(plane, luxuryId);
    assert.equal(exported.tenantId, luxuryId);
    assert.equal(exported.tenant.slug, "luxury-communities");
    assert.equal(exported.territories.length, 3);
    assert.equal(exported.memberships.length, 1);
    assert.equal(exported.domain.length, 1);
    assert.equal(exported.media.length, 1);
    const classes = classifyDataOperations();
    assert.ok(classes.platform.length > 0);
    assert.ok(classes.tenant.length > 0);
    assert.ok(classes.territory.length > 0);
    assert.ok(classes.domain.length > 0);
  });

  it("TEST 2 — export no incluye otro tenant", () => {
    const { plane, luxuryId, bId } = luxuryPlane();
    const exported = TenantDataExportService.exportTenant(plane, luxuryId);
    assert.equal(
      exported.domain.some((row) => row.tenantId === bId),
      false,
    );
    assert.equal(
      exported.media.some((row) => row.tenantId === bId),
      false,
    );
    assert.equal(
      exported.territories.some((row) => row.tenantId === bId),
      false,
    );
    assert.equal(exported.memberships[0]?.personId, "person-alex");
  });

  it("TEST 3 — backup tenant aislado", () => {
    const { plane, luxuryId, bId } = luxuryPlane();
    const next = TenantBackupService.createBackup(plane, luxuryId, "manual");
    const backup = next.backups[0];
    assert.ok(backup);
    assert.equal(backup.tenantId, luxuryId);
    assert.equal(backup.status, "completed");
    assert.ok(backup.checksum.startsWith("ck-"));
    assert.ok(backup.size > 0);
    const payload = next.payloads[backup.backupId];
    assert.ok(payload);
    assertBackupIsolated(payload, luxuryId);
    assert.equal(payload.domain.some((row) => row.tenantId === bId), false);
    assert.equal(backupIsNotContentDuplication(), true);
  });

  it("TEST 4 — restore tenant correcto", () => {
    const { plane, luxuryId } = luxuryPlane();
    const backed = TenantBackupService.createBackup(plane, luxuryId);
    const backupId = backed.backups[0]!.backupId;
    const mutated: TenantDataPlane = {
      ...backed,
      domain: backed.domain.filter((row) => row.tenantId !== luxuryId),
    };
    const restored = TenantRestoreService.restoreTenant(mutated, {
      tenantId: luxuryId,
      backupId,
    });
    assert.equal(
      restored.domain.some((row) => row.entityId === "loc-pano"),
      true,
    );
    assert.equal(restored.restores[0]?.status, "completed");
  });

  it("TEST 5 — restore tenant incorrecto rechazado", () => {
    const { plane, luxuryId, bId } = luxuryPlane();
    const backed = TenantBackupService.createBackup(plane, luxuryId);
    const backupId = backed.backups[0]!.backupId;
    assert.throws(
      () =>
        TenantRestoreService.restoreTenant(backed, {
          tenantId: bId,
          backupId,
        }),
      /cross_tenant_restore_forbidden/,
    );
    assert.throws(
      () =>
        TenantRestoreService.restoreTenant(backed, {
          tenantId: luxuryId,
          restoreTarget: bId,
        }),
      /cross_tenant_restore_forbidden/,
    );
  });

  it("TEST 6 — media ownership validado", () => {
    const { luxuryId, bId } = luxuryPlane();
    assert.equal(
      mediaStorageBelongsToTenant(`${luxuryId}/a/cover.webp`, luxuryId),
      true,
    );
    assert.equal(
      mediaStorageBelongsToTenant(`${bId}/a/cover.webp`, luxuryId),
      false,
    );
    assert.equal(
      mediaOwnedByTenant(
        {
          mediaId: "x",
          tenantId: luxuryId,
          storageKey: `${luxuryId}/x/file.png`,
        },
        luxuryId,
      ),
      true,
    );
    assert.equal(
      isOrphanMediaOwnership({
        mediaId: "x",
        tenantId: "",
        storageKey: "",
      }),
      true,
    );
    assert.throws(
      () =>
        assertBackupIsolated(
          {
            tenantId: luxuryId,
            territories: [],
            memberships: [],
            domain: [],
            media: [
              {
                mediaId: "leak",
                tenantId: luxuryId,
                storageKey: `${bId}/leak/file.png`,
              },
            ],
          },
          luxuryId,
        ),
      /cross_tenant_media_forbidden/,
    );
  });

  it("TEST 7 — audit generado", () => {
    const { luxuryId } = luxuryPlane();
    const started = createAdminAuditLog({
      tenantId: luxuryId,
      actorPersonId: "person-platform",
      actorRole: "platform_operator",
      action: "platform.export.started",
      entityType: "export",
      entityId: luxuryId,
      metadata: { token: "secret-value", reason: "ops" },
    });
    assert.equal(started.action, "platform.export.started");
    assert.equal(started.metadata?.token, undefined);
    assert.equal(started.metadata?.reason, "ops");
    const cleaned = sanitizeAuditMetadata({
      password: "x",
      secret: "y",
      size: 12,
    });
    assert.equal(cleaned?.password, undefined);
    assert.equal(cleaned?.size, 12);
    assert.equal(SAAS_CONTROL_PLANE_FORBIDDEN, "saas_control_plane_forbidden");
  });

  it("TEST 8 — Community Admin sin acceso", () => {
    assert.equal(canMutateSaasControlPlane(false), false);
  });

  it("TEST 9 — Valley separado de Panorámica", () => {
    const pano = adoptConfiguredTenant({
      snapshot: emptyTenantFactorySnapshot(),
      identity: {
        slug: "life-panoramica",
        name: "Panorámica",
        tenantUuid: "10000000-0000-4000-8000-000000000001",
        territoryUuid: "10000000-0000-4000-8000-000000000002",
        hostHints: [],
        locale: "es",
        timezone: "Europe/Madrid",
      },
      branding: { name: "Panorámica" },
      features: featuresForPlan("community"),
      territories: [
        {
          id: "10000000-0000-4000-8000-000000000002",
          name: "Panorámica Golf",
          slug: "panoramica-golf",
        },
      ],
    });
    const valley = adoptConfiguredTenant({
      snapshot: pano.snapshot,
      identity: {
        slug: "life-valley",
        name: "Valley",
        tenantUuid: "20000000-0000-4000-8000-000000000001",
        territoryUuid: "20000000-0000-4000-8000-000000000002",
        hostHints: [],
        locale: "en",
        timezone: "UTC",
      },
      branding: { name: "Valley" },
      features: featuresForPlan("community"),
      territories: [
        {
          id: "20000000-0000-4000-8000-000000000002",
          name: "Valley",
          slug: "valley",
        },
      ],
    });
    const plane = emptyTenantDataPlane(valley.snapshot);
    plane.domain = [
      {
        entityType: "location",
        entityId: "loc-pano",
        tenantId: "10000000-0000-4000-8000-000000000001",
      },
      {
        entityType: "location",
        entityId: "loc-valley",
        tenantId: "20000000-0000-4000-8000-000000000001",
      },
    ];
    const panoExport = TenantDataExportService.exportTenant(
      plane,
      "10000000-0000-4000-8000-000000000001",
    );
    const valleyExport = TenantDataExportService.exportTenant(
      plane,
      "20000000-0000-4000-8000-000000000001",
    );
    assert.notEqual(panoExport.tenantId, valleyExport.tenantId);
    assert.equal(
      panoExport.domain.some((row) => row.entityId === "loc-valley"),
      false,
    );
    assert.equal(
      valleyExport.domain.some((row) => row.entityId === "loc-pano"),
      false,
    );
  });

  it("TEST 10 — no existe TenantClone", () => {
    assert.equal(isOpaqueTenantDataOpsEntity("TenantClone"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("GlobalBackupDatabase"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("UniversalDataSnapshot"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("CustomerSpecificMigration"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("PlatformContentCopy"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("TenantBackupContext"), false);
    assert.equal(dataOpsPlanDoesNotGrantPermissions(), true);
    const ready = projectDisasterRecoveryReadiness();
    assert.equal(ready.cloudProvider, "none");
    assert.equal(ready.objectives.rpoMinutes, 60);
    assert.equal(ready.objectives.rtoMinutes, 240);
    assert.equal(ready.scenarios.individual_tenant_restore.contractOnly, true);
    assert.equal(rejectClientAuthoritySpoof({ tenantId: "x" }), "tenantId");
    assert.equal(
      rejectClientAuthoritySpoof({ restoreTarget: "other" }),
      "restoreTarget",
    );
    assert.equal(
      rejectClientAuthoritySpoof({ exportScope: "all" }),
      "exportScope",
    );
    assert.equal(rejectClientAuthoritySpoof({ backupId: "b1" }), "backupId");
  });
});
