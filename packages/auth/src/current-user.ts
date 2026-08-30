/**
 * CurrentUserContext — single identity contract for session → UI/API.
 *
 * User (auth provider) ≠ Person (community human) ≠ Membership (person+tenant+role).
 */

import type { MembershipRole } from "@life-community-os/types";

/** Technical login identity (Supabase user id or local provider reference). */
export type AuthUser = {
  userId: string;
  email: string | null;
};

/** Person inside a community — never an auth account. */
export type CommunityPerson = {
  personId: string;
  displayName: string | null;
};

/** Person + tenant + role. */
export type MembershipSummary = {
  tenantId: string;
  membershipId: string;
  personId: string;
  role: MembershipRole;
  /** Active Territory for this membership. Never resolved from a tenant pack. */
  territoryId?: string | null;
};

/**
 * Unique application identity. Empty ids mean "not resolved" — never Marta.
 */
export type CurrentUserContext = {
  userId: string | null;
  personId: string | null;
  tenantId: string | null;
  membershipId: string | null;
  role: MembershipRole | null;
  permissions: readonly string[];
  email: string | null;
  displayName: string | null;
  authenticated: boolean;
  hasMembership: boolean;
  /** Active Territory bound from membership. Null when unbound. */
  territoryId: string | null;
};

export const EMPTY_CURRENT_USER: CurrentUserContext = {
  userId: null,
  personId: null,
  tenantId: null,
  membershipId: null,
  role: null,
  permissions: [],
  email: null,
  displayName: null,
  authenticated: false,
  hasMembership: false,
  territoryId: null,
};

export function currentUserFromMembership(input: {
  user: AuthUser;
  person: CommunityPerson;
  membership: MembershipSummary;
  permissions: readonly string[];
}): CurrentUserContext {
  return {
    userId: input.user.userId,
    personId: input.person.personId,
    tenantId: input.membership.tenantId,
    membershipId: input.membership.membershipId,
    role: input.membership.role,
    permissions: input.permissions,
    email: input.user.email,
    displayName: input.person.displayName,
    authenticated: true,
    hasMembership: true,
    territoryId: input.membership.territoryId?.trim() || null,
  };
}

export function authenticatedWithoutMembership(input: {
  user: AuthUser;
  displayName?: string | null;
}): CurrentUserContext {
  return {
    ...EMPTY_CURRENT_USER,
    userId: input.user.userId,
    email: input.user.email,
    displayName: input.displayName ?? null,
    authenticated: true,
    hasMembership: false,
  };
}
