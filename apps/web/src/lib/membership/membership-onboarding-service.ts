/**
 * Membership onboarding runtime — community codes, invitations, guest conversion.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
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
  magicPlusEligible,
  membershipGrantsCommunityAccess,
  type CommunityInvitation,
  type MembershipOnboardingPlane,
  type MembershipRole,
  type OnboardingMembership,
} from "@life-community-os/types";
import { recordInvalidPermission } from "@/lib/platform/platform-operations-store";

let plane: MembershipOnboardingPlane = emptyMembershipOnboardingPlane();

function requireActor(actor: RequestActor): string {
  if (!actor.authenticated || !actor.personId) {
    throw new Error("unauthorized");
  }
  return actor.personId;
}

export function replaceMembershipOnboardingStoreForTests(
  next: MembershipOnboardingPlane = emptyMembershipOnboardingPlane(),
): void {
  plane = next;
}

export function seedMembershipOnboardingForTests(
  input: MembershipOnboardingPlane,
): void {
  plane = input;
}

export function membershipOnboardingSnapshot(): MembershipOnboardingPlane {
  return plane;
}

export const MembershipOnboardingRuntime = {
  register(input: {
    email: string;
    displayName?: string | null;
    providerReference: string;
    body?: Record<string, unknown>;
  }) {
    if (input.body) assertClientCannotSupplyAuthority(input.body);
    const { plane: next, person } = MembershipOnboardingService.registerPerson(
      plane,
      {
        email: input.email,
        displayName: input.displayName,
        providerReference: input.providerReference,
      },
    );
    plane = next;
    return person;
  },

  joinWithCode(input: {
    actor: RequestActor;
    tenantId: string;
    territoryId: string;
    code: string;
  }): OnboardingMembership {
    const personId = requireActor(input.actor);
    if (input.actor.tenantSlug !== input.tenantId) {
      recordInvalidPermission({
        tenantId: input.tenantId,
        actorPersonId: personId,
        action: "membership.onboarding.denied",
      });
      throw new Error(GUEST_ACCESS_DENIED);
    }
    const { plane: next, membership } =
      MembershipOnboardingService.joinWithCommunityCode(plane, {
        personId,
        tenantId: input.tenantId,
        territoryId: input.territoryId,
        code: input.code,
      });
    plane = next;
    return membership;
  },

  createInvitation(input: {
    actor: RequestActor;
    tenantId: string;
    territoryId: string;
    email: string;
    expiresAt: string;
  }): CommunityInvitation {
    if (input.actor.role !== "administrator") {
      throw new Error(GUEST_ACCESS_DENIED);
    }
    const { plane: next, invitation } =
      MembershipOnboardingService.createInvitation(plane, {
        tenantId: input.tenantId,
        territoryId: input.territoryId,
        email: input.email,
        createdBy: requireActor(input.actor),
        expiresAt: input.expiresAt,
      });
    plane = next;
    return invitation;
  },

  acceptInvitation(input: {
    actor: RequestActor;
    invitationId: string;
    email: string;
  }): OnboardingMembership {
    const personId = requireActor(input.actor);
    const { plane: next, membership } =
      MembershipOnboardingService.acceptInvitation(plane, {
        invitationId: input.invitationId,
        personId,
        email: input.email,
      });
    plane = next;
    return membership;
  },

  approveMembership(input: {
    actor: RequestActor;
    membershipId: string;
  }): OnboardingMembership {
    if (input.actor.role !== "administrator") {
      throw new Error(GUEST_ACCESS_DENIED);
    }
    const { plane: next, membership } =
      MembershipOnboardingService.approvePendingMembership(plane, {
        membershipId: input.membershipId,
        actorRole: input.actor.role as MembershipRole,
      });
    plane = next;
    return membership;
  },

  guestAccess(
    resource: Parameters<typeof guestCanAccess>[0]["resource"],
    actor: RequestActor,
  ): boolean {
    const status = plane.memberships.find(
      (row) =>
        row.personId === actor.personId && row.tenantId === actor.tenantSlug,
    )?.status;
    return guestCanAccess({
      resource,
      hasActiveMembership: membershipGrantsCommunityAccess(status ?? "removed"),
    });
  },

  magicPlusVisible(actor: RequestActor, requiredCapability: string): boolean {
    const status = plane.memberships.find(
      (row) =>
        row.personId === actor.personId && row.tenantId === actor.tenantSlug,
    )?.status;
    return magicPlusEligible({
      membershipStatus: status ?? null,
      capabilities: [...actor.permissions],
      requiredCapability,
    });
  },

  listPending(tenantId: string) {
    return plane.memberships.filter(
      (row) => row.tenantId === tenantId && row.status === "pending",
    );
  },

  listInvitations(tenantId: string) {
    return plane.invitations.filter((row) => row.tenantId === tenantId);
  },

  seedCommunityCode(input: {
    code: string;
    tenantId: string;
    territoryId: string;
  }) {
    plane = {
      ...plane,
      codes: [...plane.codes, input],
    };
  },

  assertNoRoleSpoof(body: Record<string, unknown>) {
    assertClientCannotSupplyAuthority(body);
  },
};

export {
  COMMUNITY_CODE_INVALID,
  COMMUNITY_CODE_TERRITORY_DENIED,
  DUPLICATE_IDENTITY,
  INVITATION_INVALID,
  ROLE_SPOOF_FORBIDDEN,
};
