/**
 * Tenant Data Operations isolation — export, backup, restore.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canMutateSaasControlPlane,
  emptyTenantDataPlane,
  emptyTenantFactorySnapshot,
  isOpaqueTenantDataOpsEntity,
  mediaOwnedByTenant,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
} from "@/lib/tenant/tenant-factory-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";
import {
  TenantDataOpsRuntime,
  replaceTenantDataOpsStoreForTests,
  seedTenantDataOpsForTests,
} from "@/lib/platform/tenant-data-ops-service";

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
    tenantSlug: "life-panoramica",
    personId: "person-platform",
  });

describe("Tenant Data Operations isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
    replaceTenantDataOpsStoreForTests(emptyTenantDataPlane());
  });

  it("TEST 1 — export tenant correcto", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    seedTenantDataOpsForTests({
      memberships: [
        {
          personId: "person-alex",
          tenantId: created.tenantId,
          role: "member",
        },
      ],
      domain: [
        {
          entityType: "location",
          entityId: "loc-pano",
          tenantId: created.tenantId,
        },
      ],
      media: [
        {
          mediaId: "media-pano",
          tenantId: created.tenantId,
          storageKey: `${created.tenantId}/media-pano/cover.webp`,
        },
      ],
    });
    const exported = TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: created.tenantId,
    });
    assert.equal(exported.tenantId, created.tenantId);
    assert.equal(exported.territories.length, 1);
    assert.equal(exported.domain.length, 1);
    assert.equal(exported.media.length, 1);
  });

  it("TEST 2 — export no incluye otro tenant", () => {
    const luxury = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    const tenantB = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    });
    seedTenantDataOpsForTests({
      domain: [
        {
          entityType: "location",
          entityId: "loc-a",
          tenantId: luxury.tenantId,
        },
        {
          entityType: "location",
          entityId: "loc-b",
          tenantId: tenantB.tenantId,
        },
      ],
      media: [
        {
          mediaId: "media-a",
          tenantId: luxury.tenantId,
          storageKey: `${luxury.tenantId}/media-a/a.webp`,
        },
        {
          mediaId: "media-b",
          tenantId: tenantB.tenantId,
          storageKey: `${tenantB.tenantId}/media-b/b.webp`,
        },
      ],
    });
    const exported = TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: luxury.tenantId,
    });
    assert.equal(
      exported.domain.some((row) => row.tenantId === tenantB.tenantId),
      false,
    );
    assert.equal(
      exported.media.some((row) => row.tenantId === tenantB.tenantId),
      false,
    );
  });

  it("TEST 3 — backup tenant aislado", () => {
    const luxury = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [
          { name: "Panorámica Golf" },
          { name: "Ocean Hills" },
          { name: "Valley" },
        ],
      },
    });
    const tenantB = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    });
    seedTenantDataOpsForTests({
      domain: [
        {
          entityType: "location",
          entityId: "loc-a",
          tenantId: luxury.tenantId,
        },
        {
          entityType: "location",
          entityId: "loc-b",
          tenantId: tenantB.tenantId,
        },
      ],
    });
    const backup = TenantDataOpsRuntime.createBackup({
      actor: operator(),
      tenantId: luxury.tenantId,
      type: "manual",
    });
    assert.equal(backup?.tenantId, luxury.tenantId);
    assert.equal(backup?.status, "completed");
    const exported = TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: luxury.tenantId,
    });
    assert.equal(exported.territories.length, 3);
    assert.equal(
      exported.domain.some((row) => row.tenantId === tenantB.tenantId),
      false,
    );
  });

  it("TEST 4 — restore tenant correcto", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Ready",
        slug: "ready",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    seedTenantDataOpsForTests({
      domain: [
        {
          entityType: "location",
          entityId: "loc-keep",
          tenantId: created.tenantId,
        },
      ],
    });
    const backup = TenantDataOpsRuntime.createBackup({
      actor: operator(),
      tenantId: created.tenantId,
    });
    seedTenantDataOpsForTests({ domain: [] });
    const restore = TenantDataOpsRuntime.restoreTenant({
      actor: operator(),
      tenantId: created.tenantId,
      backupId: backup?.backupId,
    });
    assert.equal(restore?.status, "completed");
    const exported = TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: created.tenantId,
    });
    assert.equal(
      exported.domain.some((row) => row.entityId === "loc-keep"),
      true,
    );
  });

  it("TEST 5 — restore tenant incorrecto rechazado", () => {
    const luxury = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    const tenantB = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    });
    const backup = TenantDataOpsRuntime.createBackup({
      actor: operator(),
      tenantId: luxury.tenantId,
    });
    assert.throws(
      () =>
        TenantDataOpsRuntime.restoreTenant({
          actor: operator(),
          tenantId: tenantB.tenantId,
          backupId: backup?.backupId,
        }),
      /cross_tenant_restore_forbidden/,
    );
    assert.throws(
      () =>
        TenantDataOpsRuntime.exportTenant({
          actor: operator(),
          tenantId: luxury.tenantId,
          spoof: { restoreTarget: tenantB.tenantId },
        }),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });

  it("TEST 6 — media ownership validado", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Media Co",
        slug: "media-co",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const owned = {
      mediaId: "m1",
      tenantId: created.tenantId,
      storageKey: `${created.tenantId}/m1/file.png`,
    };
    assert.equal(mediaOwnedByTenant(owned, created.tenantId), true);
    assert.equal(
      mediaOwnedByTenant(
        { ...owned, storageKey: "other-tenant/m1/file.png" },
        created.tenantId,
      ),
      false,
    );
    seedTenantDataOpsForTests({ media: [owned] });
    const exported = TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: created.tenantId,
    });
    assert.equal(exported.media[0]?.storageKey.startsWith(`${created.tenantId}/`), true);
  });

  it("TEST 7 — audit generado", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Audit Co",
        slug: "audit-co",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: created.tenantId,
      reason: "ops",
    });
    TenantDataOpsRuntime.createBackup({
      actor: operator(),
      tenantId: created.tenantId,
    });
    TenantDataOpsRuntime.restoreTenant({
      actor: operator(),
      tenantId: created.tenantId,
      explicitConfirmation: true,
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.export.started"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "platform.export.completed"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "platform.backup.created"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "platform.backup.restored"),
      true,
    );
    assert.equal(logs.some((row) => "token" in (row.metadata ?? {})), false);
    assert.equal(logs.some((row) => "password" in (row.metadata ?? {})), false);
  });

  it("TEST 8 — Community Admin sin acceso", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Locked",
        slug: "locked",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const admin = actor({
      tenantSlug: "locked",
      role: "administrator",
      personId: "person-tenant-admin",
    });
    assert.equal(canMutateSaasControlPlane(false), false);
    assert.throws(
      () =>
        TenantDataOpsRuntime.exportTenant({
          actor: admin,
          tenantId: created.tenantId,
        }),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
    assert.throws(
      () =>
        TenantDataOpsRuntime.createBackup({
          actor: admin,
          tenantId: created.tenantId,
        }),
      (error: unknown) => error instanceof TenantFactoryDeniedError,
    );
    assert.throws(
      () =>
        TenantDataOpsRuntime.restoreTenant({
          actor: admin,
          tenantId: created.tenantId,
        }),
      (error: unknown) => error instanceof TenantFactoryDeniedError,
    );
  });

  it("TEST 9 — Valley separado de Panorámica", () => {
    const luxury = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [
          { name: "Panorámica Golf" },
          { name: "Ocean Hills" },
          { name: "Valley" },
        ],
      },
    });
    const tenantB = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    });
    seedTenantDataOpsForTests({
      domain: [
        {
          entityType: "location",
          entityId: "loc-valley",
          tenantId: luxury.tenantId,
          territoryId: luxury.territories.find((row) =>
            row.name.toLowerCase().includes("valley"),
          )?.id,
        },
        {
          entityType: "location",
          entityId: "loc-b",
          tenantId: tenantB.tenantId,
        },
      ],
    });
    const luxuryExport = TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: luxury.tenantId,
    });
    const bExport = TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: tenantB.tenantId,
    });
    assert.notEqual(luxuryExport.tenantId, bExport.tenantId);
    assert.equal(luxuryExport.territories.length, 3);
    assert.equal(
      luxuryExport.domain.some((row) => row.entityId === "loc-b"),
      false,
    );
    assert.equal(
      bExport.domain.some((row) => row.entityId === "loc-valley"),
      false,
    );
  });

  it("TEST 10 — no existe TenantClone", () => {
    assert.equal(isOpaqueTenantDataOpsEntity("TenantClone"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("GlobalBackupDatabase"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("UniversalDataSnapshot"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("CustomerSpecificMigration"), true);
    assert.equal(isOpaqueTenantDataOpsEntity("PlatformContentCopy"), true);
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Origin",
        slug: "origin",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const other = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Other",
        slug: "other",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Else" }],
      },
    });
    const backup = TenantDataOpsRuntime.createBackup({
      actor: operator(),
      tenantId: created.tenantId,
    });
    assert.throws(
      () =>
        TenantDataOpsRuntime.restoreTenant({
          actor: operator(),
          tenantId: other.tenantId,
          backupId: backup?.backupId,
        }),
      /cross_tenant_restore_forbidden/,
    );
  });
});
