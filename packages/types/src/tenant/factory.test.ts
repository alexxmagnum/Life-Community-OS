import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { CAPABILITIES } from "../platform/capabilities";
import { resolveEffectivePermissions } from "../platform/authorization";
import { isProductCapabilityEnabled } from "../platform/tenant-contract";
import {
  COMMUNITY_ONBOARDING_STEPS,
  PACK_MUST_NOT_PROVIDE,
  TenantFactoryService,
  TerritoryProvisionService,
  adoptConfiguredTenant,
  canAccessPlatformAdmin,
  emptyTenantFactorySnapshot,
  enabledModulesFromFeatures,
  featureOnDoesNotGrantPermissions,
  featuresForPlan,
  isOpaqueTenantFactoryEntity,
  packCannotControlAuthz,
  rejectClientAuthoritySpoof,
  tenantFeatureFlagsFromProduct,
} from "./factory";

const HERE = path.dirname(fileURLToPath(import.meta.url));

describe("Tenant Factory", () => {
  it("creates an empty Tenant with infrastructure only", () => {
    const { snapshot, result } = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Sierra Nueva",
        slug: "sierra-nueva",
        locale: "es",
        timezone: "UTC",
        territories: [{ name: "Sierra Norte" }],
      },
    );
    assert.equal(result.status, "provisioned");
    assert.equal(result.territories.length, 1);
    assert.equal(snapshot.tenants[0]?.slug, "sierra-nueva");
    assert.equal(snapshot.tenants[0]?.plan, "community");
    assert.equal("roles" in snapshot.tenants[0]!, false);
    assert.equal("permissions" in snapshot.tenants[0]!, false);
  });

  it("provisions a Territory inside the Tenant", () => {
    const started = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf", slug: "panoramica-golf" }],
      },
    );
    const next = TenantFactoryService.addTerritory(started.snapshot, {
      tenantId: started.result.tenantId,
      name: "Ocean Hills",
      slug: "ocean-hills",
    });
    const third = TenantFactoryService.addTerritory(next.snapshot, {
      tenantId: started.result.tenantId,
      name: "Valley",
      slug: "valley",
    });
    const ofTenant = third.snapshot.territories.filter(
      (row) => row.tenantId === started.result.tenantId,
    );
    assert.equal(ofTenant.length, 3);
  });

  it("lets one Tenant own many Territories without customer code", () => {
    const { result } = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
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
    );
    assert.equal(result.territories.length, 3);
    assert.equal(
      new Set(result.territories.map((row) => row.slug)).size,
      3,
    );
  });

  it("hides a module when its Feature is off", () => {
    const map = featuresForPlan("starter");
    assert.equal(isProductCapabilityEnabled(map, "marketplace"), false);
    assert.equal(enabledModulesFromFeatures(map).marketplace, false);
    assert.equal(enabledModulesFromFeatures(map).experiences, true);
  });

  it("does not grant permissions when a Feature is ON", () => {
    const map = featuresForPlan("enterprise");
    const flags = tenantFeatureFlagsFromProduct(map);
    const granted = resolveEffectivePermissions({
      role: "member",
      features: flags,
      productCapabilities: map,
    });
    assert.equal(granted.includes(CAPABILITIES.manageEnter), false);
    assert.equal(granted.includes(CAPABILITIES.housingManage), false);
    assert.equal(featureOnDoesNotGrantPermissions(), true);
  });

  it("keeps AuthZ on the platform — packs cannot grant it", () => {
    assert.equal(packCannotControlAuthz(), true);
    assert.equal(PACK_MUST_NOT_PROVIDE.includes("permissions"), true);
    assert.equal(PACK_MUST_NOT_PROVIDE.includes("roles"), true);
  });

  it("adopts Panorámica as a configured tenant, not a special case", () => {
    const adopted = adoptConfiguredTenant({
      snapshot: emptyTenantFactorySnapshot(),
      identity: {
        slug: "life-panoramica",
        name: "Panorámica Golf",
        tenantUuid: "10000000-0000-4000-8000-000000000001",
        territoryUuid: "10000000-0000-4000-8000-000000000002",
        hostHints: ["life-panoramica"],
        locale: "es",
        timezone: "Europe/Madrid",
      },
      branding: { name: "Panorámica Golf" },
      features: featuresForPlan("premium"),
      territories: [
        {
          id: "10000000-0000-4000-8000-000000000002",
          name: "Panorámica Golf",
          slug: "panoramica-golf",
        },
      ],
    });
    assert.equal(
      adopted.result.tenantId,
      "10000000-0000-4000-8000-000000000001",
    );
    assert.equal(adopted.result.territories[0]?.id, "10000000-0000-4000-8000-000000000002");
  });

  it("separates Platform Admin from Territory Admin", () => {
    assert.equal(
      canAccessPlatformAdmin({
        personId: "person-tenant-admin",
        operators: [],
      }),
      false,
    );
    assert.equal(
      canAccessPlatformAdmin({
        personId: "person-platform",
        operators: [{ personId: "person-platform", status: "active" }],
      }),
      true,
    );
  });

  it("rejects client authority spoofing", () => {
    assert.equal(rejectClientAuthoritySpoof({ tenantId: "x" }), "tenantId");
    assert.equal(rejectClientAuthoritySpoof({ role: "administrator" }), "role");
    assert.equal(rejectClientAuthoritySpoof({ plan: "enterprise" }), "plan");
    assert.equal(rejectClientAuthoritySpoof({ features: { golf: true } }), "features");
    assert.equal(rejectClientAuthoritySpoof({}), null);
  });

  it("does not invent customer-specific factory entities", () => {
    const source = readFileSync(path.join(HERE, "factory.ts"), "utf8");
    assert.equal(isOpaqueTenantFactoryEntity("PanoramicaTenant"), true);
    assert.equal(/export type PanoramicaTenant/.test(source), false);
    assert.equal(/export type CustomerSpecificCode/.test(source), false);
    assert.equal(/export type GlobalAdminBypass/.test(source), false);
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.equal(COMMUNITY_ONBOARDING_STEPS[0], "create_tenant");
    const territory = TerritoryProvisionService.provision({
      tenantId: "tenant-x",
      name: "Norte",
    });
    assert.equal(territory.tenantId, "tenant-x");
  });
});
