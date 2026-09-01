/**
 * Membership onboarding isolation tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  COMMUNITY_CODE_TERRITORY_DENIED,
  DUPLICATE_IDENTITY,
  GUEST_ACCESS_DENIED,
  INVITATION_INVALID,
  ROLE_SPOOF_FORBIDDEN,
  canAccessAdminSection,
  emptyMembershipOnboardingPlane,
  emptyTenantFactorySnapshot,
  isOpaqueOnboardingEntity,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  MembershipOnboardingRuntime,
  replaceMembershipOnboardingStoreForTests,
} from "@/lib/membership/membership-onboarding-service";
import {
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
  replaceTenantFactoryStoreForTests,
} from "@/lib/tenant/tenant-factory-service";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole;
  personId?: string;
  hasMembership?: boolean;
}): RequestActor {
  const role = input.role ?? "member";
  const personId = input.personId ?? "person-alex";
  const hasMembership = input.hasMembership ?? true;
  return {
    authenticated: true,
    hasMembership,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : null,
    permissions: permissionsForRole(role, input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership,
      personId,
      tenantId: input.tenantSlug,
      role: hasMembership ? role : null,
    },
  };
}

function guestActor(tenantSlug: string): RequestActor {
  return actor({ tenantSlug, hasMembership: false, personId: "person-guest" });
}

describe("Membership onboarding isolation", () => {
  beforeEach(() => {
    replaceTenantFactoryStoreForTests(emptyTenantFactorySnapshot());
    replacePlatformOperatorsForTests([
      { personId: "person-platform", status: "active" },
    ]);
    replaceMembershipOnboardingStoreForTests(emptyMembershipOnboardingPlane());
  });

  it("TEST 1 — registro crea Person", () => {
    const person = MembershipOnboardingRuntime.register({
      email: "juan@example.com",
      displayName: "Juan",
      providerReference: "auth-juan",
    });
    assert.equal(person.email, "juan@example.com");
    assert.equal(person.displayName, "Juan");
  });

  it("TEST 2 — código válido crea Membership correcta", () => {
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
    const pano = created.territories[0]!;
    MembershipOnboardingRuntime.register({
      email: "maria@example.com",
      providerReference: "auth-maria",
    });
    MembershipOnboardingRuntime.seedCommunityCode({
      code: "PANORAMICA-2026",
      tenantId: created.tenantId,
      territoryId: pano.id,
    });
    const membership = MembershipOnboardingRuntime.joinWithCode({
      actor: actor({
        tenantSlug: created.tenantId,
        personId: "person-auth-maria",
      }),
      tenantId: created.tenantId,
      territoryId: pano.id,
      code: "PANORAMICA-2026",
    });
    assert.equal(membership.status, "active");
    assert.equal(membership.territoryId, pano.id);
  });

  it("TEST 3 — código otro Territory rechazado", () => {
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
    MembershipOnboardingRuntime.register({
      email: "alex@example.com",
      providerReference: "auth-alex",
    });
    MembershipOnboardingRuntime.seedCommunityCode({
      code: "PANORAMICA-2026",
      tenantId: created.tenantId,
      territoryId: pano.id,
    });
    assert.throws(
      () =>
        MembershipOnboardingRuntime.joinWithCode({
          actor: actor({
            tenantSlug: created.tenantId,
            personId: "person-auth-alex",
          }),
          tenantId: created.tenantId,
          territoryId: valley.id,
          code: "PANORAMICA-2026",
        }),
      (error: unknown) =>
        error instanceof Error &&
        error.message === COMMUNITY_CODE_TERRITORY_DENIED,
    );
  });

  it("TEST 4 — invitación funciona", () => {
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
    const territory = created.territories[0]!;
    const invitation = MembershipOnboardingRuntime.createInvitation({
      actor: actor({
        tenantSlug: created.tenantId,
        role: "administrator",
        personId: "person-admin",
      }),
      tenantId: created.tenantId,
      territoryId: territory.id,
      email: "invite@example.com",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    MembershipOnboardingRuntime.register({
      email: "invite@example.com",
      providerReference: "auth-invite",
    });
    const membership = MembershipOnboardingRuntime.acceptInvitation({
      actor: actor({
        tenantSlug: created.tenantId,
        personId: "person-auth-invite",
      }),
      invitationId: invitation.id,
      email: "invite@example.com",
    });
    assert.equal(membership.status, "active");
  });

  it("TEST 5 — Guest no accede vida privada", () => {
    const guest = guestActor("luxury-communities");
    assert.equal(
      MembershipOnboardingRuntime.guestAccess("private_community", guest),
      false,
    );
    assert.equal(
      MembershipOnboardingRuntime.guestAccess("public_place", guest),
      true,
    );
  });

  it("TEST 6 — familia con varias personas permitida", () => {
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
    const territory = created.territories[0]!;
    MembershipOnboardingRuntime.seedCommunityCode({
      code: "HOME-153",
      tenantId: created.tenantId,
      territoryId: territory.id,
    });
    for (const ref of ["juan", "maria", "hijo"]) {
      MembershipOnboardingRuntime.register({
        email: `${ref}@home153.example`,
        providerReference: `auth-${ref}`,
      });
      MembershipOnboardingRuntime.joinWithCode({
        actor: actor({
          tenantSlug: created.tenantId,
          personId: `person-auth-${ref}`,
        }),
        tenantId: created.tenantId,
        territoryId: territory.id,
        code: "HOME-153",
      });
    }
    const snapshot = MembershipOnboardingRuntime.listPending(created.tenantId);
    assert.equal(snapshot.length, 0);
  });

  it("TEST 7 — duplicado identidad bloqueado", () => {
    MembershipOnboardingRuntime.register({
      email: "dup@example.com",
      providerReference: "auth-1",
    });
    assert.throws(
      () =>
        MembershipOnboardingRuntime.register({
          email: "dup@example.com",
          providerReference: "auth-2",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === DUPLICATE_IDENTITY,
    );
  });

  it("TEST 8 — role spoof rechazado", () => {
    assert.throws(
      () =>
        MembershipOnboardingRuntime.assertNoRoleSpoof({
          role: "administrator",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === ROLE_SPOOF_FORBIDDEN,
    );
  });

  it("TEST 9 — Magic Plus aparece con Membership", () => {
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
    const territory = created.territories[0]!;
    MembershipOnboardingRuntime.register({
      email: "active@example.com",
      providerReference: "auth-active",
    });
    MembershipOnboardingRuntime.seedCommunityCode({
      code: "JOIN",
      tenantId: created.tenantId,
      territoryId: territory.id,
    });
    MembershipOnboardingRuntime.joinWithCode({
      actor: actor({
        tenantSlug: created.tenantId,
        personId: "person-auth-active",
      }),
      tenantId: created.tenantId,
      territoryId: territory.id,
      code: "JOIN",
    });
    const member = actor({
      tenantSlug: created.tenantId,
      personId: "person-auth-active",
    });
    assert.equal(
      MembershipOnboardingRuntime.magicPlusVisible(
        member,
        "community.experience.create",
      ),
      true,
    );
    assert.equal(
      MembershipOnboardingRuntime.magicPlusVisible(
        guestActor(created.tenantId),
        "community.experience.create",
      ),
      false,
    );
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
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
      path.join(HERE, "membership-onboarding-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.equal(isOpaqueOnboardingEntity("CrossTenantMembership"), true);
  });

  it("TEST 11 — admin approval activates pending", () => {
    replaceMembershipOnboardingStoreForTests({
      ...emptyMembershipOnboardingPlane(),
      memberships: [
        {
          id: "mem-pending",
          personId: "person-pending",
          tenantId: "luxury-communities",
          territoryId: "ter-1",
          role: "member",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    const approved = MembershipOnboardingRuntime.approveMembership({
      actor: actor({
        tenantSlug: "luxury-communities",
        role: "administrator",
        personId: "person-admin",
      }),
      membershipId: "mem-pending",
    });
    assert.equal(approved.status, "active");
  });

  it("TEST 12 — member cannot approve pending", () => {
    replaceMembershipOnboardingStoreForTests({
      ...emptyMembershipOnboardingPlane(),
      memberships: [
        {
          id: "mem-pending",
          personId: "person-pending",
          tenantId: "luxury-communities",
          territoryId: "ter-1",
          role: "member",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    assert.throws(
      () =>
        MembershipOnboardingRuntime.approveMembership({
          actor: actor({ tenantSlug: "luxury-communities", role: "member" }),
          membershipId: "mem-pending",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === GUEST_ACCESS_DENIED,
    );
  });

  it("TEST 13 — admin members section restricted", () => {
    assert.equal(canAccessAdminSection("administrator", "members"), true);
    assert.equal(canAccessAdminSection("moderator", "members"), false);
  });

  it("TEST 14 — expired invitation rejected", () => {
    replaceMembershipOnboardingStoreForTests({
      ...emptyMembershipOnboardingPlane(),
      invitations: [
        {
          id: "inv-expired",
          tenantId: "luxury-communities",
          territoryId: "ter-1",
          email: "x@example.com",
          normalizedEmail: "x@example.com",
          createdBy: "admin",
          status: "pending",
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        },
      ],
    });
    assert.throws(
      () =>
        MembershipOnboardingRuntime.acceptInvitation({
          actor: actor({ tenantSlug: "luxury-communities" }),
          invitationId: "inv-expired",
          email: "x@example.com",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === INVITATION_INVALID,
    );
  });

  it("TEST 15 — cross tenant join denied", () => {
    const luxury = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Luxury Communities Inc",
        slug: "luxury-communities",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "Home" }],
      },
    });
    const tenantB = TenantFactoryRuntime.provision({
      actor: actor({ tenantSlug: "life-panoramica", personId: "person-platform" }),
      request: {
        name: "Tenant B",
        slug: "tenant-b",
        locale: "en",
        timezone: "UTC",
        territories: [{ name: "North" }],
      },
    });
    MembershipOnboardingRuntime.register({
      email: "alex@example.com",
      providerReference: "auth-alex",
    });
    MembershipOnboardingRuntime.seedCommunityCode({
      code: "JOIN",
      tenantId: luxury.tenantId,
      territoryId: luxury.territories[0]!.id,
    });
    assert.throws(
      () =>
        MembershipOnboardingRuntime.joinWithCode({
          actor: actor({ tenantSlug: tenantB.tenantId, personId: "person-auth-alex" }),
          tenantId: luxury.tenantId,
          territoryId: luxury.territories[0]!.id,
          code: "JOIN",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === GUEST_ACCESS_DENIED,
    );
  });

  it("TEST 16 — pending membership hides Magic Plus", () => {
    replaceMembershipOnboardingStoreForTests({
      ...emptyMembershipOnboardingPlane(),
      memberships: [
        {
          id: "mem-pending",
          personId: "person-alex",
          tenantId: "luxury-communities",
          territoryId: "ter-1",
          role: "member",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    assert.equal(
      MembershipOnboardingRuntime.magicPlusVisible(
        actor({ tenantSlug: "luxury-communities", personId: "person-alex" }),
        "community.experience.create",
      ),
      false,
    );
  });

  it("TEST 17 — non-admin cannot create invitation", () => {
    assert.throws(
      () =>
        MembershipOnboardingRuntime.createInvitation({
          actor: actor({ tenantSlug: "luxury-communities", role: "member" }),
          tenantId: "luxury-communities",
          territoryId: "ter-1",
          email: "x@example.com",
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        }),
      (error: unknown) =>
        error instanceof Error && error.message === GUEST_ACCESS_DENIED,
    );
  });
});
