/**
 * Membership onboarding contract tests.
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
  COMMUNITY_CODE_INVALID,
  COMMUNITY_CODE_TERRITORY_DENIED,
  DUPLICATE_IDENTITY,
  GUEST_ACCESS_DENIED,
  INVITATION_INVALID,
  MembershipOnboardingService,
  ROLE_SPOOF_FORBIDDEN,
  assertClientCannotSupplyAuthority,
  emptyMembershipOnboardingPlane,
  guestCanAccess,
  isOpaqueOnboardingEntity,
  magicPlusEligible,
  onboardingDoesNotOwnDomainData,
  onboardingRespectsPrivacy,
  projectRegistrationPerson,
  resolveCommunityCode,
} from "./onboarding-context";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function luxuryPlane() {
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
  const pano = withValley.snapshot.territories.find(
    (row) => row.name === "Panorámica Golf",
  )!;
  const valley = withValley.snapshot.territories.find(
    (row) => row.name === "Valley",
  )!;
  return {
    luxuryId: luxury.result.tenantId,
    pano,
    valley,
  };
}

describe("Membership onboarding", () => {
  it("TEST 1 — registro crea Person", () => {
    const { person } = MembershipOnboardingService.registerPerson(
      emptyMembershipOnboardingPlane(),
      {
        email: "juan@example.com",
        displayName: "Juan",
        providerReference: "auth-juan",
      },
    );
    assert.equal(person.email, "juan@example.com");
    assert.equal(person.displayName, "Juan");
    assert.equal(person.id, "person-auth-juan");
  });

  it("TEST 2 — código válido crea Membership correcta", () => {
    const { luxuryId, pano } = luxuryPlane();
    let plane = emptyMembershipOnboardingPlane();
    plane.codes.push({
      code: "PANORAMICA-2026",
      tenantId: luxuryId,
      territoryId: pano.id,
    });
    const registered = MembershipOnboardingService.registerPerson(plane, {
      email: "maria@example.com",
      displayName: "María",
      providerReference: "auth-maria",
    });
    plane = registered.plane;
    const joined = MembershipOnboardingService.joinWithCommunityCode(plane, {
      personId: registered.person.id,
      tenantId: luxuryId,
      territoryId: pano.id,
      code: "PANORAMICA-2026",
    });
    assert.equal(joined.membership.status, "active");
    assert.equal(joined.membership.territoryId, pano.id);
    assert.equal(joined.membership.role, "member");
  });

  it("TEST 3 — código otro Territory rechazado", () => {
    const { luxuryId, pano, valley } = luxuryPlane();
    const plane = {
      ...emptyMembershipOnboardingPlane(),
      codes: [
        {
          code: "PANORAMICA-2026",
          tenantId: luxuryId,
          territoryId: pano.id,
        },
      ],
      persons: [
        projectRegistrationPerson({
          email: "alex@example.com",
          providerReference: "auth-alex",
        }),
      ],
    };
    assert.throws(
      () =>
        MembershipOnboardingService.joinWithCommunityCode(plane, {
          personId: "person-auth-alex",
          tenantId: luxuryId,
          territoryId: valley.id,
          code: "PANORAMICA-2026",
        }),
      (error: unknown) =>
        error instanceof Error &&
        error.message === COMMUNITY_CODE_TERRITORY_DENIED,
    );
    assert.equal(resolveCommunityCode(plane, "UNKNOWN"), null);
  });

  it("TEST 4 — invitación funciona", () => {
    const { luxuryId, pano } = luxuryPlane();
    let plane = emptyMembershipOnboardingPlane();
    const created = MembershipOnboardingService.createInvitation(plane, {
      tenantId: luxuryId,
      territoryId: pano.id,
      email: "invite@example.com",
      createdBy: "person-admin",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    plane = created.plane;
    const registered = MembershipOnboardingService.registerPerson(plane, {
      email: "invite@example.com",
      providerReference: "auth-invite",
    });
    plane = registered.plane;
    const accepted = MembershipOnboardingService.acceptInvitation(plane, {
      invitationId: created.invitation.id,
      personId: registered.person.id,
      email: "invite@example.com",
    });
    assert.equal(accepted.membership.status, "active");
    assert.equal(
      accepted.plane.invitations.find((row) => row.id === created.invitation.id)
        ?.status,
      "accepted",
    );
  });

  it("TEST 5 — Guest no accede vida privada", () => {
    assert.equal(
      guestCanAccess({
        resource: "private_community",
        hasActiveMembership: false,
      }),
      false,
    );
    assert.equal(
      guestCanAccess({
        resource: "public_place",
        hasActiveMembership: false,
      }),
      true,
    );
    assert.equal(
      guestCanAccess({
        resource: "private_community",
        hasActiveMembership: true,
      }),
      true,
    );
  });

  it("TEST 6 — familia con varias personas permitida", () => {
    const { luxuryId, pano } = luxuryPlane();
    let plane = emptyMembershipOnboardingPlane();
    plane.codes.push({
      code: "HOME-153",
      tenantId: luxuryId,
      territoryId: pano.id,
    });
    for (const ref of ["juan", "maria", "hijo"]) {
      const registered = MembershipOnboardingService.registerPerson(plane, {
        email: `${ref}@home153.example`,
        providerReference: `auth-${ref}`,
      });
      plane = registered.plane;
      const joined = MembershipOnboardingService.joinWithCommunityCode(plane, {
        personId: registered.person.id,
        tenantId: luxuryId,
        territoryId: pano.id,
        code: "HOME-153",
      });
      plane = joined.plane;
    }
    assert.equal(
      MembershipOnboardingService.allowMultipleHouseholdMembers(plane, {
        tenantId: luxuryId,
        territoryId: pano.id,
        personIds: ["person-auth-juan", "person-auth-maria", "person-auth-hijo"],
      }),
      true,
    );
  });

  it("TEST 7 — duplicado identidad bloqueado", () => {
    let plane = emptyMembershipOnboardingPlane();
    const first = MembershipOnboardingService.registerPerson(plane, {
      email: "dup@example.com",
      providerReference: "auth-1",
    });
    plane = first.plane;
    assert.throws(
      () =>
        MembershipOnboardingService.registerPerson(plane, {
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
        assertClientCannotSupplyAuthority({
          role: "administrator",
          tenantId: "luxury-communities",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === ROLE_SPOOF_FORBIDDEN,
    );
    assert.throws(
      () =>
        assertClientCannotSupplyAuthority({
          territoryId: "ter-1",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === ROLE_SPOOF_FORBIDDEN,
    );
  });

  it("TEST 9 — Magic Plus aparece con Membership", () => {
    assert.equal(
      magicPlusEligible({
        membershipStatus: "active",
        capabilities: ["community.experience.create"],
        requiredCapability: "community.experience.create",
      }),
      true,
    );
    assert.equal(
      magicPlusEligible({
        membershipStatus: "pending",
        capabilities: ["community.experience.create"],
        requiredCapability: "community.experience.create",
      }),
      false,
    );
    assert.equal(
      magicPlusEligible({
        membershipStatus: "active",
        capabilities: [],
        requiredCapability: "community.experience.create",
      }),
      false,
    );
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    const { luxuryId, pano, valley } = luxuryPlane();
    assert.notEqual(pano.id, valley.id);
    assert.equal(pano.tenantId, luxuryId);
    assert.equal(valley.tenantId, luxuryId);
    const source = readFileSync(path.join(HERE, "onboarding-context.ts"), "utf8");
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.equal(isOpaqueOnboardingEntity("CrossTenantMembership"), true);
    assert.equal(isOpaqueOnboardingEntity("GlobalUserEntity"), true);
  });

  it("admin approval activates pending membership", () => {
    const { luxuryId, pano } = luxuryPlane();
    let plane = emptyMembershipOnboardingPlane();
    const pending = MembershipOnboardingService.registerPerson(plane, {
      email: "pending@example.com",
      providerReference: "auth-pending",
    });
    plane = pending.plane;
    plane = {
      ...plane,
      memberships: [
        {
          id: "mem-pending",
          personId: pending.person.id,
          tenantId: luxuryId,
          territoryId: pano.id,
          role: "member",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
    const approved = MembershipOnboardingService.approvePendingMembership(plane, {
      membershipId: "mem-pending",
      actorRole: "administrator",
    });
    assert.equal(approved.membership.status, "active");
    assert.throws(
      () =>
        MembershipOnboardingService.approvePendingMembership(plane, {
          membershipId: "mem-pending",
          actorRole: "member",
        }),
      (error: unknown) =>
        error instanceof Error && error.message === GUEST_ACCESS_DENIED,
    );
  });

  it("onboarding integrates with privacy without owning domain data", () => {
    assert.equal(onboardingDoesNotOwnDomainData(), true);
    assert.equal(
      onboardingRespectsPrivacy({
        personalPrivacy: { shareActivity: false, receiveRecommendations: true },
        participationPrivacy: {
          appearInParticipants: false,
          receiveInvitations: true,
          showActivity: false,
        },
      }),
      true,
    );
    assert.throws(
      () =>
        MembershipOnboardingService.acceptInvitation(
          {
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
          },
          {
            invitationId: "inv-expired",
            personId: "person-x",
            email: "x@example.com",
          },
        ),
      (error: unknown) =>
        error instanceof Error && error.message === INVITATION_INVALID,
    );
  });
});
