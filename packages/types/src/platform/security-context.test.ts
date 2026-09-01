/**
 * SaaS security hardening — policy, authorization, privacy foundation.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  createAdminAuditLog,
  sanitizeAuditMetadata,
} from "../domain/admin-audit-log";
import { SAAS_CONTROL_PLANE_FORBIDDEN } from "../domain/admin-operations";
import {
  TenantFactoryService,
  emptyTenantFactorySnapshot,
  rejectClientAuthoritySpoof,
} from "../tenant/factory";
import {
  AuthorizationService,
  CLIENT_CAPABILITY_SPOOF,
  CROSS_TENANT_ACCESS_DENIED,
  CROSS_TENANT_MEDIA_FORBIDDEN,
  PRIVILEGED_CONFIRMATION_REQUIRED,
  REQUEST_SECURITY_PIPELINE,
  TERRITORY_BOUNDARY_VIOLATION,
  assertMediaOwnership,
  assertTenantBoundary,
  auditMetadataIsSanitized,
  clientCannotSupplyAuthority,
  frontendMustNotExposeSecrets,
  isOpaqueSecurityEntity,
  projectPrivacyControlContext,
  projectSecurityCenter,
  projectSecurityPolicyContext,
  requirePrivilegedConfirmation,
  securityDoesNotOwnDomainData,
  spoofDenialCode,
} from "./security-context";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function luxuryTenants() {
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
    snapshot: tenantB.snapshot,
    luxuryId: luxury.result.tenantId,
    bId: tenantB.result.tenantId,
    pano: withValley.snapshot.territories.find(
      (row) => row.name === "Panorámica Golf",
    )!,
    valley: withValley.snapshot.territories.find((row) => row.name === "Valley")!,
  };
}

describe("SaaS security control plane", () => {
  it("TEST 1 — Tenant A cannot read Tenant B", () => {
    const { luxuryId, bId } = luxuryTenants();
    const policy = projectSecurityPolicyContext({
      tenantId: luxuryId,
      platformAccess: true,
      communityAccess: false,
    });
    assert.equal(policy.isolation.tenantIsolation, true);
    assert.equal("content" in policy, false);
    assert.equal("users" in policy, false);
    assert.throws(
      () =>
        assertTenantBoundary({
          actorTenantId: luxuryId,
          resourceTenantId: bId,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === CROSS_TENANT_ACCESS_DENIED,
    );
  });

  it("TEST 2 — territory boundary and authorization matrix", () => {
    const { luxuryId, pano, valley } = luxuryTenants();
    assert.throws(
      () =>
        assertTenantBoundary({
          actorTenantId: luxuryId,
          resourceTenantId: luxuryId,
          actorTerritoryId: pano.id,
          resourceTerritoryId: valley.id,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === TERRITORY_BOUNDARY_VIOLATION,
    );
    assert.equal(
      AuthorizationService.authorize({
        actor: { kind: "member" },
        action: "experienceCreate",
      }),
      "ALLOW",
    );
    assert.equal(
      AuthorizationService.authorize({
        actor: { kind: "member" },
        action: "tenantSuspend",
      }),
      "DENY",
    );
    assert.equal(
      AuthorizationService.authorize({
        actor: { kind: "communityAdministrator" },
        action: "platformFeatureChange",
      }),
      "DENY",
    );
    assert.equal(
      AuthorizationService.authorize({
        actor: { kind: "platformOperator" },
        action: "tenantLifecycle",
      }),
      "ALLOW",
    );
  });

  it("TEST 3 — Community Admin cannot mutate SaaS control plane", () => {
    assert.equal(
      AuthorizationService.authorize({
        actor: { kind: "communityAdministrator" },
        action: "tenantLifecycle",
      }),
      "DENY",
    );
    assert.equal(
      AuthorizationService.authorize({
        actor: { kind: "communityAdministrator" },
        action: "territoryModerate",
      }),
      "ALLOW",
    );
    assert.equal(SAAS_CONTROL_PLANE_FORBIDDEN, "saas_control_plane_forbidden");
  });

  it("TEST 4 — client capability spoof rejected", () => {
    assert.equal(
      rejectClientAuthoritySpoof({ capability: "administrator" }),
      "capability",
    );
    assert.equal(
      rejectClientAuthoritySpoof({ capabilities: ["administrator"] }),
      "capabilities",
    );
    assert.equal(clientCannotSupplyAuthority({ permission: "all" }), false);
    assert.equal(spoofDenialCode("capability"), CLIENT_CAPABILITY_SPOOF);
    assert.equal(clientCannotSupplyAuthority({}), true);
    assert.deepEqual(REQUEST_SECURITY_PIPELINE, [
      "session_validation",
      "tenant_resolution",
      "territory_resolution",
      "capability_check",
      "permission_check",
      "domain_operation",
    ]);
  });

  it("TEST 5 — media cross-tenant blocked", () => {
    const { luxuryId, bId } = luxuryTenants();
    assert.throws(
      () =>
        assertMediaOwnership(
          {
            mediaId: "media-1",
            tenantId: luxuryId,
            storageKey: `${luxuryId}/cover.png`,
          },
          bId,
        ),
      (error: unknown) =>
        error instanceof Error &&
        error.message === CROSS_TENANT_MEDIA_FORBIDDEN,
    );
    assertMediaOwnership(
      {
        mediaId: "media-1",
        tenantId: luxuryId,
        storageKey: `${luxuryId}/cover.png`,
      },
      luxuryId,
    );
  });

  it("TEST 6 — privileged restore confirmation required", () => {
    assert.throws(
      () =>
        requirePrivilegedConfirmation({
          action: "backupRestore",
          explicitConfirmation: false,
        }),
      (error: unknown) =>
        error instanceof Error &&
        error.message === PRIVILEGED_CONFIRMATION_REQUIRED,
    );
    requirePrivilegedConfirmation({
      action: "tenantSuspend",
      explicitConfirmation: true,
    });
    requirePrivilegedConfirmation({
      action: "deleteConfiguration",
      explicitConfirmation: true,
    });
  });

  it("TEST 7 — security audit generated", () => {
    const log = createAdminAuditLog({
      tenantId: "luxury-communities",
      actorPersonId: "person-platform",
      actorRole: "platform_operator",
      action: "security.cross_tenant.blocked",
      entityType: "security",
      entityId: "tenant-b",
      metadata: { kind: "cross_tenant" },
    });
    assert.equal(log.action, "security.cross_tenant.blocked");
    assert.ok(log.actorPersonId);
    assert.ok(log.tenantId);
    assert.ok(log.createdAt);
    const center = projectSecurityCenter({
      events: [
        {
          kind: "cross_tenant",
          tenantId: log.tenantId,
          actorPersonId: log.actorPersonId,
          timestamp: log.createdAt,
          action: "security.cross_tenant.blocked",
        },
      ],
      audit: [
        {
          actor: log.actorPersonId,
          tenantId: log.tenantId,
          action: log.action,
          timestamp: log.createdAt,
          metadata: log.metadata,
        },
      ],
    });
    assert.equal(center.boundaryEvents.length, 1);
    assert.equal(center.auditSecurity.length, 1);
  });

  it("TEST 8 — secret metadata sanitized", () => {
    const sanitized = sanitizeAuditMetadata({
      password: "secret-pass",
      token: "tok",
      secret: "svc",
      cookie: "sid",
      api_key: "k",
      action: "suspend",
    });
    assert.equal(sanitized?.action, "suspend");
    assert.equal(sanitized?.password, undefined);
    assert.equal(sanitized?.token, undefined);
    assert.equal(sanitized?.secret, undefined);
    assert.equal(sanitized?.cookie, undefined);
    assert.equal(sanitized?.api_key, undefined);
    assert.equal(
      auditMetadataIsSanitized({ password: "x", reason: "ops" }),
      true,
    );
    assert.equal(
      frontendMustNotExposeSecrets(["NEXT_PUBLIC_SUPABASE_URL"]),
      true,
    );
    assert.equal(
      frontendMustNotExposeSecrets(["SUPABASE_SERVICE_ROLE_KEY"]),
      false,
    );
  });

  it("TEST 9 — Platform Operator allowed", () => {
    assert.equal(
      AuthorizationService.authorize({
        actor: { kind: "platformOperator" },
        action: "tenantExport",
      }),
      "ALLOW",
    );
    assert.equal(
      AuthorizationService.authorize({
        actor: { kind: "platformOperator" },
        action: "backupRestore",
      }),
      "ALLOW",
    );
    const policy = projectSecurityPolicyContext({
      tenantId: "luxury-communities",
      platformAccess: true,
      communityAccess: false,
    });
    assert.equal(policy.permissions.platformAccess, true);
    assert.equal(policy.policies.exportAllowed, true);
  });

  it("TEST 10 — Valley separated from Panorámica; opaque entities absent", () => {
    const { luxuryId, pano, valley } = luxuryTenants();
    assert.notEqual(pano.id, valley.id);
    assert.equal(pano.tenantId, luxuryId);
    assert.equal(valley.tenantId, luxuryId);
    assert.throws(
      () =>
        assertTenantBoundary({
          actorTenantId: luxuryId,
          resourceTenantId: luxuryId,
          actorTerritoryId: valley.id,
          resourceTerritoryId: pano.id,
        }),
      (error: unknown) =>
        error instanceof Error && error.message === TERRITORY_BOUNDARY_VIOLATION,
    );
    const privacy = projectPrivacyControlContext(luxuryId);
    assert.equal(privacy.implemented, false);
    assert.equal(privacy.capabilities.deleteAccount, false);
    assert.equal(securityDoesNotOwnDomainData(), true);
    assert.equal(isOpaqueSecurityEntity("GlobalSecurityEntity"), true);
    assert.equal(isOpaqueSecurityEntity("UniversalPermissionEntity"), true);
    assert.equal(isOpaqueSecurityEntity("SecurityScore"), true);
    assert.equal(isOpaqueSecurityEntity("ComplianceScore"), true);
    assert.equal(isOpaqueSecurityEntity("GlobalBanSystem"), true);
    assert.equal(isOpaqueSecurityEntity("CrossTenantAdmin"), true);
    assert.equal(isOpaqueSecurityEntity("PlatformContentAccess"), true);
    const source = readFileSync(path.join(HERE, "security-context.ts"), "utf8");
    assert.equal(/if tenant === panoramica/.test(source), false);
  });
});
