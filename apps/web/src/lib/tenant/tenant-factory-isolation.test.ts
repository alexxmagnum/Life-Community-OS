/**
 * Tenant Factory isolation — SaaS community deployment.
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
  adoptConfiguredTenant,
  canAccessAdminOperations,
  canAccessPlatformAdmin,
  enabledModulesFromFeatures,
  emptyTenantFactorySnapshot,
  featuresForPlan,
  isProductCapabilityEnabled,
  packCannotControlAuthz,
  resolveEffectivePermissions,
  tenantFeatureFlagsFromProduct,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  LIFE_PANORAMICA_TENANT_UUID,
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TENANT_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { getTenantManifestRecord } from "@/lib/tenant/manifest";
import { requireTenantPack } from "@/lib/tenant/registry";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
} from "@/lib/tenant/tenant-factory-service";

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

describe("Tenant Factory isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
  });

  it("TEST 1 — create an empty Tenant", () => {
    const result = TenantFactoryRuntime.provision({
      actor: actor({
        tenantSlug: "life-panoramica",
        role: "administrator",
        personId: "person-platform",
      }),
      request: {
        name: "Sierra Nueva",
        slug: "sierra-nueva",
        locale: "es",
        timezone: "UTC",
        territories: [{ name: "Sierra Norte" }],
      },
    });
    assert.equal(result.status, "provisioned");
    assert.equal(result.territories.length, 1);
    const tenant = TenantFactoryRuntime.list().find(
      (row) => row.id === result.tenantId,
    );
    assert.ok(tenant);
    assert.equal("permissions" in tenant, false);
  });

  it("TEST 2 — create a Territory inside the Tenant", () => {
    const operator = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    const created = TenantFactoryRuntime.provision({
      actor: operator,
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    const extra = TenantFactoryRuntime.addTerritory({
      actor: operator,
      territory: {
        tenantId: created.tenantId,
        name: "Ocean Hills",
      },
    });
    assert.equal(extra.tenantId, created.tenantId);
    assert.equal(extra.name, "Ocean Hills");
  });

  it("TEST 3 — a Tenant can own many Territories", () => {
    const result = TenantFactoryRuntime.provision({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [
          { name: "Panorámica Golf", slug: "panoramica-golf" },
          { name: "Ocean Hills", slug: "ocean-hills" },
          { name: "Valley", slug: "valley" },
        ],
      },
    });
    assert.equal(result.territories.length, 3);
  });

  it("TEST 4 — a disabled Feature hides the module", () => {
    const starter = featuresForPlan("starter");
    assert.equal(isProductCapabilityEnabled(starter, "marketplace"), false);
    assert.equal(enabledModulesFromFeatures(starter).marketplace, false);
    const ocean = requireTenantPack("life-ocean-hills");
    assert.equal(ocean.features.marketplace, false);
  });

  it("TEST 5 — Feature ON does not grant permissions", () => {
    const map = featuresForPlan("enterprise");
    const granted = resolveEffectivePermissions({
      role: "member",
      features: tenantFeatureFlagsFromProduct(map),
      productCapabilities: map,
    });
    assert.equal(granted.includes(CAPABILITIES.manageEnter), false);
    assert.equal(granted.includes(CAPABILITIES.housingManage), false);
  });

  it("TEST 6 — a Pack does not control AuthZ", () => {
    assert.equal(packCannotControlAuthz(), true);
    const valley = requireTenantPack("life-valley");
    assert.equal("ROLE_CAPABILITIES" in valley, false);
    const member = permissionsForRole("member", "life-valley");
    assert.equal(member.includes(CAPABILITIES.manageEnter), false);
  });

  it("TEST 7 — Valley stays separated from Panorámica", () => {
    const pano = getTenantManifestRecord("life-panoramica");
    const valley = getTenantManifestRecord("life-valley");
    assert.ok(pano);
    assert.ok(valley);
    let store = emptyTenantFactorySnapshot();
    const adoptedPano = adoptConfiguredTenant({
      snapshot: store,
      identity: pano,
      branding: { name: pano.name },
      features: featuresForPlan("premium"),
      territories: [
        {
          id: LIFE_PANORAMICA_TERRITORY_UUID,
          name: pano.name,
          slug: "panoramica-golf",
        },
      ],
    });
    const adoptedValley = adoptConfiguredTenant({
      snapshot: adoptedPano.snapshot,
      identity: valley,
      branding: { name: valley.name },
      features: featuresForPlan("community"),
      territories: [
        {
          id: LIFE_VALLEY_TERRITORY_UUID,
          name: valley.name,
          slug: "valley",
        },
      ],
    });
    const panoTerritories = adoptedValley.snapshot.territories.filter(
      (row) => row.tenantId === LIFE_PANORAMICA_TENANT_UUID,
    );
    const valleyTerritories = adoptedValley.snapshot.territories.filter(
      (row) => row.tenantId === LIFE_VALLEY_TENANT_UUID,
    );
    assert.equal(panoTerritories.length, 1);
    assert.equal(valleyTerritories.length, 1);
    assert.notEqual(panoTerritories[0]?.id, valleyTerritories[0]?.id);
  });

  it("TEST 8 — Platform Admin is separated from Territory Admin", () => {
    const tenantAdmin = actor({
      tenantSlug: "life-panoramica",
      role: "administrator",
      personId: "person-tenant-admin",
    });
    assert.equal(canAccessAdminOperations("administrator"), true);
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

  it("TEST 9 — a Tenant cannot access another Tenant", () => {
    const operator = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    const first = TenantFactoryRuntime.provision({
      actor: operator,
      request: {
        name: "Alpha",
        slug: "alpha-community",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Alpha Norte" }],
      },
    });
    const second = TenantFactoryRuntime.provision({
      actor: operator,
      request: {
        name: "Beta",
        slug: "beta-community",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Beta Sur" }],
      },
    });
    const alpha = TenantFactoryRuntime.configuration(first.tenantId);
    const beta = TenantFactoryRuntime.configuration(second.tenantId);
    assert.ok(alpha);
    assert.ok(beta);
    assert.equal(
      alpha.territories.some((row) => row.id === beta.territories[0]?.id),
      false,
    );
    const denied = resolveReadTenantId({
      request: new Request("http://localhost/api/locations?tenantId=life-valley", {
        headers: { "x-tenant-slug": "life-valley" },
      }),
      queryTenantId: "life-valley",
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-alex" }),
    });
    assert.equal("error" in denied, true);
  });

  it("TEST 10 — provisioning does not use customer-specific code", () => {
    const source = readFileSync(
      path.join(HERE, "tenant-factory-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.equal(/export type PanoramicaTenant/.test(source), false);
    const result = TenantFactoryRuntime.provision({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
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
    assert.equal(result.territories.length, 3);
  });
});
