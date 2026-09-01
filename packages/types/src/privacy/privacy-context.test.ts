/**
 * GDPR privacy governance contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { createAdminAuditLog, sanitizeAuditMetadata } from "../domain/admin-audit-log";
import {
  TenantFactoryService,
  emptyTenantFactorySnapshot,
} from "../tenant/factory";
import {
  EXPORT_OTHER_PERSON_DATA,
  PRIVACY_ACCESS_DENIED,
  PersonalAnonymizationService,
  PersonalDataExportService,
  PrivacyConsentService,
  assertPrivacyTenantBoundary,
  assertSelfPersonAccess,
  defaultPrivacyRetentionPolicy,
  emptyPersonalDataPlane,
  gdprDoesNotOwnDomainData,
  isOpaquePrivacyEntity,
  personalMediaPolicy,
  privacyIntegratesWithSecurity,
  privateMessageVisible,
  projectPrivacyConfiguration,
  projectPrivacyContext,
} from "./privacy-context";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function luxuryPlane() {
  const luxury = TenantFactoryService.provision(emptyTenantFactorySnapshot(), {
    name: "Luxury Communities Inc",
    slug: "luxury-communities",
    locale: "en",
    timezone: "UTC",
    territories: [{ name: "Panorámica Golf" }],
  });
  const withHills = TenantFactoryService.addTerritory(luxury.snapshot, {
    tenantId: luxury.result.tenantId,
    name: "Ocean Hills",
  });
  const withValley = TenantFactoryService.addTerritory(withHills.snapshot, {
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
    pano: withValley.snapshot.territories.find(
      (row) => row.name === "Panorámica Golf",
    )!,
    valley: withValley.snapshot.territories.find((row) => row.name === "Valley")!,
  };
}

describe("GDPR privacy governance", () => {
  it("TEST 1 — usuario exporta sus propios datos", () => {
    const plane = emptyPersonalDataPlane();
    plane.profiles.push({
      personId: "person-alex",
      tenantId: "luxury-communities",
      displayName: "Alex",
      email: "alex@example.com",
    });
    plane.memberships.push({
      personId: "person-alex",
      tenantId: "luxury-communities",
      role: "member",
    });
    plane.favorites.push({
      personId: "person-alex",
      tenantId: "luxury-communities",
      kind: "experience",
      targetId: "exp-1",
    });
    const exported = PersonalDataExportService.exportPersonalData(plane, {
      actorPersonId: "person-alex",
      tenantId: "luxury-communities",
    });
    assert.equal(exported.personId, "person-alex");
    assert.equal(exported.profile.email, "alex@example.com");
    assert.equal(exported.memberships.length, 1);
    assert.equal(exported.favorites.length, 1);
    assert.equal("messages" in exported, false);
  });

  it("TEST 2 — usuario no exporta datos ajenos", () => {
    assert.throws(
      () =>
        assertSelfPersonAccess({
          actorPersonId: "person-alex",
          targetPersonId: "person-blake",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === EXPORT_OTHER_PERSON_DATA,
    );
    const plane = emptyPersonalDataPlane();
    plane.profiles.push({
      personId: "person-blake",
      tenantId: "luxury-communities",
      displayName: "Blake",
      email: "blake@example.com",
    });
    const exported = PersonalDataExportService.exportPersonalData(plane, {
      actorPersonId: "person-alex",
      tenantId: "luxury-communities",
    });
    assert.equal(exported.personId, "person-alex");
    assert.equal(exported.profile.email, null);
    assert.equal(exported.profile.displayName, null);
  });

  it("TEST 3 — anonimización correcta", () => {
    const plane = emptyPersonalDataPlane();
    plane.profiles.push({
      personId: "person-alex",
      tenantId: "luxury-communities",
      displayName: "Juan García",
      email: "juan@email.com",
    });
    const { plane: next, result } = PersonalAnonymizationService.anonymizePerson(
      plane,
      {
        actorPersonId: "person-alex",
        tenantId: "luxury-communities",
        explicitConfirmation: true,
      },
    );
    assert.equal(result.displayName, null);
    assert.equal(result.email, null);
    assert.equal(next.anonymized.includes("person-alex"), true);
    assert.throws(
      () =>
        PersonalDataExportService.exportPersonalData(next, {
          actorPersonId: "person-alex",
          tenantId: "luxury-communities",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === PRIVACY_ACCESS_DENIED,
    );
  });

  it("TEST 4 — Tenant A aislado de Tenant B", () => {
    const { luxuryId, bId } = luxuryPlane();
    assert.throws(
      () =>
        assertPrivacyTenantBoundary({
          actorTenantId: luxuryId,
          resourceTenantId: bId,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === "cross_tenant_access_denied",
    );
  });

  it("TEST 5 — consentimiento recomendaciones funciona", () => {
    const context = projectPrivacyContext({
      personId: "person-alex",
      tenantId: "luxury-communities",
      personalPrivacy: { receiveRecommendations: false },
    });
    assert.equal(context.consent.recommendations, false);
    const updated = PrivacyConsentService.updateConsent(context, {
      recommendations: true,
    });
    assert.equal(updated.consent.recommendations, true);
    const personal = PrivacyConsentService.toPersonalPrivacy(updated.consent);
    assert.equal(personal.receiveRecommendations, true);
  });

  it("TEST 6 — actividad oculta según privacidad", () => {
    const hidden = projectPrivacyContext({
      personId: "person-alex",
      tenantId: "luxury-communities",
      personalPrivacy: { shareActivity: false },
      participationPrivacy: { showActivity: false },
    });
    assert.equal(hidden.consent.activityVisibility, false);
    const visible = projectPrivacyContext({
      personId: "person-alex",
      tenantId: "luxury-communities",
      personalPrivacy: { shareActivity: true },
      participationPrivacy: { showActivity: true },
    });
    assert.equal(visible.consent.activityVisibility, true);
  });

  it("TEST 7 — mensajes privados protegidos", () => {
    assert.equal(
      privateMessageVisible({
        messagePersonId: "person-alex",
        actorPersonId: "person-blake",
        tenantId: "luxury-communities",
        messageTenantId: "luxury-communities",
      }),
      false,
    );
    assert.equal(
      privateMessageVisible({
        messagePersonId: "person-alex",
        actorPersonId: "person-alex",
        tenantId: "luxury-communities",
        messageTenantId: "luxury-communities",
      }),
      true,
    );
    assert.equal(
      privateMessageVisible({
        messagePersonId: "person-alex",
        actorPersonId: "person-alex",
        tenantId: "luxury-communities",
        messageTenantId: "tenant-b",
      }),
      false,
    );
  });

  it("TEST 8 — media privada protegida", () => {
    const { luxuryId, bId } = luxuryPlane();
    assert.equal(
      personalMediaPolicy({
        media: {
          mediaId: "m1",
          tenantId: luxuryId,
          storageKey: `${luxuryId}/m1/private.png`,
          entityType: "avatar",
        },
        tenantId: luxuryId,
        ownerPersonId: "person-alex",
        actorPersonId: "person-blake",
      }),
      false,
    );
    assert.equal(
      personalMediaPolicy({
        media: {
          mediaId: "m1",
          tenantId: luxuryId,
          storageKey: `${luxuryId}/m1/private.png`,
          entityType: "avatar",
        },
        tenantId: luxuryId,
        ownerPersonId: "person-alex",
        actorPersonId: "person-alex",
      }),
      true,
    );
    assert.equal(
      personalMediaPolicy({
        media: {
          mediaId: "m2",
          tenantId: luxuryId,
          storageKey: `${bId}/m2/cover.png`,
        },
        tenantId: luxuryId,
        ownerPersonId: "person-alex",
        actorPersonId: "person-alex",
      }),
      false,
    );
  });

  it("TEST 9 — Community Admin sin acceso indebido", () => {
    assert.throws(
      () =>
        assertSelfPersonAccess({
          actorPersonId: "person-admin",
          targetPersonId: "person-alex",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === EXPORT_OTHER_PERSON_DATA,
    );
    const log = createAdminAuditLog({
      tenantId: "luxury-communities",
      actorPersonId: "person-admin",
      actorRole: "administrator",
      action: "privacy.access.denied",
      entityType: "privacy",
      entityId: "person-alex",
    });
    assert.equal(log.action, "privacy.access.denied");
    assert.equal(log.metadata?.message_content, undefined);
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    const { luxuryId, pano, valley } = luxuryPlane();
    assert.notEqual(pano.id, valley.id);
    assert.equal(pano.tenantId, luxuryId);
    assert.equal(valley.tenantId, luxuryId);
    const config = projectPrivacyConfiguration(luxuryId, {
      dataControllerName: "Luxury Communities Inc",
      legalContact: "privacy@luxury.example",
    });
    assert.equal(config.tenantId, luxuryId);
    assert.equal(config.retentionSettings.audit.automaticDeletion, false);
    const source = readFileSync(path.join(HERE, "privacy-context.ts"), "utf8");
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.equal(isOpaquePrivacyEntity("GlobalPrivacyEntity"), true);
    assert.equal(isOpaquePrivacyEntity("PrivacySocialGraph"), true);
  });

  it("retention policy is contract-only", () => {
    const policy = defaultPrivacyRetentionPolicy();
    assert.equal(policy.messages.automaticDeletion, false);
    assert.equal(policy.personal_preferences.description, "until_consent_withdrawn");
  });

  it("privacy audit metadata sanitized", () => {
    const sanitized = sanitizeAuditMetadata({
      password: "secret",
      token: "tok",
      message_content: "hello",
      action: "export",
    });
    assert.equal(sanitized?.action, "export");
    assert.equal(sanitized?.password, undefined);
    assert.equal(sanitized?.message_content, undefined);
  });

  it("privacy integrates with security without owning domain data", () => {
    assert.equal(privacyIntegratesWithSecurity(), true);
    assert.equal(gdprDoesNotOwnDomainData(), true);
    assert.equal(isOpaquePrivacyEntity("GDPRScore"), true);
    assert.equal(isOpaquePrivacyEntity("ComplianceScore"), true);
  });
});
