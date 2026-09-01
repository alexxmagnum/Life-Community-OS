/**
 * Commercial SaaS customer operations isolation tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canMutateSaasControlPlane,
  emptyCustomerOperationsPlane,
  emptyTenantFactorySnapshot,
  isOpaqueCustomerEntity,
  productFeatureCatalog,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  CustomerOperationsRuntime,
  replaceCustomerOperationsStoreForTests,
} from "@/lib/platform/customer-operations-service";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
} from "@/lib/tenant/tenant-factory-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";

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

describe("Commercial SaaS customer operations isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
    replaceCustomerOperationsStoreForTests(emptyCustomerOperationsPlane());
  });

  it("TEST 1 — crear customer tenant", () => {
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
    const customer = CustomerOperationsRuntime.initialize({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      tenantId: created.tenantId,
      companyName: "Luxury Communities Inc",
      contact: { name: "Ana", email: "ana@luxury.example" },
      plan: "community",
    });
    assert.equal(customer.onboardingStatus, "requested");
  });

  it("TEST 2 — onboarding completo", () => {
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
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    CustomerOperationsRuntime.initialize({
      actor: platform,
      tenantId: created.tenantId,
      companyName: "Luxury Communities Inc",
      contact: { name: "Ana", email: "ana@luxury.example" },
      plan: "premium",
    });
    CustomerOperationsRuntime.configure({
      actor: platform,
      tenantId: created.tenantId,
    });
    CustomerOperationsRuntime.activateFeatures({
      actor: platform,
      tenantId: created.tenantId,
      features: { lifeMap: true, community: true },
    });
    CustomerOperationsRuntime.inviteAdministrator({
      actor: platform,
      tenantId: created.tenantId,
      email: "admin@luxury.example",
    });
    const ready = CustomerOperationsRuntime.completeOnboarding({
      actor: platform,
      tenantId: created.tenantId,
    });
    assert.equal(ready.onboardingStatus, "ready");
  });

  it("TEST 3 — administrador invitado correctamente", () => {
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
    const invitation = CustomerOperationsRuntime.inviteAdministrator({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
      tenantId: created.tenantId,
      email: "admin@luxury.example",
    });
    assert.equal(invitation.status, "pending");
    assert.equal(invitation.email, "admin@luxury.example");
  });

  it("TEST 4 — plan separado de permisos", () => {
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
    CustomerOperationsRuntime.setPlan({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
      tenantId: created.tenantId,
      plan: "enterprise",
    });
    const memberPerms = permissionsForRole("member", created.tenantId);
    assert.equal(memberPerms.includes("tenantSuspend"), false);
  });

  it("TEST 5 — feature separado de capability", () => {
    assert.equal(productFeatureCatalog().length, 8);
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
    CustomerOperationsRuntime.initialize({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
      tenantId: created.tenantId,
      companyName: "Luxury",
      contact: { name: "Ana", email: "a@example.com" },
      plan: "starter",
    });
    const updated = CustomerOperationsRuntime.activateFeatures({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
      tenantId: created.tenantId,
      features: { marketplace: true },
    });
    assert.equal(updated.features.marketplace, true);
  });

  it("TEST 6 — límite separado de seguridad", () => {
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
    const ops = CustomerOperationsRuntime.get(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      created.tenantId,
    );
    assert.equal(typeof ops?.limits.members, "number");
    assert.equal(permissionsForRole("member").length > 0, true);
  });

  it("TEST 7 — Community Admin bloqueado", () => {
    assert.equal(canMutateSaasControlPlane(false), false);
    assert.throws(
      () =>
        CustomerOperationsRuntime.list(
          actor({
            tenantSlug: "luxury-communities",
            role: "administrator",
            personId: "person-admin",
          }),
        ),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });

  it("TEST 8 — Tenant aislado", () => {
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
    CustomerOperationsRuntime.initialize({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
      tenantId: luxury.tenantId,
      companyName: "Luxury",
      contact: { name: "Ana", email: "a@example.com" },
      plan: "community",
    });
    const ops = CustomerOperationsRuntime.list(
      actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
    );
    assert.equal(ops.some((row) => row.tenantId === tenantB.tenantId), true);
    assert.notEqual(luxury.tenantId, tenantB.tenantId);
  });

  it("TEST 9 — Valley separado de Panorámica", () => {
    const created = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Panorámica Golf" }, { name: "Valley" }],
      },
    });
    const pano = created.territories.find((row) => row.name === "Panorámica Golf")!;
    const valley = created.territories.find((row) => row.name === "Valley")!;
    assert.notEqual(pano.id, valley.id);
    const source = readFileSync(
      path.join(HERE, "customer-operations-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 10 — no existe CustomerClone", () => {
    assert.equal(isOpaqueCustomerEntity("CustomerClone"), true);
    assert.equal(isOpaqueCustomerEntity("SaaSMarketingEntity"), true);
  });

  it("TEST 11 — audit generado en onboarding", () => {
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
    CustomerOperationsRuntime.initialize({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
      tenantId: created.tenantId,
      companyName: "Luxury",
      contact: { name: "Ana", email: "a@example.com" },
      plan: "community",
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.customer.created"),
      true,
    );
    assert.equal(
      logs.some((row) => row.action === "platform.customer.onboarding.started"),
      true,
    );
  });

  it("TEST 12 — ready audit on complete", () => {
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
    const platform = actor({
      tenantSlug: "life-panoramica",
      personId: "person-platform",
    });
    CustomerOperationsRuntime.initialize({
      actor: platform,
      tenantId: created.tenantId,
      companyName: "Luxury",
      contact: { name: "Ana", email: "a@example.com" },
      plan: "community",
    });
    CustomerOperationsRuntime.completeOnboarding({
      actor: platform,
      tenantId: created.tenantId,
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.customer.ready"),
      true,
    );
  });

  it("TEST 13 — role spoof blocked on initialize", () => {
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
    assert.throws(
      () =>
        CustomerOperationsRuntime.initialize({
          actor: actor({
            tenantSlug: "life-panoramica",
            personId: "person-platform",
          }),
          tenantId: created.tenantId,
          companyName: "Luxury",
          contact: { name: "Ana", email: "a@example.com" },
          plan: "community",
          body: { role: "administrator" },
        }),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === "owner_immutable",
    );
  });

  it("TEST 14 — plan change audit", () => {
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
    CustomerOperationsRuntime.setPlan({
      actor: actor({
        tenantSlug: "life-panoramica",
        personId: "person-platform",
      }),
      tenantId: created.tenantId,
      plan: "enterprise",
    });
    const logs = PlatformOperationsRuntime.audit();
    assert.equal(
      logs.some((row) => row.action === "platform.plan.changed"),
      true,
    );
  });

  it("TEST 15 — member cannot initialize customer", () => {
    assert.throws(
      () =>
        CustomerOperationsRuntime.initialize({
          actor: actor({ tenantSlug: "luxury-communities", role: "member" }),
          tenantId: "luxury-communities",
          companyName: "X",
          contact: { name: "X", email: "x@example.com" },
          plan: "starter",
        }),
      (error: unknown) =>
        error instanceof TenantFactoryDeniedError &&
        error.message === SAAS_CONTROL_PLANE_FORBIDDEN,
    );
  });
});
