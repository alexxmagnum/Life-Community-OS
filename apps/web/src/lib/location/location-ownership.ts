/**
 * Location mutation rules — owner or tenant staff.
 * Catalog / unowned locations are protected content (members cannot edit).
 */

import type { Location } from "@life-community-os/types";
import type { MembershipRole } from "@life-community-os/types";

export type LocationActor = {
  personId: string | null;
  role: MembershipRole | null;
  hasMembership: boolean;
};

export function isTenantStaffRole(role: MembershipRole | null): boolean {
  return role === "administrator" || role === "moderator";
}

export function locationOwnedBy(
  location: Pick<Location, "ownerId" | "createdBy">,
  personId: string | null,
): boolean {
  if (!personId) return false;
  return location.ownerId === personId || location.createdBy === personId;
}

export function canMutateLocation(
  actor: LocationActor,
  location: Pick<Location, "ownerId" | "createdBy">,
): boolean {
  if (!actor.hasMembership || !actor.personId) return false;
  if (isTenantStaffRole(actor.role)) return true;
  return locationOwnedBy(location, actor.personId);
}

export function canDeleteLocation(
  actor: LocationActor,
  location: Pick<Location, "ownerId" | "createdBy">,
): boolean {
  if (!actor.hasMembership || !actor.personId) return false;
  if (actor.role === "administrator") return true;
  if (actor.role === "moderator") return true;
  return location.ownerId === actor.personId;
}
