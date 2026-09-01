/**
 * Bind the active tenant from the user's memberships.
 * Requested tenant is a hint — never a grant.
 */

import type { MembershipRole, MembershipStatus } from "@life-community-os/types";
import type { MembershipSummary } from "./current-user";

export type TenantBindResult =
  | { status: "no_membership" }
  | { status: "tenant_forbidden"; requestedTenantId: string }
  | { status: "bound"; membership: MembershipSummary };

export function bindActiveTenant(input: {
  requestedTenantId: string | null;
  memberships: readonly MembershipSummary[];
}): TenantBindResult {
  if (input.memberships.length === 0) {
    return { status: "no_membership" };
  }

  const requested = input.requestedTenantId?.trim().toLowerCase() || null;
  const rank = (status: MembershipSummary["status"]) =>
    status === "active" ? 0 : status === "pending" || status === "invited" ? 1 : 2;
  const sorted = [...input.memberships].sort(
    (a, b) => rank(a.status) - rank(b.status),
  );

  if (requested) {
    const match = sorted.find((m) => m.tenantId === requested);
    if (match) {
      return { status: "bound", membership: match };
    }
    return { status: "tenant_forbidden", requestedTenantId: requested };
  }

  const first = sorted[0];
  if (!first) return { status: "no_membership" };
  return { status: "bound", membership: first };
}

export function membershipSummary(input: {
  tenantId: string;
  membershipId: string;
  personId: string;
  role: MembershipRole;
  status?: MembershipStatus;
  territoryId?: string | null;
}): MembershipSummary {
  return {
    tenantId: input.tenantId,
    membershipId: input.membershipId,
    personId: input.personId,
    role: input.role,
    status: input.status ?? "active",
    territoryId: input.territoryId?.trim() || null,
  };
}
