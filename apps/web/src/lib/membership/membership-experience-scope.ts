/**
 * Client-safe membership access scope — no server or filesystem dependencies.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  guestCanAccess,
  membershipGrantsCommunityAccess,
  type MembershipStatus,
} from "@life-community-os/types";

export type MembershipAccessScope =
  | "visitor"
  | "registered"
  | "pending"
  | "active"
  | "admin";

export type MembershipExperienceContext = {
  scope: MembershipAccessScope;
  membershipStatus: MembershipStatus | null;
  canViewCommunityPreview: boolean;
  canAccessCommunity: boolean;
  canMutateCommunity: boolean;
};

function resolveMembershipStatus(actor: {
  hasMembership: boolean;
  membershipStatus?: MembershipStatus | null;
}): MembershipStatus | null {
  return actor.membershipStatus ?? (actor.hasMembership ? "active" : null);
}

export function resolveMembershipAccessScope(actor: {
  authenticated: boolean;
  hasMembership: boolean;
  membershipStatus?: MembershipStatus | null;
  role: RequestActor["role"];
}): MembershipExperienceContext {
  const status = resolveMembershipStatus(actor);
  if (!actor.authenticated) {
    return {
      scope: "visitor",
      membershipStatus: null,
      canViewCommunityPreview: guestCanAccess({
        resource: "open_content",
        hasActiveMembership: false,
      }),
      canAccessCommunity: false,
      canMutateCommunity: false,
    };
  }
  if (membershipGrantsCommunityAccess(status ?? "removed")) {
    const isAdmin = actor.role === "administrator";
    return {
      scope: isAdmin ? "admin" : "active",
      membershipStatus: status ?? "active",
      canViewCommunityPreview: true,
      canAccessCommunity: true,
      canMutateCommunity: true,
    };
  }
  if (status === "pending" || status === "invited") {
    return {
      scope: "pending",
      membershipStatus: status,
      canViewCommunityPreview: true,
      canAccessCommunity: false,
      canMutateCommunity: false,
    };
  }
  return {
    scope: "registered",
    membershipStatus: status,
    canViewCommunityPreview: guestCanAccess({
      resource: "open_content",
      hasActiveMembership: false,
    }),
    canAccessCommunity: false,
    canMutateCommunity: false,
  };
}
