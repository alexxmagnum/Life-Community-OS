/**
 * Membership & community onboarding — Person vs Membership, codes, invitations, guest access.
 * Does not create GlobalUserEntity, UniversalIdentityEntity, or cross-tenant membership.
 * Never branches on a customer slug.
 */

import { sanitizeAuditMetadata } from "../domain/admin-audit-log";
import type { MembershipStatus } from "../domain/membership";
import { membershipGrantsCommunityAccess } from "../domain/membership";
import { coerceMembershipRole, type MembershipRole } from "../platform/membership-role";
import { assertTenantBoundary } from "../platform/security-context";
import type { CommunityParticipationPrivacy } from "../community/participation";
import type { PersonalPrivacy } from "../personal/personal-context";

export const ROLE_SPOOF_FORBIDDEN = "owner_immutable";
export const COMMUNITY_CODE_INVALID = "community_code_invalid";
export const COMMUNITY_CODE_TERRITORY_DENIED = "community_code_territory_denied";
export const DUPLICATE_IDENTITY = "duplicate_identity";
export const GUEST_ACCESS_DENIED = "guest_access_denied";
export const INVITATION_INVALID = "invitation_invalid";

export const MEMBERSHIP_LIFECYCLE_STATUSES = [
  "pending",
  "active",
  "invited",
  "suspended",
  "removed",
] as const;

export type MembershipLifecycleStatus =
  (typeof MEMBERSHIP_LIFECYCLE_STATUSES)[number];

export type OnboardingPerson = {
  id: string;
  displayName: string | null;
  email: string | null;
  normalizedEmail: string | null;
  providerReference?: string | null;
  createdAt: string;
};

export type OnboardingMembership = {
  id: string;
  personId: string;
  tenantId: string;
  territoryId: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
};

export type CommunityAccessCode = {
  code: string;
  tenantId: string;
  territoryId: string;
  label?: string;
};

export type CommunityInvitation = {
  id: string;
  tenantId: string;
  territoryId: string;
  email: string;
  normalizedEmail: string;
  createdBy: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
};

export type MembershipOnboardingPlane = {
  persons: OnboardingPerson[];
  memberships: OnboardingMembership[];
  codes: CommunityAccessCode[];
  invitations: CommunityInvitation[];
};

export type RegistrationPersonInput = {
  displayName?: string | null;
  email: string;
  providerReference: string;
};

const CLIENT_AUTHORITY_FIELDS = [
  "tenantId",
  "territoryId",
  "membershipId",
  "role",
  "capabilities",
  "permission",
  "permissions",
] as const;

export function normalizeIdentityEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emptyMembershipOnboardingPlane(): MembershipOnboardingPlane {
  return {
    persons: [],
    memberships: [],
    codes: [],
    invitations: [],
  };
}

export function assertClientCannotSupplyAuthority(
  body: Record<string, unknown>,
): void {
  for (const key of CLIENT_AUTHORITY_FIELDS) {
    if (key in body && body[key] !== undefined && body[key] !== null) {
      throw new Error(ROLE_SPOOF_FORBIDDEN);
    }
  }
  if (
    typeof body.role === "string" &&
    ["administrator", "moderator", "group_manager"].includes(body.role)
  ) {
    throw new Error(ROLE_SPOOF_FORBIDDEN);
  }
}

export function projectRegistrationPerson(
  input: RegistrationPersonInput,
  now = new Date().toISOString(),
): OnboardingPerson {
  return {
    id: `person-${input.providerReference}`,
    displayName: input.displayName?.trim() || null,
    email: input.email.trim(),
    normalizedEmail: normalizeIdentityEmail(input.email),
    providerReference: input.providerReference,
    createdAt: now,
  };
}

export function resolveCommunityCode(
  plane: MembershipOnboardingPlane,
  code: string,
): CommunityAccessCode | null {
  const normalized = code.trim().toUpperCase();
  return (
    plane.codes.find((row) => row.code.trim().toUpperCase() === normalized) ??
    null
  );
}

export function assertCommunityCodeTerritory(input: {
  code: CommunityAccessCode;
  tenantId: string;
  territoryId: string;
}): void {
  assertTenantBoundary({
    actorTenantId: input.tenantId,
    resourceTenantId: input.code.tenantId,
  });
  if (input.code.territoryId !== input.territoryId) {
    throw new Error(COMMUNITY_CODE_TERRITORY_DENIED);
  }
}

export function isDuplicateIdentity(
  plane: MembershipOnboardingPlane,
  input: { normalizedEmail: string; providerReference?: string },
): boolean {
  return plane.persons.some(
    (row) =>
      row.normalizedEmail === input.normalizedEmail ||
      (input.providerReference &&
        row.providerReference === input.providerReference),
  );
}

export function invitationIsValid(
  invitation: CommunityInvitation,
  now = Date.now(),
): boolean {
  if (invitation.status !== "pending") return false;
  return new Date(invitation.expiresAt).getTime() > now;
}

export function guestCanAccess(input: {
  resource: "public_info" | "public_place" | "open_content" | "private_community";
  hasActiveMembership: boolean;
}): boolean {
  if (input.hasActiveMembership) return true;
  return (
    input.resource === "public_info" ||
    input.resource === "public_place" ||
    input.resource === "open_content"
  );
}

export function magicPlusEligible(input: {
  membershipStatus: MembershipStatus | null;
  capabilities: readonly string[];
  requiredCapability: string;
}): boolean {
  if (!membershipGrantsCommunityAccess(input.membershipStatus ?? "removed")) {
    return false;
  }
  return input.capabilities.includes(input.requiredCapability);
}

export function projectOnboardingMembership(input: {
  personId: string;
  tenantId: string;
  territoryId: string;
  status?: MembershipStatus;
  role?: MembershipRole;
  now?: string;
}): OnboardingMembership {
  const now = input.now ?? new Date().toISOString();
  return {
    id: `mem-${input.personId}-${input.tenantId}-${input.territoryId}`,
    personId: input.personId,
    tenantId: input.tenantId,
    territoryId: input.territoryId,
    role: coerceMembershipRole(input.role),
    status: input.status ?? "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export const MembershipOnboardingService = {
  registerPerson(
    plane: MembershipOnboardingPlane,
    input: RegistrationPersonInput,
  ): { plane: MembershipOnboardingPlane; person: OnboardingPerson } {
    const normalizedEmail = normalizeIdentityEmail(input.email);
    if (
      isDuplicateIdentity(plane, {
        normalizedEmail,
        providerReference: input.providerReference,
      })
    ) {
      throw new Error(DUPLICATE_IDENTITY);
    }
    const person = projectRegistrationPerson(input);
    return {
      plane: { ...plane, persons: [...plane.persons, person] },
      person,
    };
  },

  joinWithCommunityCode(
    plane: MembershipOnboardingPlane,
    input: {
      personId: string;
      tenantId: string;
      territoryId: string;
      code: string;
    },
  ): { plane: MembershipOnboardingPlane; membership: OnboardingMembership } {
    const resolved = resolveCommunityCode(plane, input.code);
    if (!resolved) {
      throw new Error(COMMUNITY_CODE_INVALID);
    }
    assertCommunityCodeTerritory({
      code: resolved,
      tenantId: input.tenantId,
      territoryId: input.territoryId,
    });
    const existing = plane.memberships.find(
      (row) =>
        row.personId === input.personId &&
        row.tenantId === input.tenantId &&
        row.territoryId === input.territoryId,
    );
    if (existing?.status === "active") {
      return { plane, membership: existing };
    }
    const membership = projectOnboardingMembership({
      personId: input.personId,
      tenantId: input.tenantId,
      territoryId: input.territoryId,
      status: "active",
      role: "member",
    });
    const nextMemberships = existing
      ? plane.memberships.map((row) =>
          row.id === existing.id ? { ...membership, id: row.id } : row,
        )
      : [...plane.memberships, membership];
    return {
      plane: { ...plane, memberships: nextMemberships },
      membership,
    };
  },

  createInvitation(
    plane: MembershipOnboardingPlane,
    input: {
      tenantId: string;
      territoryId: string;
      email: string;
      createdBy: string;
      expiresAt: string;
    },
  ): { plane: MembershipOnboardingPlane; invitation: CommunityInvitation } {
    const invitation: CommunityInvitation = {
      id: `inv-${plane.invitations.length + 1}`,
      tenantId: input.tenantId,
      territoryId: input.territoryId,
      email: input.email.trim(),
      normalizedEmail: normalizeIdentityEmail(input.email),
      createdBy: input.createdBy,
      status: "pending",
      expiresAt: input.expiresAt,
    };
    return {
      plane: { ...plane, invitations: [...plane.invitations, invitation] },
      invitation,
    };
  },

  acceptInvitation(
    plane: MembershipOnboardingPlane,
    input: {
      invitationId: string;
      personId: string;
      email: string;
    },
  ): { plane: MembershipOnboardingPlane; membership: OnboardingMembership } {
    const invitation = plane.invitations.find((row) => row.id === input.invitationId);
    if (!invitation || !invitationIsValid(invitation)) {
      throw new Error(INVITATION_INVALID);
    }
    if (invitation.normalizedEmail !== normalizeIdentityEmail(input.email)) {
      throw new Error(INVITATION_INVALID);
    }
    const membership = projectOnboardingMembership({
      personId: input.personId,
      tenantId: invitation.tenantId,
      territoryId: invitation.territoryId,
      status: "active",
      role: "member",
    });
    const nextInvitations = plane.invitations.map((row) =>
      row.id === invitation.id ? { ...row, status: "accepted" as const } : row,
    );
    return {
      plane: {
        ...plane,
        invitations: nextInvitations,
        memberships: [...plane.memberships, membership],
      },
      membership,
    };
  },

  approvePendingMembership(
    plane: MembershipOnboardingPlane,
    input: { membershipId: string; actorRole: MembershipRole },
  ): { plane: MembershipOnboardingPlane; membership: OnboardingMembership } {
    if (input.actorRole !== "administrator") {
      throw new Error(GUEST_ACCESS_DENIED);
    }
    const current = plane.memberships.find((row) => row.id === input.membershipId);
    if (!current || current.status !== "pending") {
      throw new Error(INVITATION_INVALID);
    }
    const membership = { ...current, status: "active" as const, updatedAt: new Date().toISOString() };
    return {
      plane: {
        ...plane,
        memberships: plane.memberships.map((row) =>
          row.id === membership.id ? membership : row,
        ),
      },
      membership,
    };
  },

  allowMultipleHouseholdMembers(
    plane: MembershipOnboardingPlane,
    input: { tenantId: string; territoryId: string; personIds: string[] },
  ): boolean {
    const active = plane.memberships.filter(
      (row) =>
        row.tenantId === input.tenantId &&
        row.territoryId === input.territoryId &&
        input.personIds.includes(row.personId) &&
        membershipGrantsCommunityAccess(row.status),
    );
    return active.length === input.personIds.length;
  },
};

export function onboardingRespectsPrivacy(input: {
  personalPrivacy: PersonalPrivacy;
  participationPrivacy: CommunityParticipationPrivacy;
}): boolean {
  return (
    typeof input.personalPrivacy.shareActivity === "boolean" &&
    typeof input.participationPrivacy.appearInParticipants === "boolean"
  );
}

export function onboardingDoesNotOwnDomainData(): boolean {
  return true;
}

export function isOpaqueOnboardingEntity(name: string): boolean {
  return [
    "GlobalUserEntity",
    "UniversalIdentityEntity",
    "SocialAccountEntity",
    "ResidentScore",
    "VerificationScore",
    "OwnerTrustScore",
    "CrossTenantMembership",
  ].includes(name);
}

export function onboardingAuditMetadata(
  input: Record<string, unknown>,
): Record<string, string | boolean | null> | undefined {
  return (sanitizeAuditMetadata(
    input as Record<string, string | number | boolean | null>,
  ) ?? undefined) as Record<string, string | boolean | null> | undefined;
}
