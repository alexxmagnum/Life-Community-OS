/**
 * SaaS analytics & business intelligence contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  TenantFactoryService,
  emptyTenantFactorySnapshot,
} from "../tenant/factory";
import { SAAS_CONTROL_PLANE_FORBIDDEN } from "../domain/admin-operations";
import {
  emptyCustomerOperationsPlane,
  TenantActivationService,
} from "./customer-context";
import { emptyCustomerSuccessPlane } from "./customer-success";
import {
  analyticsContainsPersonalData,
  analyticsInsightsForCustomerSuccess,
  analyticsIsNotTracking,
  communityAdminBlockedFromAnalytics,
  crossTenantAnalyticsBlocked,
  isOpaqueAnalyticsEntity,
  privacyRespectedInAnalytics,
  projectPlatformBusinessIntelligence,
  projectPlatformReport,
  projectTenantAnalytics,
  projectTenantCapacity,
  projectTenantFeatureUsage,
  rejectAnalyticsClientSpoof,
} from "./business-intelligence";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function luxurySnapshot() {
  const luxury = TenantFactoryService.provision(emptyTenantFactorySnapshot(), {
    name: "Luxury Communities Inc",
    slug: "luxury-communities",
    locale: "en",
    timezone: "UTC",
    territories: [{ name: "Panorámica Golf" }],
    branding: { name: "Luxury", primaryColor: "#0055aa" },
  });
  const withValley = TenantFactoryService.addTerritory(luxury.snapshot, {
    tenantId: luxury.result.tenantId,
    name: "Valley",
  });
  const tenantB = TenantFactoryService.provision(withValley.snapshot, {
    name: "Tenant B",
    slug: "tenant-b",
    locale: "en",
    timezone: "UTC",
    territories: [{ name: "North Ridge" }],
  });
  return {
    luxuryId: luxury.result.tenantId,
    bId: tenantB.result.tenantId,
    snapshot: tenantB.snapshot,
    pano: withValley.snapshot.territories.find(
      (row) => row.name === "Panorámica Golf",
    )!,
    valley: withValley.snapshot.territories.find((row) => row.name === "Valley")!,
  };
}

describe("SaaS analytics & business intelligence", () => {
  it("TEST 1 — platform analytics carga datos agregados", () => {
    const { snapshot } = luxurySnapshot();
    const bi = projectPlatformBusinessIntelligence({ snapshot });
    assert.equal(bi.tenantCount >= 2, true);
    assert.equal(typeof bi.featureAdoption.lifeMap, "number");
    assert.equal(analyticsContainsPersonalData(bi), false);
  });

  it("TEST 2 — Tenant aislado", () => {
    const { luxuryId, bId, snapshot } = luxurySnapshot();
    const a = projectTenantAnalytics({ snapshot, tenantId: luxuryId });
    const b = projectTenantAnalytics({ snapshot, tenantId: bId });
    assert.notEqual(a?.tenantId, b?.tenantId);
    assert.equal(crossTenantAnalyticsBlocked({
      actorTenantId: luxuryId,
      resourceTenantId: bId,
    }), true);
  });

  it("TEST 3 — Community Admin bloqueado", () => {
    assert.equal(communityAdminBlockedFromAnalytics(false), true);
    assert.equal(communityAdminBlockedFromAnalytics(true), false);
    assert.equal(rejectAnalyticsClientSpoof({ role: "administrator" }), "role");
  });

  it("TEST 4 — no existe UserTrackingEntity", () => {
    assert.equal(isOpaqueAnalyticsEntity("UserTrackingEntity"), true);
    assert.equal(isOpaqueAnalyticsEntity("GlobalAnalyticsEntity"), true);
  });

  it("TEST 5 — no existe EngagementScore", () => {
    assert.equal(isOpaqueAnalyticsEntity("EngagementScore"), true);
    assert.equal(analyticsIsNotTracking(), true);
  });

  it("TEST 6 — feature adoption correcto", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    const usage = projectTenantFeatureUsage(snapshot, luxuryId);
    assert.equal(Array.isArray(usage?.activeFeatures), true);
    assert.equal(Array.isArray(usage?.contractedFeatures), true);
    assert.equal(typeof usage?.unconfiguredFeatures.length, "number");
  });

  it("TEST 7 — capacity usage correcto", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    const capacity = projectTenantCapacity(snapshot, luxuryId);
    assert.equal(capacity?.usage.territories, 2);
    assert.equal(typeof capacity?.limits.territories, "number");
    assert.equal(typeof capacity?.nearLimit, "boolean");
  });

  it("TEST 8 — privacy protegida", () => {
    assert.equal(privacyRespectedInAnalytics(), true);
    const { luxuryId, snapshot } = luxurySnapshot();
    const analytics = projectTenantAnalytics({ snapshot, tenantId: luxuryId });
    assert.equal(analyticsContainsPersonalData(analytics!), false);
    assert.equal("messages" in (analytics ?? {}), false);
  });

  it("TEST 9 — Valley separado de Panorámica", () => {
    const { pano, valley } = luxurySnapshot();
    assert.notEqual(pano.id, valley.id);
    const source = readFileSync(
      path.join(HERE, "business-intelligence.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 10 — cross tenant analytics bloqueado", () => {
    const { luxuryId, bId } = luxurySnapshot();
    assert.equal(
      crossTenantAnalyticsBlocked({
        actorTenantId: luxuryId,
        resourceTenantId: bId,
      }),
      true,
    );
  });

  it("customer success integration insights", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    let customerPlane = emptyCustomerOperationsPlane();
    customerPlane = TenantActivationService.initializeTenant(customerPlane, {
      tenantId: luxuryId,
      companyName: "Luxury",
      contact: { name: "Ana", email: "ana@example.com" },
      plan: "community",
    }).plane;
    const insights = analyticsInsightsForCustomerSuccess({
      snapshot,
      customerPlane,
      successPlane: emptyCustomerSuccessPlane(),
    });
    assert.equal(Array.isArray(insights), true);
    assert.equal(insights.every((row) => !("personId" in row)), true);
  });

  it("platform report tenant overview", () => {
    const { snapshot } = luxurySnapshot();
    const report = projectPlatformReport({
      snapshot,
      kind: "tenant_overview",
    });
    assert.equal(report.kind, "tenant_overview");
    assert.equal(report.rows.length >= 2, true);
  });

  it("platform report feature adoption", () => {
    const { snapshot } = luxurySnapshot();
    const report = projectPlatformReport({
      snapshot,
      kind: "feature_adoption",
    });
    assert.equal(report.kind, "feature_adoption");
    assert.equal(report.summary.includes("Feature adoption"), true);
  });

  it("platform report capacity", () => {
    const { snapshot } = luxurySnapshot();
    const report = projectPlatformReport({
      snapshot,
      kind: "capacity_report",
    });
    assert.equal(report.kind, "capacity_report");
    assert.equal(typeof report.rows[0]?.nearLimit, "boolean");
  });

  it("saas control plane forbidden", () => {
    assert.equal(SAAS_CONTROL_PLANE_FORBIDDEN, "saas_control_plane_forbidden");
  });
});
