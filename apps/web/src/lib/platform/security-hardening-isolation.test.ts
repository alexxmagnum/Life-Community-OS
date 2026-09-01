/**
 * SaaS security hardening isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  CLIENT_CAPABILITY_SPOOF,
  CROSS_TENANT_ACCESS_DENIED,
  CROSS_TENANT_MEDIA_FORBIDDEN,
  PRIVILEGED_CONFIRMATION_REQUIRED,
  SAAS_CONTROL_PLANE_FORBIDDEN,
  TERRITORY_BOUNDARY_VIOLATION,
  createAdminAuditLog,
  emptyTenantDataPlane,
  emptyTenantFactorySnapshot,
  isOpaqueSecurityEntity,
  projectPrivacyControlContext,
  sanitizeAuditMetadata,
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
import { TenantLifecycleRuntime } from "@/lib/platform/tenant-lifecycle-service";
import {
  SecurityHardeningRuntime,
  denyClientAuthoritySpoof,
  requirePlatformSecurityOperator,
} from "@/lib/platform/security-hardening-service";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole;
  personId?: string;
  territoryId?: string;
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
    territoryId: input.territoryId,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: input.tenantSlug,
      role,
      territoryId: input.territoryId ?? null,
    },
  };
}

const operator = () =>
  actor({
    tenantSlug: "life-panoramica",
    personId: "person-platform",
  });

describe("SaaS security hardening isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
    replaceTenantDataOpsStoreForTests(emptyTenantDataPlane());
  });

  it("TEST 1 — Tenant A intenta leer Tenant B", () => {
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
    const other = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    });
    const memberA = actor({
      tenantSlug: luxury.tenantId,
      personId: "person-alex",
    });
    assert.throws(
      () =>
        SecurityHardeningRuntime.assertTenantRead({
          actor: memberA,
          resourceTenantId: other.tenantId,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === CROSS_TENANT_ACCESS_DENIED,
    );
    const events = PlatformOperationsRuntime.security();
    assert.equal(events.some((row) => row.kind === "cross_tenant"), true);
  });

  it("TEST 2 — Territory cruzado bloqueado", () => {
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
    const pano = luxury.territories.find((row) => row.name === "Panorámica Golf")!;
    const valley = luxury.territories.find((row) => row.name === "Valley")!;
    const member = actor({
      tenantSlug: luxury.tenantId,
      personId: "person-alex",
      territoryId: pano.id,
    });
    assert.throws(
      () =>
        SecurityHardeningRuntime.assertTerritory({
          actor: member,
          resourceTenantId: luxury.tenantId,
          resourceTerritoryId: valley.id,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === TERRITORY_BOUNDARY_VIOLATION,
    );
  });

  it("TEST 3 — Community Admin intenta Platform API", () => {
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
      tenantSlug: created.tenantId,
      role: "administrator",
      personId: "person-tenant-admin",
    });
    assert.throws(
      () => requirePlatformSecurityOperator(admin),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
    assert.throws(
      () =>
        TenantLifecycleRuntime.suspend({
          actor: admin,
          tenantId: created.tenantId,
        }),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });

  it("TEST 4 — Client capability spoof rechazado", () => {
    assert.throws(
      () =>
        denyClientAuthoritySpoof({
          personId: "person-alex",
          tenantId: "luxury-communities",
          spoof: { capability: "administrator" },
        }),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === CLIENT_CAPABILITY_SPOOF,
    );
    assert.throws(
      () =>
        TenantFactoryRuntime.provision({
          actor: operator(),
          request: {
            name: "Spoof Co",
            slug: "spoof-co",
            locale: "en",
            timezone: "UTC",
            territories: [{ name: "Home" }],
          },
          spoof: { capability: "administrator" },
        }),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === CLIENT_CAPABILITY_SPOOF,
    );
  });

  it("TEST 5 — Media cross-tenant bloqueado", () => {
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
    const other = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    });
    assert.throws(
      () =>
        SecurityHardeningRuntime.assertMedia(
          {
            mediaId: "m1",
            tenantId: luxury.tenantId,
            storageKey: `${luxury.tenantId}/m1/cover.png`,
          },
          other.tenantId,
        ),
      (error: unknown) =>
        error instanceof Error && error.message === CROSS_TENANT_MEDIA_FORBIDDEN,
    );
  });

  it("TEST 6 — Backup restore seguro", () => {
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
      media: [
        {
          mediaId: "m1",
          tenantId: luxury.tenantId,
          storageKey: `${luxury.tenantId}/m1/cover.png`,
        },
      ],
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
          explicitConfirmation: true,
        }),
      /cross_tenant_restore_forbidden/,
    );
    const restore = TenantDataOpsRuntime.restoreTenant({
      actor: operator(),
      tenantId: luxury.tenantId,
      backupId: backup?.backupId,
      explicitConfirmation: true,
    });
    assert.equal(restore?.status, "completed");
  });

  it("TEST 7 — Audit generado", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Audited",
        slug: "audited",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    TenantLifecycleRuntime.activate({
      actor: operator(),
      tenantId: created.tenantId,
    });
    TenantLifecycleRuntime.suspend({
      actor: operator(),
      tenantId: created.tenantId,
      reason: "ops",
    });
    TenantDataOpsRuntime.exportTenant({
      actor: operator(),
      tenantId: created.tenantId,
      reason: "ops",
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "security.admin.action"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "security.export.requested"),
      true,
    );
    const center = SecurityHardeningRuntime.center();
    assert.ok(center.auditSecurity.length >= 1);
  });

  it("TEST 8 — Secret metadata sanitizada", () => {
    const log = createAdminAuditLog({
      tenantId: "luxury-communities",
      actorPersonId: "person-platform",
      actorRole: "platform_operator",
      action: "security.admin.action",
      entityType: "security",
      entityId: "cfg",
      metadata: {
        password: "secret",
        token: "tok",
        cookie: "sid",
        api_key: "k",
        reason: "ops",
      },
    });
    assert.equal(log.metadata?.reason, "ops");
    assert.equal(log.metadata?.password, undefined);
    assert.equal(log.metadata?.token, undefined);
    const sanitized = sanitizeAuditMetadata({
      secret: "svc",
      action: "suspend",
    });
    assert.equal(sanitized?.secret, undefined);
    assert.equal(sanitized?.action, "suspend");
  });

  it("TEST 9 — Platform Operator permitido", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Allowed",
        slug: "allowed",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    assert.equal(
      SecurityHardeningRuntime.authorize({
        actor: operator(),
        action: "tenantLifecycle",
      }),
      "ALLOW",
    );
    assert.equal(requirePlatformSecurityOperator(operator()), "person-platform");
    TenantLifecycleRuntime.activate({
      actor: operator(),
      tenantId: created.tenantId,
    });
    TenantLifecycleRuntime.suspend({
      actor: operator(),
      tenantId: created.tenantId,
      reason: "ops",
    });
    assert.equal(
      TenantLifecycleRuntime.context(created.tenantId)?.status,
      "suspended",
    );
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
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
    const pano = luxury.territories.find((row) => row.name === "Panorámica Golf")!;
    const valley = luxury.territories.find((row) => row.name === "Valley")!;
    assert.equal(luxury.territories.length, 3);
    assert.notEqual(pano.id, valley.id);
    assert.equal(pano.tenantId, luxury.tenantId);
    assert.equal(valley.tenantId, luxury.tenantId);
    const valleyMember = actor({
      tenantSlug: luxury.tenantId,
      territoryId: valley.id,
    });
    assert.throws(
      () =>
        SecurityHardeningRuntime.assertTerritory({
          actor: valleyMember,
          resourceTenantId: luxury.tenantId,
          resourceTerritoryId: pano.id,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === TERRITORY_BOUNDARY_VIOLATION,
    );
  });

  it("TEST 11 — Privileged confirmation required", () => {
    assert.throws(
      () =>
        SecurityHardeningRuntime.confirmPrivileged("tenantSuspend", false),
      (error: unknown) =>
        error instanceof Error &&
        error.message === PRIVILEGED_CONFIRMATION_REQUIRED,
    );
    SecurityHardeningRuntime.confirmPrivileged("backupRestore", true);
    SecurityHardeningRuntime.confirmPrivileged("deleteConfiguration", true);
  });

  it("TEST 12 — Privacy contract only", () => {
    const privacy = projectPrivacyControlContext("luxury-communities");
    assert.equal(privacy.implemented, true);
    assert.equal(privacy.capabilities.exportPersonalData, true);
    assert.equal(privacy.capabilities.deleteAccount, true);
    assert.equal(privacy.capabilities.anonymizeIdentity, true);
    assert.equal(privacy.capabilities.retentionPolicies, true);
  });

  it("TEST 13 — Opaque entities absent and pipeline intact", () => {
    const source = readFileSync(
      path.join(HERE, "security-hardening-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueSecurityEntity("GlobalSecurityEntity"), true);
    assert.equal(isOpaqueSecurityEntity("UniversalPermissionEntity"), true);
    assert.equal(isOpaqueSecurityEntity("SecurityScore"), true);
    assert.equal(isOpaqueSecurityEntity("ComplianceScore"), true);
    assert.equal(isOpaqueSecurityEntity("GlobalBanSystem"), true);
    assert.equal(isOpaqueSecurityEntity("CrossTenantAdmin"), true);
    assert.equal(isOpaqueSecurityEntity("PlatformContentAccess"), true);
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.equal(
      SecurityHardeningRuntime.authorize({
        actor: actor({ tenantSlug: "luxury-communities" }),
        action: "experienceCreate",
      }),
      "ALLOW",
    );
    assert.equal(
      SecurityHardeningRuntime.authorize({
        actor: actor({ tenantSlug: "luxury-communities" }),
        action: "tenantSuspend",
      }),
      "DENY",
    );
  });
});
