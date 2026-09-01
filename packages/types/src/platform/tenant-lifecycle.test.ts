/**
 * Tenant Lifecycle contract tests — SaaS maturity.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAPABILITIES } from "./capabilities";
import { resolveEffectivePermissions } from "./authorization";
import { createAdminAuditLog, sanitizeAuditMetadata } from "../domain/admin-audit-log";
import { canMutateSaasControlPlane, SAAS_CONTROL_PLANE_FORBIDDEN } from "../domain/admin-operations";
import {
  TenantFactoryService,
  adoptConfiguredTenant,
  canAccessPlatformAdmin,
  emptyTenantFactorySnapshot,
  featuresForPlan,
  rejectClientAuthoritySpoof,
  tenantFeatureFlagsFromProduct,
} from "../tenant/factory";
import {
  TenantLifecycleService,
  canTransitionLifecycle,
  isOpaqueTenantLifecycleEntity,
  lifecycleStatusFromTenant,
  productLimitsDoNotGrantPermissions,
  productLimitsForPlan,
  projectTenantLifecycleContext,
  projectTenantSaaSContract,
  saasPlanDoesNotGrantPermissions,
} from "./tenant-lifecycle";

describe("Tenant Lifecycle", () => {
  it("TEST 1 — create tenant lifecycle", () => {
    const { snapshot, result } = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North Ridge" }],
      },
    );
    const life = projectTenantLifecycleContext(snapshot, result.tenantId);
    assert.equal(life?.status, "draft");
    assert.equal(lifecycleStatusFromTenant(result.status), "draft");
    assert.equal(life?.dataPreserved, true);
    const contract = projectTenantSaaSContract(snapshot, result.tenantId);
    assert.equal(contract?.plan, "community");
    assert.equal(contract?.limits.territories, 1);
    assert.equal(snapshot.subscriptionStatusByTenant?.[result.tenantId], "trial");
  });

  it("TEST 2 — activate tenant", () => {
    const started = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Ready One",
        slug: "ready-one",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    );
    const active = TenantLifecycleService.activateTenant(
      started.snapshot,
      started.result.tenantId,
    );
    assert.equal(
      projectTenantLifecycleContext(active, started.result.tenantId)?.status,
      "active",
    );
    assert.equal(
      active.subscriptionStatusByTenant?.[started.result.tenantId],
      "active",
    );
  });

  it("TEST 3 — suspend tenant", () => {
    const started = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Hold",
        slug: "hold",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    );
    const active = TenantLifecycleService.activateTenant(
      started.snapshot,
      started.result.tenantId,
    );
    const suspended = TenantLifecycleService.suspendTenant(
      active,
      started.result.tenantId,
    );
    const life = projectTenantLifecycleContext(suspended, started.result.tenantId);
    assert.equal(life?.status, "suspended");
    assert.equal(life?.authBlocked, true);
    assert.equal(life?.mutationsBlocked, true);
    assert.equal(life?.dataPreserved, true);
    assert.equal(suspended.tenants.length, 1);
    assert.equal(suspended.territories.length, 1);
  });

  it("TEST 4 — restore tenant", () => {
    const started = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Back",
        slug: "back",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    );
    const active = TenantLifecycleService.activateTenant(
      started.snapshot,
      started.result.tenantId,
    );
    const suspended = TenantLifecycleService.suspendTenant(
      active,
      started.result.tenantId,
    );
    const restored = TenantLifecycleService.restoreTenant(
      suspended,
      started.result.tenantId,
    );
    assert.equal(
      projectTenantLifecycleContext(restored, started.result.tenantId)?.status,
      "active",
    );
  });

  it("TEST 5 — archive tenant", () => {
    const started = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Done",
        slug: "done",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    );
    const active = TenantLifecycleService.activateTenant(
      started.snapshot,
      started.result.tenantId,
    );
    const suspended = TenantLifecycleService.suspendTenant(
      active,
      started.result.tenantId,
    );
    const archived = TenantLifecycleService.archiveTenant(
      suspended,
      started.result.tenantId,
    );
    assert.equal(
      projectTenantLifecycleContext(archived, started.result.tenantId)?.status,
      "archived",
    );
    assert.equal(
      archived.subscriptionStatusByTenant?.[started.result.tenantId],
      "cancelled",
    );
    assert.equal(canTransitionLifecycle("archived", "active"), false);
    assert.equal(
      canTransitionLifecycle("archived", "active", { explicitRestore: true }),
      true,
    );
    const revived = TenantLifecycleService.restoreTenant(
      archived,
      started.result.tenantId,
    );
    assert.equal(
      projectTenantLifecycleContext(revived, started.result.tenantId)?.status,
      "active",
    );
  });

  it("TEST 6 — Community Admin blocked", () => {
    assert.equal(canMutateSaasControlPlane(false), false);
    assert.equal(SAAS_CONTROL_PLANE_FORBIDDEN, "saas_control_plane_forbidden");
    assert.equal(
      canAccessPlatformAdmin({
        personId: "person-tenant-admin",
        operators: [{ personId: "person-platform", status: "active" }],
      }),
      false,
    );
  });

  it("TEST 7 — plan separated from permissions", () => {
    assert.equal(saasPlanDoesNotGrantPermissions(), true);
    const premium = featuresForPlan("premium");
    const granted = resolveEffectivePermissions({
      role: "member",
      features: tenantFeatureFlagsFromProduct(premium),
      productCapabilities: premium,
    });
    assert.equal(granted.includes(CAPABILITIES.manageEnter), false);
  });

  it("TEST 8 — limits separated from AuthZ", () => {
    assert.equal(productLimitsDoNotGrantPermissions(), true);
    assert.equal(productLimitsForPlan("community").territories, 1);
    assert.equal(productLimitsForPlan("enterprise").territories, null);
    assert.equal(productLimitsForPlan("enterprise").members, null);
  });

  it("TEST 9 — audit complete", () => {
    const actions = [
      "platform.tenant.activated",
      "platform.tenant.suspended",
      "platform.tenant.restored",
      "platform.tenant.archived",
      "platform.contract.changed",
      "platform.limit.changed",
    ] as const;
    for (const action of actions) {
      const entry = createAdminAuditLog({
        tenantId: "tenant-b",
        actorPersonId: "person-platform",
        actorRole: "platform_operator",
        action,
        entityType: "tenant",
        entityId: "tenant-b",
        metadata: { token: "drop-me", reason: "ops" },
      });
      assert.equal(entry.action, action);
      assert.equal(entry.metadata?.token, undefined);
      assert.equal(entry.metadata?.reason, "ops");
    }
    assert.equal(
      sanitizeAuditMetadata({ password: "x", reason: "ops" })?.password,
      undefined,
    );
  });

  it("TEST 10 — Valley stays separated from Panorámica", () => {
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
    const lifePano = projectTenantLifecycleContext(
      valley.snapshot,
      "10000000-0000-4000-8000-000000000001",
    );
    const lifeValley = projectTenantLifecycleContext(
      valley.snapshot,
      "20000000-0000-4000-8000-000000000001",
    );
    assert.notEqual(lifePano?.tenantId, lifeValley?.tenantId);
    const contractPano = projectTenantSaaSContract(
      valley.snapshot,
      lifePano!.tenantId,
    );
    const contractValley = projectTenantSaaSContract(
      valley.snapshot,
      lifeValley!.tenantId,
    );
    assert.notEqual(contractPano?.tenantId, contractValley?.tenantId);
    assert.equal(isOpaqueTenantLifecycleEntity("GlobalCommunityManager"), true);
    assert.equal(isOpaqueTenantLifecycleEntity("TenantOverrideLogic"), true);
    assert.equal(rejectClientAuthoritySpoof({ status: "active" }), "status");
    assert.equal(rejectClientAuthoritySpoof({ limits: {} }), "limits");
    assert.equal(rejectClientAuthoritySpoof({ permissions: [] }), "permissions");
  });
});
