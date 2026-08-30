/**
 * Admin Operations AuthZ — session + tenant + role + permission.
 * UI may hide; APIs enforce. No parallel Admin* domains.
 */

import {
  canAccessAdminOperations,
  canAccessAdminSection,
  canAssignMembershipRole,
  type AdminOperationsSection,
} from "@life-community-os/types";
import type { MembershipRole } from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";

export {
  canAccessAdminOperations,
  canAccessAdminSection,
  canAssignMembershipRole,
};

export function actorCanAccessOperations(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return canAccessAdminOperations(actor.role);
}

export function actorCanAccessSection(
  actor: RequestActor,
  section: AdminOperationsSection,
): boolean {
  if (!actorCanAccessOperations(actor)) return false;
  return canAccessAdminSection(actor.role, section);
}

export function actorCanManageMembers(actor: RequestActor): boolean {
  return actorCanAccessSection(actor, "members");
}

export function actorCanUpdateTenantSettings(actor: RequestActor): boolean {
  return actorCanAccessSection(actor, "settings");
}

export function actorCanAssignTerritoryAsset(actor: RequestActor): boolean {
  return actorCanAccessSection(actor, "territory");
}

export function denyMemberToAdmin(
  actorRole: MembershipRole | null,
  fromRole: MembershipRole,
  toRole: MembershipRole,
): boolean {
  return !canAssignMembershipRole({ actorRole, fromRole, toRole });
}
