/**
 * Admin Operations Center — access and role-change policy.
 * Consumes MembershipRole. Does not invent Admin* domain entities.
 */

import type { MembershipRole } from "../platform/membership-role";
import type { ProductCapabilityMap } from "../platform/tenant-contract";

export const ADMIN_OPERATIONS_ROLES: readonly MembershipRole[] = [
  "group_manager",
  "moderator",
  "administrator",
] as const;

export type AdminOperationsSection =
  | "dashboard"
  | "community"
  | "members"
  | "businesses"
  | "housing"
  | "resources"
  | "reservations"
  | "marketplace"
  | "moderation"
  | "territory"
  | "settings"
  | "operations"
  | "privacy"
  | "communication";

export const ADMIN_SECTION_ROLES: Readonly<
  Record<AdminOperationsSection, readonly MembershipRole[]>
> = {
  dashboard: ["group_manager", "moderator", "administrator"],
  operations: ["moderator", "administrator"],
  community: ["moderator", "administrator"],
  members: ["administrator"],
  businesses: ["moderator", "administrator"],
  housing: ["moderator", "administrator"],
  resources: ["group_manager", "moderator", "administrator"],
  reservations: ["group_manager", "moderator", "administrator"],
  marketplace: ["moderator", "administrator"],
  moderation: ["moderator", "administrator"],
  territory: ["administrator"],
  settings: ["administrator"],
  privacy: ["administrator"],
  communication: ["moderator", "administrator"],
};

export type TenantOperationsSettings = {
  tenantId: string;
  brandingName?: string;
  tagline?: string;
  primaryColor?: string;
  locale?: string;
  timezone?: string;
  contactEmail?: string;
  contactPhone?: string;
  capabilities?: Partial<ProductCapabilityMap>;
  updatedAt: string;
  updatedBy: string;
};

export type MembershipInvitation = {
  id: string;
  tenantId: string;
  email: string;
  role: MembershipRole;
  invitedBy: string;
  status: "pending" | "accepted" | "cancelled";
  createdAt: string;
};

export type TerritoryAssetAssignment = {
  tenantId: string;
  territoryObjectId: string;
  spatialAssetId: string;
  updatedAt: string;
  updatedBy: string;
};

export function canAccessAdminOperations(
  role: MembershipRole | null | undefined,
): boolean {
  if (!role) return false;
  return (ADMIN_OPERATIONS_ROLES as readonly string[]).includes(role);
}

/**
 * Community Admin operates a Territory.
 * It cannot create tenants, change plans, limits, or SaaS contracts.
 */
export function canMutateSaasControlPlane(
  isPlatformOperator: boolean,
): boolean {
  return isPlatformOperator === true;
}

export const SAAS_CONTROL_PLANE_FORBIDDEN = "saas_control_plane_forbidden";

export function canAccessAdminSection(
  role: MembershipRole | null | undefined,
  section: AdminOperationsSection,
): boolean {
  if (!role) return false;
  return ADMIN_SECTION_ROLES[section].includes(role);
}

/**
 * Only administrators elevate permissions.
 * member → administrator is never allowed.
 */
export function canAssignMembershipRole(input: {
  actorRole: MembershipRole | null | undefined;
  fromRole: MembershipRole;
  toRole: MembershipRole;
}): boolean {
  if (input.actorRole !== "administrator") return false;
  if (input.fromRole === input.toRole) return true;
  if (input.toRole === "administrator" && input.fromRole === "member") {
    return false;
  }
  return true;
}
