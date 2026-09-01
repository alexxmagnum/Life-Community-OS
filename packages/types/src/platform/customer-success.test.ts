/**
 * Customer Success contract tests.
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
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  TenantActivationService,
  emptyCustomerOperationsPlane,
  projectTenantCustomerContext,
} from "./customer-context";
import {
  CustomerSuccessService,
  assertCustomerSuccessTenantBoundary,
  buildOnboardingChecklist,
  communityAdminBlockedFromCustomerSuccess,
  customerSuccessAuditMetadata,
  emptyCustomerSuccessPlane,
  isOpaqueCustomerSuccessEntity,
  personalDataExcludedFromSuccess,
  projectCustomerSuccessContext,
  rejectCustomerSuccessClientSpoof,
  resolveCustomerHealth,
  resolveOperationalAlerts,
  successDoesNotMeasureEngagement,
  subscriptionHealthFromContract,
} from "./customer-success";
import { projectTenantSubscription } from "./operations";

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

describe("Customer Success contract", () => {
  it("TEST 1 — customer health correcto", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    const customerPlane = emptyCustomerOperationsPlane();
    const successPlane = emptyCustomerSuccessPlane();
    TenantActivationService.initializeTenant(customerPlane, {
      tenantId: luxuryId,
      companyName: "Luxury",
      contact: { name: "Ana", email: "ana@example.com" },
      plan: "community",
    });
    const customer = projectTenantCustomerContext(snapshot, customerPlane, luxuryId)!;
    const health = resolveCustomerHealth({
      snapshot,
      customerPlane,
      successPlane,
      tenantId: luxuryId,
      customer,
    });
    assert.equal(health.status, "attention_required");
    assert.equal(health.configurationIssues.includes("administrator_pending"), true);
  });

  it("TEST 2 — onboarding checklist funciona", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    let customerPlane = emptyCustomerOperationsPlane();
    const init = TenantActivationService.initializeTenant(customerPlane, {
      tenantId: luxuryId,
      companyName: "Luxury",
      contact: { name: "Ana", email: "ana@example.com" },
      plan: "community",
    });
    customerPlane = init.plane;
    const customer = init.customer;
    const checklist = buildOnboardingChecklist({
      snapshot,
      customerPlane,
      successPlane: emptyCustomerSuccessPlane(),
      tenantId: luxuryId,
      customer,
    });
    assert.equal(checklist.items.length, 8);
    assert.equal(
      checklist.items.find((row) => row.key === "tenant_created")?.status,
      "completed",
    );
    assert.equal(checklist.overallStatus, "in_progress");
  });

  it("TEST 3 — Platform Operator accede", () => {
    assert.equal(communityAdminBlockedFromCustomerSuccess(true), false);
    assert.equal(communityAdminBlockedFromCustomerSuccess(false), true);
  });

  it("TEST 4 — Community Admin bloqueado", () => {
    assert.equal(communityAdminBlockedFromCustomerSuccess(false), true);
    assert.equal(rejectCustomerSuccessClientSpoof({ role: "administrator" }), "role");
  });

  it("TEST 5 — Tenant aislado", () => {
    const { luxuryId, bId, snapshot } = luxurySnapshot();
    assert.throws(
      () =>
        assertCustomerSuccessTenantBoundary({
          actorTenantId: luxuryId,
          resourceTenantId: bId,
        }),
      (error: unknown) => error instanceof Error,
    );
    const ctx = projectCustomerSuccessContext(
      snapshot,
      emptyCustomerOperationsPlane(),
      emptyCustomerSuccessPlane(),
      luxuryId,
    );
    assert.equal(ctx?.tenantId, luxuryId);
    assert.notEqual(ctx?.tenantId, bId);
  });

  it("TEST 6 — alertas operativas funcionan", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    let successPlane = emptyCustomerSuccessPlane();
    const created = CustomerSuccessService.createAlert(successPlane, {
      tenantId: luxuryId,
      type: "backup_issue",
      summary: "Backup pendiente",
    });
    successPlane = created.plane;
    const customer = projectTenantCustomerContext(
      snapshot,
      emptyCustomerOperationsPlane(),
      luxuryId,
    )!;
    const alerts = resolveOperationalAlerts({
      successPlane,
      tenantId: luxuryId,
      snapshot,
      customerPlane: emptyCustomerOperationsPlane(),
      customer,
    });
    assert.equal(alerts.some((row) => row.type === "backup_issue"), true);
    successPlane = CustomerSuccessService.resolveAlert(successPlane, {
      alertId: created.alert.id,
    });
    assert.equal(
      successPlane.alerts.find((row) => row.id === created.alert.id)?.status,
      "resolved",
    );
  });

  it("TEST 7 — no existe engagement score", () => {
    assert.equal(successDoesNotMeasureEngagement(), true);
    assert.equal(isOpaqueCustomerSuccessEntity("CommunityEngagementScore"), true);
    assert.equal(isOpaqueCustomerSuccessEntity("EngagementScore"), true);
  });

  it("TEST 8 — no existe usuario ranking", () => {
    assert.equal(isOpaqueCustomerSuccessEntity("UserRanking"), true);
    assert.equal(isOpaqueCustomerSuccessEntity("ResidentActivityScore"), true);
  });

  it("TEST 9 — Valley separado de Panorámica", () => {
    const { pano, valley } = luxurySnapshot();
    assert.notEqual(pano.id, valley.id);
    const source = readFileSync(
      path.join(HERE, "customer-success.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 10 — datos personales protegidos", () => {
    assert.equal(personalDataExcludedFromSuccess(), true);
    const { luxuryId, snapshot } = luxurySnapshot();
    const ctx = projectCustomerSuccessContext(
      snapshot,
      emptyCustomerOperationsPlane(),
      emptyCustomerSuccessPlane(),
      luxuryId,
    );
    assert.equal("messages" in (ctx ?? {}), false);
    assert.equal("activity" in (ctx ?? {}), false);
  });

  it("support note creation", () => {
    const { luxuryId } = luxurySnapshot();
    const created = CustomerSuccessService.createSupportNote(
      emptyCustomerSuccessPlane(),
      {
        tenantId: luxuryId,
        summary: "Error de sincronización",
        createdBy: "person-platform",
      },
    );
    assert.equal(created.note.status, "open");
    assert.equal(created.note.summary, "Error de sincronización");
  });

  it("complete checklist item", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    const customerPlane = emptyCustomerOperationsPlane();
    const customer = projectTenantCustomerContext(snapshot, customerPlane, luxuryId)!;
    let successPlane = CustomerSuccessService.completeChecklistItem(
      emptyCustomerSuccessPlane(),
      { tenantId: luxuryId, key: "first_content_operational" },
    );
    const checklist = buildOnboardingChecklist({
      snapshot,
      customerPlane,
      successPlane,
      tenantId: luxuryId,
      customer,
    });
    assert.equal(
      checklist.items.find((row) => row.key === "first_content_operational")
        ?.status,
      "completed",
    );
  });

  it("subscription health readiness", () => {
    const { luxuryId, snapshot } = luxurySnapshot();
    const subscription = projectTenantSubscription(snapshot, luxuryId);
    const health = subscriptionHealthFromContract(subscription);
    assert.equal(health?.billingProvider, "none");
    assert.equal(typeof health?.status, "string");
  });

  it("audit metadata sanitized", () => {
    const meta = customerSuccessAuditMetadata({
      tenantId: "luxury-communities",
      password: "secret",
      token: "abc",
    });
    assert.equal(meta && "password" in meta, false);
    assert.equal(meta && "token" in meta, false);
    assert.equal(meta?.tenantId, "luxury-communities");
  });

  it("saas control plane forbidden message", () => {
    assert.equal(
      SAAS_CONTROL_PLANE_FORBIDDEN,
      "saas_control_plane_forbidden",
    );
  });
});
