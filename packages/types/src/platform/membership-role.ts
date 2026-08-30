/**
 * Membership capability roles — persisted on memberships.membership_type.
 * Same vocabulary as former DemoRole (no new AuthZ engine).
 */

export const MEMBERSHIP_ROLES = [
  "member",
  "group_manager",
  "moderator",
  "administrator",
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

/** @deprecated Use MembershipRole. Packs never define roles. */
export type DemoRole = MembershipRole;

export function isMembershipRole(value: string): value is MembershipRole {
  return (MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

export function coerceMembershipRole(
  value: string | null | undefined,
): MembershipRole {
  if (value && isMembershipRole(value)) return value;
  return "member";
}
