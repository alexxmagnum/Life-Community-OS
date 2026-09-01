/**
 * Membership experience — bridges onboarding plane to domain membership (SoT).
 */

import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  resolveLifeHomeMembershipScope,
  type MembershipStatus,
} from "@life-community-os/types";
import {
  resolveMembershipAccessScope,
  type MembershipExperienceContext,
} from "@/lib/membership/membership-experience-scope";
import {
  commitOnboardingMembership,
  ensurePersonIdentity,
  type DomainMembershipResult,
} from "@/lib/auth/ensure-domain-membership";
import {
  MembershipOnboardingRuntime,
  membershipOnboardingSnapshot,
} from "@/lib/membership/membership-onboarding-service";
import { LIFE_PANORAMICA_TENANT_SLUG } from "@/lib/tenant/ids";
import { defaultTerritoryIdForIdentity } from "@/lib/tenant/territory-catalog";

export type { MembershipAccessScope, MembershipExperienceContext } from "@/lib/membership/membership-experience-scope";

function seedDefaultCommunityCodes(): void {
  if (process.env.NODE_ENV === "production") return;
  const plane = membershipOnboardingSnapshot();
  if (plane.codes.length > 0) return;
  const territoryId = defaultTerritoryIdForIdentity(LIFE_PANORAMICA_TENANT_SLUG);
  if (!territoryId) return;
  MembershipOnboardingRuntime.seedCommunityCode({
    code: "PANORAMICA",
    tenantId: LIFE_PANORAMICA_TENANT_SLUG,
    territoryId,
  });
}

function resolveAccessScope(actor: RequestActor): MembershipExperienceContext {
  seedDefaultCommunityCodes();
  return resolveMembershipAccessScope(actor);
}

export const MembershipExperienceService = {
  resolveAccessScope,

  resolveAccessFromSession(input: {
    authenticated: boolean;
    hasMembership: boolean;
    membershipStatus: MembershipStatus | null;
    role: RequestActor["role"];
  }): MembershipExperienceContext {
    return resolveAccessScope({
      authenticated: input.authenticated,
      hasMembership: input.hasMembership,
      membershipStatus: input.membershipStatus,
      role: input.role,
      providerReference: null,
      personId: null,
      tenantSlug: "",
      membershipId: null,
      permissions: [],
      tenantDenied: false,
      currentUser: {
        ...EMPTY_CURRENT_USER,
        authenticated: input.authenticated,
        hasMembership: input.hasMembership,
        membershipStatus: input.membershipStatus,
        role: input.role,
      },
    });
  },

  homeMembershipScope(actor: RequestActor) {
    return resolveLifeHomeMembershipScope({
      hasMembership: actor.hasMembership,
      membershipStatus: actor.membershipStatus,
    });
  },

  async ensureActorPerson(actor: RequestActor): Promise<string> {
    if (actor.personId) return actor.personId;
    if (!actor.providerReference) {
      throw new Error("unauthorized");
    }
    const created = await ensurePersonIdentity({
      tenantSlug: actor.tenantSlug,
      providerReference: actor.providerReference,
      email: actor.currentUser.email,
      displayName: actor.currentUser.displayName,
    });
    return created.personId;
  },

  async joinWithCommunityCode(input: {
    actor: RequestActor;
    tenantId: string;
    territoryId: string;
    code: string;
  }): Promise<DomainMembershipResult> {
    seedDefaultCommunityCodes();
    const personId = await MembershipExperienceService.ensureActorPerson(
      input.actor,
    );
    const actorWithPerson: RequestActor = {
      ...input.actor,
      personId,
    };
    const onboarding = MembershipOnboardingRuntime.joinWithCode({
      actor: actorWithPerson,
      tenantId: input.tenantId,
      territoryId: input.territoryId,
      code: input.code,
    });
    if (!input.actor.providerReference) {
      throw new Error("unauthorized");
    }
    return commitOnboardingMembership({
      tenantSlug: input.tenantId,
      providerReference: input.actor.providerReference,
      email: input.actor.currentUser.email,
      displayName: input.actor.currentUser.displayName,
      territoryId: input.territoryId,
      role: onboarding.role,
      status: onboarding.status,
    });
  },

  async acceptInvitation(input: {
    actor: RequestActor;
    invitationId: string;
    email: string;
    tenantId: string;
  }): Promise<DomainMembershipResult> {
    const personId = await MembershipExperienceService.ensureActorPerson(
      input.actor,
    );
    const onboarding = MembershipOnboardingRuntime.acceptInvitation({
      actor: { ...input.actor, personId },
      invitationId: input.invitationId,
      email: input.email,
    });
    if (!input.actor.providerReference) {
      throw new Error("unauthorized");
    }
    return commitOnboardingMembership({
      tenantSlug: input.tenantId,
      providerReference: input.actor.providerReference,
      email: input.email,
      displayName: input.actor.currentUser.displayName,
      territoryId: onboarding.territoryId,
      role: onboarding.role,
      status: onboarding.status,
    });
  },
};
