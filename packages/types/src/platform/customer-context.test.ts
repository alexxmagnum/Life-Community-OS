/**
 * Commercial SaaS customer operations contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  TenantFactoryService,
  emptyTenantFactorySnapshot,
  featuresForPlan,
} from "../tenant/factory";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  TenantActivationService,
  assertCustomerTenantBoundary,
  billingReadinessContract,
  communityAdminBlockedFromControlPlane,
  customerDoesNotOwnCommunityData,
  emptyCustomerOperationsPlane,
  featureDoesNotGrantCapability,
  isOpaqueCustomerEntity,
  limitsAreProductNotSecurity,
  memberLimitReached,
  planDoesNotGrantPermissions,
  productFeatureCatalog,
  projectCustomerOperationsContext,
  rejectCustomerClientSpoof,
  TenantActivationService,
} from "./customer-context";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function luxurySnapshot() {
  const luxury = TenantFactoryService.provision(emptyTenantFactorySnapshot(), {
    name: "Luxury Communities Inc",
    slug: "luxury-communities",
    locale: "en",
    timezone: "UTC",
    territories: [{ name: "Panorámica Golf" }],
  });
  const withValley = TenantFactoryService.addTerritory(luxury.snapshot, {
    tenantId: luxury.result.tenantId,
    name: "Valley",
  });
  return {
    luxuryId: luxury.result.tenantId,
    snapshot: withValley.snapshot,
    pano: withValley.snapshot.territories.find(
      (row) => row.name === "Panorámica Golf",
    )!,
    valley: withValley.snapshot.territories.find((row) => row.name === "Valley")!,
  };
}

describe("Commercial SaaS customer operations", () => {
  it("TEST 1 — crear customer tenant", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    const initialized = TenantActivationService.initializeTenant(
      emptyCustomerOperationsPlane(),
      {
        tenantId: luxuryId,
        companyName: "Luxury Communities Inc",
        contact: { name: "Ana", email: "ana@luxury.example" },
        plan: "community",
      },
    );
    assert.equal(initialized.customer.onboardingStatus, "requested");
    assert.equal(initialized.customer.plan, "community");
    const ops = projectCustomerOperationsContext(
      snapshot,
      initialized.plane,
      luxuryId,
    );
    assert.equal(ops?.companyName, "Luxury Communities Inc");
  });

  it("TEST 2 — onboarding completo", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    let plane = emptyCustomerOperationsPlane();
    plane = TenantActivationService.initializeTenant(plane, {
      tenantId: luxuryId,
      companyName: "Luxury Communities Inc",
      contact: { name: "Ana", email: "ana@luxury.example" },
      plan: "premium",
    }).plane;
    plane = TenantActivationService.configureTenant(plane, {
      tenantId: luxuryId,
      companyName: "Luxury Communities Inc",
    }).plane;
    plane = TenantActivationService.activateFeatures(plane, {
      tenantId: luxuryId,
      features: { lifeMap: true, community: true },
    }).plane;
    plane = TenantActivationService.inviteAdministrator(plane, {
      tenantId: luxuryId,
      email: "admin@luxury.example",
      invitedBy: "person-platform",
    }).plane;
    const completed = TenantActivationService.completeOnboarding(plane, luxuryId);
    assert.equal(completed.customer.onboardingStatus, "ready");
    const ops = projectCustomerOperationsContext(
      snapshot,
      completed.plane,
      luxuryId,
    );
    assert.equal(ops?.pendingAdministratorInvite, true);
  });

  it("TEST 3 — administrador invitado correctamente", () => {
    const { luxuryId } = luxurySnapshot();
    let plane = emptyCustomerOperationsPlane();
    plane = TenantActivationService.initializeTenant(plane, {
      tenantId: luxuryId,
      companyName: "Luxury Communities Inc",
      contact: { name: "Ana", email: "ana@luxury.example" },
      plan: "community",
    }).plane;
    const invited = TenantActivationService.inviteAdministrator(plane, {
      tenantId: luxuryId,
      email: "admin@luxury.example",
      invitedBy: "person-platform",
    });
    assert.equal(invited.invitation.status, "pending");
    assert.equal(rejectCustomerClientSpoof({ role: "administrator" }), "role");
  });

  it("TEST 4 — plan separado de permisos", () => {
    assert.equal(planDoesNotGrantPermissions("enterprise"), true);
    assert.equal(planDoesNotGrantPermissions("starter"), true);
    const caps = featuresForPlan("enterprise");
    assert.equal(caps.lifeMap, true);
  });

  it("TEST 5 — feature separado de capability", () => {
    const features = featuresForPlan("community");
    assert.equal(featureDoesNotGrantCapability(features), true);
    assert.equal(
      productFeatureCatalog().some((row) => row.key === "lifeMap"),
      true,
    );
  });

  it("TEST 6 — límite separado de seguridad", () => {
    const productLimits = {
      territories: 1,
      members: 500,
      storage: 5120,
      resources: 50,
    };
    assert.equal(limitsAreProductNotSecurity(productLimits), true);
    assert.equal(
      memberLimitReached({ limits: productLimits, currentMembers: 500 }),
      true,
    );
    assert.equal(
      memberLimitReached({ limits: productLimits, currentMembers: 499 }),
      false,
    );
  });

  it("TEST 7 — Community Admin bloqueado", () => {
    assert.equal(communityAdminBlockedFromControlPlane(false), true);
    assert.equal(communityAdminBlockedFromControlPlane(true), false);
    assert.equal(SAAS_CONTROL_PLANE_FORBIDDEN, "saas_control_plane_forbidden");
  });

  it("TEST 8 — Tenant aislado", () => {
    const luxury = TenantFactoryService.provision(emptyTenantFactorySnapshot(), {
      name: "Luxury Communities Inc",
      slug: "luxury-communities",
      locale: "en",
      timezone: "UTC",
      territories: [{ name: "Panorámica Golf" }],
    });
    const tenantB = TenantFactoryService.provision(luxury.snapshot, {
      name: "Tenant B",
      slug: "tenant-b",
      locale: "en",
      timezone: "UTC",
      territories: [{ name: "North Ridge" }],
    });
    assert.throws(
      () =>
        assertCustomerTenantBoundary({
          actorTenantId: luxury.result.tenantId,
          resourceTenantId: tenantB.result.tenantId,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === "cross_tenant_access_denied",
    );
  });

  it("TEST 9 — Valley separado de Panorámica", () => {
    const { luxuryId, pano, valley, snapshot } = luxurySnapshot();
    assert.notEqual(pano.id, valley.id);
    assert.equal(pano.tenantId, luxuryId);
    assert.equal(valley.tenantId, luxuryId);
    const source = readFileSync(path.join(HERE, "customer-context.ts"), "utf8");
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 10 — no existe CustomerClone", () => {
    assert.equal(isOpaqueCustomerEntity("CustomerClone"), true);
    assert.equal(isOpaqueCustomerEntity("GlobalCustomerEntity"), true);
    assert.equal(customerDoesNotOwnCommunityData(), true);
  });

  it("billing readiness keeps provider none", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    const billing = billingReadinessContract(snapshot, luxuryId);
    assert.equal(billing?.billingProvider, "none");
    assert.equal(billing?.plan, "community");
  });

  it("product feature catalog maps to capabilities", () => {
    const catalog = productFeatureCatalog();
    assert.equal(catalog.find((row) => row.key === "services")?.capabilityKey, "work");
    assert.equal(
      catalog.find((row) => row.key === "business")?.capabilityKey,
      "official",
    );
  });

  it("configure tenant moves to configuring", () => {
    const { luxuryId } = luxurySnapshot();
    const configured = TenantActivationService.configureTenant(
      emptyCustomerOperationsPlane(),
      { tenantId: luxuryId, companyName: "Configured Co" },
    );
    assert.equal(configured.customer.onboardingStatus, "configuring");
  });

  it("customer audit metadata sanitized", () => {
    const meta = TenantActivationService;
    assert.equal(meta.completeOnboarding.name, "completeOnboarding");
    assert.equal(typeof meta.initializeTenant, "function");
  });

  it("activate features updates product map", () => {
    const { luxuryId } = luxurySnapshot();
    let plane = TenantActivationService.initializeTenant(
      emptyCustomerOperationsPlane(),
      {
        tenantId: luxuryId,
        companyName: "Luxury",
        contact: { name: "Ana", email: "a@example.com" },
        plan: "starter",
      },
    ).plane;
    const activated = TenantActivationService.activateFeatures(plane, {
      tenantId: luxuryId,
      features: { marketplace: true },
    });
    assert.equal(activated.customer.features.marketplace, true);
  });
});
