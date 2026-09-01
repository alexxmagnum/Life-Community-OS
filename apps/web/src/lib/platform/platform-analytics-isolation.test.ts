/**
 * Platform analytics isolation tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  analyticsIsNotTracking,
  canMutateSaasControlPlane,
  emptyCustomerOperationsPlane,
  emptyCustomerSuccessPlane,
  emptyTenantFactorySnapshot,
  isOpaqueAnalyticsEntity,
  privacyRespectedInAnalytics,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { PlatformAnalyticsRuntime } from "@/lib/platform/platform-analytics-service";
import {
  replaceCustomerOperationsStoreForTests,
  replaceCustomerSuccessStoreForTests,
} from "@/lib/platform/customer-operations-service";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
} from "@/lib/tenant/tenant-factory-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";

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

describe("Platform analytics isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
    replaceCustomerOperationsStoreForTests(emptyCustomerOperationsPlane());
    replaceCustomerSuccessStoreForTests(emptyCustomerSuccessPlane());
  });

  it("TEST 1 — platform analytics carga datos agregados", () => {
    TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    const overview = PlatformAnalyticsRuntime.overview(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
    );
    assert.equal(overview.tenantCount >= 1, true);
    assert.equal(typeof overview.featureAdoption.lifeMap, "number");
  });

  it("TEST 2 — Tenant aislado", () => {
    const luxury = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    const tenantB = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    });
    const a = PlatformAnalyticsRuntime.getTenant(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      luxury.tenantId,
    );
    const b = PlatformAnalyticsRuntime.getTenant(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      tenantB.tenantId,
    );
    assert.notEqual(a?.tenantId, b?.tenantId);
  });

  it("TEST 3 — Community Admin bloqueado", () => {
    assert.equal(canMutateSaasControlPlane(false), false);
    assert.throws(
      () =>
        PlatformAnalyticsRuntime.overview(
          actor({
            tenantSlug: "luxury-communities",
            role: "administrator",
            personId: "person-admin",
          }),
        ),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });

  it("TEST 4 — no existe UserTrackingEntity", () => {
    assert.equal(isOpaqueAnalyticsEntity("UserTrackingEntity"), true);
    assert.equal(isOpaqueAnalyticsEntity("PersonalBehaviorGraph"), true);
  });

  it("TEST 5 — no existe EngagementScore", () => {
    assert.equal(isOpaqueAnalyticsEntity("EngagementScore"), true);
    assert.equal(analyticsIsNotTracking(), true);
  });

  it("TEST 6 — feature adoption correcto", () => {
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const tenants = PlatformAnalyticsRuntime.listTenants(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
    );
    const row = tenants.find((item) => item.tenantId === created.tenantId);
    assert.equal(Array.isArray(row?.featureUsage.activeFeatures), true);
  });

  it("TEST 7 — capacity usage correcto", () => {
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const row = PlatformAnalyticsRuntime.getTenant(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      created.tenantId,
    );
    assert.equal(row?.capacity.usage.territories, 1);
    assert.equal(typeof row?.capacity.limits.territories, "number");
  });

  it("TEST 8 — privacy protegida", () => {
    assert.equal(privacyRespectedInAnalytics(), true);
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const row = PlatformAnalyticsRuntime.getTenant(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      created.tenantId,
    );
    assert.equal("messages" in (row ?? {}), false);
    assert.equal("personId" in (row ?? {}), false);
  });

  it("TEST 9 — Valley separado de Panorámica", () => {
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }, { name: "Valley" }],
      },
    });
    const pano = created.territories.find((row) => row.name === "Panorámica Golf")!;
    const valley = created.territories.find((row) => row.name === "Valley")!;
    assert.notEqual(pano.id, valley.id);
    const source = readFileSync(
      path.join(HERE, "platform-analytics-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 10 — cross tenant analytics bloqueado", () => {
    assert.throws(
      () =>
        PlatformAnalyticsRuntime.overview(
          actor({ tenantSlug: "tenant-b", role: "member" }),
        ),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });

  it("TEST 11 — analytics viewed audit", () => {
    TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    PlatformAnalyticsRuntime.overview(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
    );
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.analytics.viewed"),
      true,
    );
  });

  it("TEST 12 — report generated audit", () => {
    TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    PlatformAnalyticsRuntime.generateReport({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      kind: "tenant_overview",
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.report.generated"),
      true,
    );
  });

  it("TEST 13 — analytics exported audit", () => {
    TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    PlatformAnalyticsRuntime.exportReport({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      kind: "capacity_report",
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.analytics.exported"),
      true,
    );
  });

  it("TEST 14 — customer success insights available", () => {
    TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const insights = PlatformAnalyticsRuntime.customerSuccessInsights(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
    );
    assert.equal(Array.isArray(insights), true);
  });

  it("TEST 15 — member cannot access analytics", () => {
    assert.throws(
      () =>
        PlatformAnalyticsRuntime.listTenants(
          actor({ tenantSlug: "luxury-communities", role: "member" }),
        ),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });
});
