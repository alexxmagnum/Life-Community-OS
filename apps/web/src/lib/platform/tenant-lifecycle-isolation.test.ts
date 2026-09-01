/**
 * Tenant Lifecycle isolation — SaaS maturity.
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
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canMutateSaasControlPlane,
  emptyTenantFactorySnapshot,
  featuresForPlan,
  isOpaqueTenantLifecycleEntity,
  productLimitsDoNotGrantPermissions,
  resolveEffectivePermissions,
  saasPlanDoesNotGrantPermissions,
  tenantFeatureFlagsFromProduct,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import { mutationDenial } from "@/lib/auth/mutation-gate";
import type { RequestActor } from "@/lib/auth/request-actor";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
} from "@/lib/tenant/tenant-factory-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";
import {
  TenantLifecycleRuntime,
  communityTenantBlocksMutations,
} from "@/lib/platform/tenant-lifecycle-service";

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

describe("Tenant Lifecycle isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
  });

  it("TEST 1 — create tenant lifecycle", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "B Norte" }],
      },
    });
    const life = TenantLifecycleRuntime.context(created.tenantId);
    assert.equal(life?.status, "draft");
    assert.equal(life?.dataPreserved, true);
  });

  it("TEST 2 — activate tenant", () => {
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
    const life = TenantLifecycleRuntime.activate({
      actor: operator(),
      tenantId: created.tenantId,
    });
    assert.equal(life?.status, "active");
  });

  it("TEST 3 — suspend tenant", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Hold",
        slug: "life-panoramica",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    TenantLifecycleRuntime.activate({
      actor: operator(),
      tenantId: created.tenantId,
    });
    const life = TenantLifecycleRuntime.suspend({
      actor: operator(),
      tenantId: created.tenantId,
      reason: "ops",
    });
    assert.equal(life?.status, "suspended");
    assert.equal(life?.authBlocked, true);
    assert.equal(communityTenantBlocksMutations("life-panoramica"), true);
    const member = actor({
      tenantSlug: "life-panoramica",
      personId: "person-member",
    });
    assert.equal(mutationDenial(member)?.error, "tenant_suspended");
    const denied = resolveReadTenantId({
      request: new Request("http://example.test/api/locations", {
        headers: { "x-tenant-slug": "life-panoramica" },
      }),
      queryTenantId: "life-panoramica",
      actor: member,
    });
    assert.equal("error" in denied, true);
  });

  it("TEST 4 — restore tenant", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Back",
        slug: "back",
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
    });
    const life = TenantLifecycleRuntime.restore({
      actor: operator(),
      tenantId: created.tenantId,
    });
    assert.equal(life?.status, "active");
    assert.equal(communityTenantBlocksMutations("back"), false);
  });

  it("TEST 5 — archive tenant", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Done",
        slug: "done",
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
    });
    const life = TenantLifecycleRuntime.archive({
      actor: operator(),
      tenantId: created.tenantId,
    });
    assert.equal(life?.status, "archived");
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.tenant.archived"),
      true,
    );
  });

  it("TEST 6 — Community Admin blocked", () => {
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
        TenantLifecycleRuntime.suspend({
          actor: admin,
          tenantId: created.tenantId,
        }),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
    assert.throws(
      () =>
        TenantLifecycleRuntime.setPlan({
          actor: admin,
          tenantId: created.tenantId,
          plan: "enterprise",
        }),
      (error: unknown) => error instanceof TenantFactoryDeniedError,
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
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Limited",
        slug: "limited",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const contract = TenantLifecycleRuntime.contracts().find(
      (row) => row.tenantId === created.tenantId,
    );
    assert.equal(contract?.limits.territories, 1);
    const granted = resolveEffectivePermissions({
      role: "member",
      features: tenantFeatureFlagsFromProduct(contract!.features),
      productCapabilities: contract!.features,
    });
    assert.equal(granted.includes(CAPABILITIES.manageEnter), false);
  });

  it("TEST 9 — audit complete", () => {
    const created = TenantFactoryRuntime.provision({
      actor: operator(),
      request: {
        name: "Audited Life",
        slug: "audited-life",
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
      reason: "review",
    });
    TenantLifecycleRuntime.restore({
      actor: operator(),
      tenantId: created.tenantId,
    });
    TenantLifecycleRuntime.setPlan({
      actor: operator(),
      tenantId: created.tenantId,
      plan: "premium",
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.tenant.activated"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "platform.tenant.suspended"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "platform.tenant.restored"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "platform.contract.changed"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "platform.tenant.created"),
      true,
    );
    assert.equal(logs.some((row) => "token" in (row.metadata ?? {})), false);
  });

  it("TEST 10 — Valley separated from Panorámica", () => {
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
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "B Sur" }],
      },
    });
    TenantLifecycleRuntime.activate({
      actor: operator(),
      tenantId: luxury.tenantId,
    });
    TenantLifecycleRuntime.activate({
      actor: operator(),
      tenantId: other.tenantId,
    });
    TenantLifecycleRuntime.suspend({
      actor: operator(),
      tenantId: other.tenantId,
    });
    const luxuryLife = TenantLifecycleRuntime.context(luxury.tenantId);
    const otherLife = TenantLifecycleRuntime.context(other.tenantId);
    assert.equal(luxuryLife?.status, "active");
    assert.equal(otherLife?.status, "suspended");
    assert.equal(luxury.territories.length, 3);
    assert.equal(
      TenantFactoryRuntime.configuration(luxury.tenantId)?.territories.some(
        (row) =>
          row.id ===
          TenantFactoryRuntime.configuration(other.tenantId)?.territories[0]?.id,
      ),
      false,
    );
    const source = readFileSync(
      path.join(HERE, "tenant-lifecycle-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueTenantLifecycleEntity("GlobalCommunityManager"), true);
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.equal(/export type CustomerSpecificTenant/.test(source), false);
  });
});
