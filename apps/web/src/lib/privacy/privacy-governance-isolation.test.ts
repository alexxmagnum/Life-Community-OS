/**
 * GDPR privacy governance isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  EXPORT_OTHER_PERSON_DATA,
  PRIVACY_ACCESS_DENIED,
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canAccessAdminSection,
  emptyPersonalDataPlane,
  emptyTenantFactorySnapshot,
  isOpaquePrivacyEntity,
  personalMediaPolicy,
  privateMessageVisible,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
} from "@/lib/tenant/tenant-factory-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";
import {
  PrivacyGovernanceRuntime,
  replacePrivacyGovernanceStoreForTests,
  seedPrivacyGovernanceForTests,
} from "@/lib/privacy/privacy-governance-service";

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

describe("GDPR privacy governance isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
    replacePrivacyGovernanceStoreForTests(emptyPersonalDataPlane());
  });

  it("TEST 1 — usuario exporta sus propios datos", () => {
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    seedPrivacyGovernanceForTests({
      ...emptyPersonalDataPlane(),
      profiles: [
        {
          personId: "person-alex",
          tenantId: created.tenantId,
          displayName: "Alex",
          email: "alex@example.com",
        },
      ],
      memberships: [
        {
          personId: "person-alex",
          tenantId: created.tenantId,
          role: "member",
        },
      ],
    });
    const exported = PrivacyGovernanceRuntime.exportPersonal({
      actor: actor({ tenantSlug: created.tenantId, personId: "person-alex" }),
      tenantId: created.tenantId,
    });
    assert.equal(exported.profile.email, "alex@example.com");
  });

  it("TEST 2 — usuario no exporta datos ajenos", () => {
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    seedPrivacyGovernanceForTests({
      ...emptyPersonalDataPlane(),
      profiles: [
        {
          personId: "person-blake",
          tenantId: created.tenantId,
          displayName: "Blake",
          email: "blake@example.com",
        },
      ],
    });
    assert.throws(
      () =>
        PrivacyGovernanceRuntime.exportPersonal({
          actor: actor({ tenantSlug: created.tenantId, personId: "person-alex" }),
          tenantId: created.tenantId,
          targetPersonId: "person-blake",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === PRIVACY_ACCESS_DENIED,
    );
  });

  it("TEST 3 — anonimización correcta", () => {
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }],
      },
    });
    seedPrivacyGovernanceForTests({
      ...emptyPersonalDataPlane(),
      profiles: [
        {
          personId: "person-alex",
          tenantId: created.tenantId,
          displayName: "Juan García",
          email: "juan@email.com",
        },
      ],
    });
    const result = PrivacyGovernanceRuntime.deleteAccount({
      actor: actor({ tenantSlug: created.tenantId, personId: "person-alex" }),
      tenantId: created.tenantId,
      explicitConfirmation: true,
    });
    assert.equal(result.displayName, null);
    assert.equal(result.email, null);
  });

  it("TEST 4 — Tenant A aislado de Tenant B", () => {
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
    seedPrivacyGovernanceForTests({
      ...emptyPersonalDataPlane(),
      profiles: [
        {
          personId: "person-alex",
          tenantId: luxury.tenantId,
          displayName: "Alex",
          email: "alex@example.com",
        },
      ],
    });
    assert.throws(
      () =>
        PrivacyGovernanceRuntime.exportPersonal({
          actor: actor({ tenantSlug: tenantB.tenantId, personId: "person-alex" }),
          tenantId: luxury.tenantId,
        }),
      (error: unknown) =>
        error instanceof Error &&
        (error.message === PRIVACY_ACCESS_DENIED ||
          error.message === "cross_tenant_access_denied"),
    );
  });

  it("TEST 5 — consentimiento recomendaciones funciona", () => {
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
    const next = PrivacyGovernanceRuntime.updateConsent({
      actor: actor({ tenantSlug: created.tenantId, personId: "person-alex" }),
      tenantId: created.tenantId,
      consent: { recommendations: false, activityVisibility: true },
    });
    assert.equal(next.consent.recommendations, false);
    assert.equal(next.consent.activityVisibility, true);
  });

  it("TEST 6 — actividad oculta según privacidad", () => {
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
    const hidden = PrivacyGovernanceRuntime.updateConsent({
      actor: actor({ tenantSlug: created.tenantId, personId: "person-alex" }),
      tenantId: created.tenantId,
      consent: { activityVisibility: false },
    });
    assert.equal(hidden.consent.activityVisibility, false);
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
  });

  it("TEST 8 — media privada protegida", () => {
    assert.equal(
      personalMediaPolicy({
        media: {
          mediaId: "m1",
          tenantId: "luxury-communities",
          storageKey: "luxury-communities/m1/private.png",
        },
        tenantId: "luxury-communities",
        ownerPersonId: "person-alex",
        actorPersonId: "person-blake",
      }),
      false,
    );
  });

  it("TEST 9 — Community Admin sin acceso indebido", () => {
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
    const admin = actor({
      tenantSlug: created.tenantId,
      role: "administrator",
      personId: "person-admin",
    });
    assert.equal(canAccessAdminSection("administrator", "privacy"), true);
    seedPrivacyGovernanceForTests({
      ...emptyPersonalDataPlane(),
      profiles: [
        {
          personId: "person-alex",
          tenantId: created.tenantId,
          displayName: "Alex",
          email: "alex@example.com",
        },
      ],
    });
    assert.throws(
      () =>
        PrivacyGovernanceRuntime.exportPersonal({
          actor: admin,
          tenantId: created.tenantId,
          targetPersonId: "person-alex",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === PRIVACY_ACCESS_DENIED,
    );
    assert.throws(
      () =>
        PrivacyGovernanceRuntime.saveConfiguration({
          actor: actor({ tenantSlug: created.tenantId, role: "member" }),
          tenantId: created.tenantId,
          config: { legalContact: "x@example.com" },
        }),
      (error: unknown) =>
        error instanceof Error && error.message === PRIVACY_ACCESS_DENIED,
    );
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    const luxury = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
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
    const pano = luxury.territories.find((row) => row.name === "Panorámica Golf")!;
    const valley = luxury.territories.find((row) => row.name === "Valley")!;
    assert.notEqual(pano.id, valley.id);
    const config = PrivacyGovernanceRuntime.configuration(luxury.tenantId);
    assert.equal(config.tenantId, luxury.tenantId);
    const source = readFileSync(
      path.join(HERE, "privacy-governance-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.equal(isOpaquePrivacyEntity("PersonalDataMirror"), true);
  });

  it("TEST 11 — audit generado en export y delete", () => {
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
    seedPrivacyGovernanceForTests({
      ...emptyPersonalDataPlane(),
      profiles: [
        {
          personId: "person-alex",
          tenantId: created.tenantId,
          displayName: "Alex",
          email: "alex@example.com",
        },
      ],
    });
    PrivacyGovernanceRuntime.exportPersonal({
      actor: actor({ tenantSlug: created.tenantId, personId: "person-alex" }),
      tenantId: created.tenantId,
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "privacy.export.requested"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "privacy.export.completed"),
      true,
    );
  });

  it("TEST 12 — platform operator configura auditoría global", () => {
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
    const config = PrivacyGovernanceRuntime.saveConfiguration({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      tenantId: created.tenantId,
      config: {
        dataControllerName: "Luxury Communities Inc",
        legalContact: "privacy@luxury.example",
      },
      platformOperator: true,
    });
    assert.equal(config.dataControllerName, "Luxury Communities Inc");
  });

  it("TEST 13 — community admin blocked from SaaS control plane export", () => {
    assert.throws(
      () =>
        PrivacyGovernanceRuntime.saveConfiguration({
          actor: actor({
            tenantSlug: "luxury-communities",
            role: "administrator",
            personId: "person-admin",
          }),
          tenantId: "luxury-communities",
          config: { legalContact: "admin@example.com" },
          platformOperator: true,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === PRIVACY_ACCESS_DENIED,
    );
    assert.equal(SAAS_CONTROL_PLANE_FORBIDDEN, "saas_control_plane_forbidden");
    assert.equal(EXPORT_OTHER_PERSON_DATA, "export_other_person_data");
  });
});
