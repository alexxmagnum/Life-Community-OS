/**
 * Platform Operations — SaaS control plane projection tests.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAPABILITIES } from "./capabilities";
import { resolveEffectivePermissions } from "./authorization";
import { createAdminAuditLog, sanitizeAuditMetadata } from "../domain/admin-audit-log";
import { canAccessAdminOperations, canMutateSaasControlPlane } from "../domain/admin-operations";
import {
  TenantFactoryService,
  adoptConfiguredTenant,
  canAccessPlatformAdmin,
  emptyTenantFactorySnapshot,
  featuresForPlan,
  tenantFeatureFlagsFromProduct,
} from "../tenant/factory";
import {
  billingPlanDoesNotGrantPermissions,
  communityAdminCannotMutateSaas,
  detectCrossTenantSecurityEvent,
  isOpaquePlatformOperationsEntity,
  limitsForPlan,
  projectFeatureUsage,
  projectPlatformAudit,
  projectPlatformOperationsContext,
  projectTenantHealth,
  projectTenantSubscription,
  provisioningStatusFromTenant,
} from "./operations";

describe("Platform Operations Context", () => {
  it("TEST 1 — Platform Admin creates a Tenant", () => {
    assert.equal(
      canAccessPlatformAdmin({
        personId: "person-platform",
        operators: [{ personId: "person-platform", status: "active" }],
      }),
      true,
    );
    const { result } = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    );
    assert.equal(result.territories.length, 1);
    assert.equal(provisioningStatusFromTenant(result.status), "created");
  });

  it("TEST 2 — Platform Admin creates a Territory", () => {
    const started = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    );
    const next = TenantFactoryService.addTerritory(started.snapshot, {
      tenantId: started.result.tenantId,
      name: "Ocean Hills",
    });
    const third = TenantFactoryService.addTerritory(next.snapshot, {
      tenantId: started.result.tenantId,
      name: "Valley",
    });
    assert.equal(
      third.snapshot.territories.filter(
        (row) => row.tenantId === started.result.tenantId,
      ).length,
      3,
    );
  });

  it("TEST 3 — Community Admin cannot create a Tenant", () => {
    assert.equal(canAccessAdminOperations("administrator"), true);
    assert.equal(canMutateSaasControlPlane(false), false);
    assert.equal(
      communityAdminCannotMutateSaas({
        role: "administrator",
        isPlatformOperator: false,
      }),
      true,
    );
    assert.equal(
      canAccessPlatformAdmin({
        personId: "person-tenant-admin",
        operators: [{ personId: "person-platform", status: "active" }],
      }),
      false,
    );
  });

  it("TEST 4 — Tenant isolation", () => {
    let store = emptyTenantFactorySnapshot();
    const first = TenantFactoryService.provision(store, {
      name: "Tenant B",
      slug: "tenant-b",
      locale: "en",
      timezone: "UTC",
      territories: [{ name: "B Norte" }],
    });
    const second = TenantFactoryService.provision(first.snapshot, {
      name: "Tenant C",
      slug: "tenant-c",
      locale: "en",
      timezone: "UTC",
      territories: [{ name: "C Sur" }],
    });
    const b = TenantFactoryService.configurationContext(
      second.snapshot,
      first.result.tenantId,
    );
    const c = TenantFactoryService.configurationContext(
      second.snapshot,
      second.result.tenantId,
    );
    assert.ok(b);
    assert.ok(c);
    assert.equal(
      b.territories.some((row) => row.id === c.territories[0]?.id),
      false,
    );
  });

  it("TEST 5 — Feature observability", () => {
    const started = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Premium One",
        slug: "premium-one",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "One" }],
      },
      { plan: "premium" },
    );
    const usage = projectFeatureUsage(started.snapshot);
    assert.equal(usage.marketplace, 1);
    assert.equal(usage.lifeMap, 1);
    assert.equal(usage.reservations, 1);
    assert.equal("FeatureScore" in usage, false);
  });

  it("TEST 6 — AuditLog records platform changes", () => {
    const entry = createAdminAuditLog({
      tenantId: "tenant-b",
      territoryId: "territory-1",
      actorPersonId: "person-platform",
      actorRole: "platform_operator",
      action: "platform.tenant.created",
      entityType: "tenant",
      entityId: "tenant-b",
      metadata: { token: "should-drop", slug: "tenant-b" },
    });
    assert.equal(entry.action, "platform.tenant.created");
    assert.equal(entry.territoryId, "territory-1");
    assert.equal(entry.metadata?.token, undefined);
    assert.equal(entry.metadata?.slug, "tenant-b");
    const projected = projectPlatformAudit(entry);
    assert.equal(projected.actor, "person-platform");
    assert.equal(sanitizeAuditMetadata({ password: "x", plan: "community" })?.password, undefined);
  });

  it("TEST 7 — Security event detects cross-tenant access", () => {
    const event = detectCrossTenantSecurityEvent({
      actorTenantId: "life-panoramica",
      requestedTenantId: "life-valley",
      actorPersonId: "person-alex",
    });
    assert.ok(event);
    assert.equal(event.kind, "cross_tenant");
    assert.equal(
      detectCrossTenantSecurityEvent({
        actorTenantId: "life-panoramica",
        requestedTenantId: "life-panoramica",
      }),
      null,
    );
  });

  it("TEST 8 — Billing plan is separate from permissions", () => {
    assert.equal(billingPlanDoesNotGrantPermissions(), true);
    const premium = featuresForPlan("premium");
    const granted = resolveEffectivePermissions({
      role: "member",
      features: tenantFeatureFlagsFromProduct(premium),
      productCapabilities: premium,
    });
    assert.equal(granted.includes(CAPABILITIES.manageEnter), false);
    assert.equal(limitsForPlan("enterprise").members, null);
    const once = TenantFactoryService.provision(emptyTenantFactorySnapshot(), {
      name: "Billed",
      slug: "billed",
      locale: "en",
      timezone: "UTC",
      territories: [{ name: "Home" }],
    });
    const subscription = projectTenantSubscription(
      once.snapshot,
      once.result.tenantId,
    );
    assert.equal(subscription?.billingProvider, "none");
    assert.equal(subscription?.plan, "community");
  });

  it("TEST 9 — Valley stays separated from Panorámica", () => {
    const pano = adoptConfiguredTenant({
      snapshot: emptyTenantFactorySnapshot(),
      identity: {
        slug: "life-panoramica",
        name: "Panorámica",
        tenantUuid: "10000000-0000-4000-8000-000000000001",
        territoryUuid: "10000000-0000-4000-8000-000000000002",
        hostHints: [],
        locale: "en",
        timezone: "UTC",
      },
      branding: { name: "Panorámica" },
      features: featuresForPlan("premium"),
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
    const healthPano = projectTenantHealth(
      valley.snapshot,
      valley.snapshot.tenants.find((row) => row.slug === "life-panoramica")!,
    );
    const healthValley = projectTenantHealth(
      valley.snapshot,
      valley.snapshot.tenants.find((row) => row.slug === "life-valley")!,
    );
    assert.equal(healthPano.territories[0]?.id, healthPano.territories[0]?.id);
    assert.notEqual(healthPano.tenantId, healthValley.tenantId);
    assert.equal(
      healthPano.territories.some(
        (row) => row.id === healthValley.territories[0]?.id,
      ),
      false,
    );
  });

  it("TEST 10 — no GlobalCommunityEntity exists", () => {
    assert.equal(isOpaquePlatformOperationsEntity("GlobalCommunityEntity"), true);
    assert.equal(isOpaquePlatformOperationsEntity("FeatureScore"), true);
    assert.equal(isOpaquePlatformOperationsEntity("UserRanking"), true);
    const { snapshot, result } = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Tenant C",
        slug: "tenant-c",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "C Sur" }],
      },
    );
    const context = projectPlatformOperationsContext({
      snapshot,
      audit: [],
      securityEvents: [],
    });
    assert.equal(context.tenantsCount, 1);
    assert.equal("users" in context, false);
    assert.equal("content" in context, false);
    const health = projectTenantHealth(
      snapshot,
      snapshot.tenants[0]!,
    );
    assert.equal(health.tenantId, result.tenantId);
    assert.equal("residents" in health, false);
  });
});
