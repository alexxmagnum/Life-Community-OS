/**
 * Customer Success isolation tests.
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
  emptyCustomerOperationsPlane,
  emptyCustomerSuccessPlane,
  emptyTenantFactorySnapshot,
  isOpaqueCustomerSuccessEntity,
  personalDataExcludedFromSuccess,
  successDoesNotMeasureEngagement,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  CustomerOperationsRuntime,
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

describe("Customer Success isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
    replaceCustomerOperationsStoreForTests(emptyCustomerOperationsPlane());
    replaceCustomerSuccessStoreForTests(emptyCustomerSuccessPlane());
  });

  it("TEST 1 — customer health correcto", () => {
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
        branding: { name: "Luxury", primaryColor: "#0055aa" },
      },
    });
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    CustomerOperationsRuntime.initialize({
      actor: platform,
      tenantId: created.tenantId,
      companyName: "Luxury Communities Inc",
      contact: { name: "Ana", email: "ana@luxury.example" },
      plan: "community",
    });
    const health = CustomerOperationsRuntime.resolveCustomerHealth(
      platform,
      created.tenantId,
    );
    assert.equal(health?.health.status, "attention_required");
    assert.equal(typeof health?.onboardingProgress.completedCount, "number");
  });

  it("TEST 2 — onboarding checklist funciona", () => {
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
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    CustomerOperationsRuntime.initialize({
      actor: platform,
      tenantId: created.tenantId,
      companyName: "Luxury",
      contact: { name: "Ana", email: "a@example.com" },
      plan: "community",
    });
    const checklist = CustomerOperationsRuntime.getOnboardingStatus(
      platform,
      created.tenantId,
    );
    assert.equal(checklist?.items.length, 8);
    assert.equal(checklist?.items[0]?.key, "tenant_created");
  });

  it("TEST 3 — Platform Operator accede", () => {
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
    const list = CustomerOperationsRuntime.listSuccess(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
    );
    assert.equal(list.some((row) => row.tenantId === created.tenantId), true);
  });

  it("TEST 4 — Community Admin bloqueado", () => {
    assert.equal(canMutateSaasControlPlane(false), false);
    assert.throws(
      () =>
        CustomerOperationsRuntime.listSuccess(
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

  it("TEST 5 — Tenant aislado", () => {
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
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    const healthA = CustomerOperationsRuntime.resolveCustomerHealth(
      platform,
      luxury.tenantId,
    );
    const healthB = CustomerOperationsRuntime.resolveCustomerHealth(
      platform,
      tenantB.tenantId,
    );
    assert.notEqual(healthA?.tenantId, healthB?.tenantId);
  });

  it("TEST 6 — alertas operativas funcionan", () => {
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
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    const alert = CustomerOperationsRuntime.createAlert({
      actor: platform,
      tenantId: created.tenantId,
      type: "backup_issue",
      summary: "Backup pendiente",
    });
    assert.equal(alert.status, "open");
    const alerts = CustomerOperationsRuntime.resolveOperationalAlerts(
      platform,
      created.tenantId,
    );
    assert.equal(alerts.some((row) => row.type === "backup_issue"), true);
  });

  it("TEST 7 — no existe engagement score", () => {
    assert.equal(successDoesNotMeasureEngagement(), true);
    assert.equal(isOpaqueCustomerSuccessEntity("CommunityEngagementScore"), true);
  });

  it("TEST 8 — no existe usuario ranking", () => {
    assert.equal(isOpaqueCustomerSuccessEntity("UserRanking"), true);
    assert.equal(isOpaqueCustomerSuccessEntity("PlatformSocialAnalytics"), true);
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
      path.join(HERE, "customer-operations-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 10 — datos personales protegidos", () => {
    assert.equal(personalDataExcludedFromSuccess(), true);
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
    const ctx = CustomerOperationsRuntime.resolveCustomerHealth(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      created.tenantId,
    );
    assert.equal("messages" in (ctx ?? {}), false);
    assert.equal("activity" in (ctx ?? {}), false);
  });

  it("TEST 11 — support note audit", () => {
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
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    CustomerOperationsRuntime.createSupportNote({
      actor: platform,
      tenantId: created.tenantId,
      summary: "Falta configurar branding",
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.customer.support.created"),
      true,
    );
  });

  it("TEST 12 — health viewed audit", () => {
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
    CustomerOperationsRuntime.resolveCustomerHealth(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      created.tenantId,
    );
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.customer.health.viewed"),
      true,
    );
  });

  it("TEST 13 — checklist update audit", () => {
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
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    CustomerOperationsRuntime.completeChecklist({
      actor: platform,
      tenantId: created.tenantId,
      key: "locations_available",
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.customer.onboarding.updated"),
      true,
    );
  });

  it("TEST 14 — alert resolved audit", () => {
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
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    const alert = CustomerOperationsRuntime.createAlert({
      actor: platform,
      tenantId: created.tenantId,
      type: "integration_failure",
      summary: "Error de sincronización",
    });
    CustomerOperationsRuntime.resolveAlert({
      actor: platform,
      tenantId: created.tenantId,
      alertId: alert.id,
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.customer.alert.resolved"),
      true,
    );
  });

  it("TEST 15 — member cannot access customer success", () => {
    assert.throws(
      () =>
        CustomerOperationsRuntime.resolveCustomerHealth(
          actor({ tenantSlug: "luxury-communities", role: "member" }),
          "luxury-communities",
        ),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });
});
