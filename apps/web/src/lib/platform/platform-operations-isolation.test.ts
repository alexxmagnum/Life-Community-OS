/**
 * Platform Operations isolation — SaaS control plane.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  CAPABILITIES,
  billingPlanDoesNotGrantPermissions,
  canAccessAdminOperations,
  canAccessPlatformAdmin,
  canMutateSaasControlPlane,
  emptyTenantFactorySnapshot,
  featuresForPlan,
  isOpaquePlatformOperationsEntity,
  resolveEffectivePermissions,
  tenantFeatureFlagsFromProduct,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
} from "@/lib/tenant/tenant-factory-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";
import { recordCrossTenantDenied } from "@/lib/platform/platform-operations-store";

const HERE = path.dirname(fileURLToPath(import.meta.url));

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

describe("Platform Operations isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
  });

  it("TEST 1 — Platform Admin creates Tenant", () => {
    const result = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "B Norte" }],
      },
    });
    assert.equal(result.status, "provisioned");
    assert.equal(PlatformOperationsRuntime.context().tenantsCount, 1);
  });

  it("TEST 2 — Platform Admin creates Territory", () => {
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
    TenantFactoryRuntime.addTerritory({
      actor: operator(),
      territory: { tenantId: created.tenantId, name: "Ocean Hills" },
    });
    TenantFactoryRuntime.addTerritory({
      actor: operator(),
      territory: { tenantId: created.tenantId, name: "Valley" },
    });
    assert.equal(PlatformOperationsRuntime.territories().length, 3);
  });

  it("TEST 3 — Community Admin cannot create Tenant", () => {
    const tenantAdmin = actor({
      tenantSlug: "life-panoramica",
      role: "administrator",
      personId: "person-tenant-admin",
    });
    assert.equal(canAccessAdminOperations("administrator"), true);
    assert.equal(canMutateSaasControlPlane(false), false);
    assert.equal(
      canAccessPlatformAdmin({
        personId: tenantAdmin.personId,
        operators: TenantFactoryRuntime.snapshot().operators,
      }),
      false,
    );
    assert.throws(
      () =>
        TenantFactoryRuntime.provision({
          actor: tenantAdmin,
          request: {
            name: "No",
            slug: "no",
            locale: "en",
            timezone: "UTC",
            territories: [{ name: "No" }],
          },
        }),
      (error: unknown) => error instanceof TenantFactoryDeniedError,
    );
  });

  it("TEST 4 — Tenant isolation", () => {
    const first = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "B Norte" }],
      },
    });
    const second = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant C",
        slug: "tenant-c",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "C Sur" }],
      },
    });
    const b = TenantFactoryRuntime.configuration(first.tenantId);
    const c = TenantFactoryRuntime.configuration(second.tenantId);
    assert.ok(b);
    assert.ok(c);
    assert.equal(
      b.territories.some((row) => row.id === c.territories[0]?.id),
      false,
    );
  });

  it("TEST 5 — Feature observability", () => {
    TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Premium One",
        slug: "premium-one",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "One" }],
      },
      plan: "premium",
    });
    const usage = PlatformOperationsRuntime.context().featuresUsage;
    assert.equal(usage.marketplace >= 1, true);
    assert.equal(usage.lifeMap, 1);
    assert.equal(usage.reservations, 1);
  });

  it("TEST 6 — AuditLog records changes", () => {
    const result = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Audited",
        slug: "audited",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(logs.some((row) => row.action === "platform.tenant.created"), true);
    assert.equal(logs[0]?.tenantId, result.tenantId);
    assert.equal(logs.some((row) => "token" in (row.metadata ?? {})), false);
  });

  it("TEST 7 — Security event cross-tenant detected", () => {
    assert.throws(
      () =>
        TenantFactoryRuntime.provision({
          actor: operator(),
          spoof: { tenantId: "life-valley" },
          request: {
            name: "Spoof",
            slug: "spoof",
            locale: "en",
            timezone: "UTC",
            territories: [{ name: "Spoof" }],
          },
        }),
      (error: unknown) => error instanceof TenantFactoryDeniedError,
    );
    const denied = resolveReadTenantId({
      request: new Request("http://example.test/api/locations?tenantId=life-valley", {
        headers: { "x-tenant-slug": "life-valley" },
      }),
      queryTenantId: "life-valley",
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-alex" }),
    });
    assert.equal("error" in denied, true);
    recordCrossTenantDenied({
      actorTenantId: "life-panoramica",
      requestedTenantId: "life-valley",
      actorPersonId: "person-alex",
    });
    const events = PlatformOperationsRuntime.security();
    assert.equal(events.some((row) => row.kind === "cross_tenant"), true);
  });

  it("TEST 8 — Billing plan separated from permissions", () => {
    assert.equal(billingPlanDoesNotGrantPermissions(), true);
    const premium = featuresForPlan("premium");
    const granted = resolveEffectivePermissions({
      role: "member",
      features: tenantFeatureFlagsFromProduct(premium),
      productCapabilities: premium,
    });
    assert.equal(granted.includes(CAPABILITIES.manageEnter), false);
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Billed",
        slug: "billed",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const sub = PlatformOperationsRuntime.subscription(created.tenantId);
    assert.equal(sub?.billingProvider, "none");
  });

  it("TEST 9 — Valley separated from Panorámica", () => {
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
    const other = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant C",
        slug: "tenant-c",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "C Sur" }],
      },
    });
    const luxuryHealth = PlatformOperationsRuntime.health(luxury.tenantId);
    const otherHealth = PlatformOperationsRuntime.health(other.tenantId);
    assert.ok(luxuryHealth);
    assert.ok(otherHealth);
    assert.equal(luxuryHealth.territories.length, 3);
    assert.equal(
      luxuryHealth.territories.some(
        (row) => row.id === otherHealth.territories[0]?.id,
      ),
      false,
    );
  });

  it("TEST 10 — no GlobalCommunityEntity", () => {
    const source = readFileSync(
      path.join(HERE, "platform-operations-service.ts"),
      "utf8",
    );
    assert.equal(isOpaquePlatformOperationsEntity("GlobalCommunityEntity"), true);
    assert.equal(/export type GlobalCommunityEntity/.test(source), false);
    assert.equal(/export type UserRanking/.test(source), false);
    const context = PlatformOperationsRuntime.context();
    assert.equal("users" in context, false);
    assert.equal("content" in context, false);
  });
});
