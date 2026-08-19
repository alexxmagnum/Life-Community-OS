/**
 * Housing AuthZ — Property + PropertyMembership.
 * Owner comes from session membership, never from the client body.
 */

import { actorHasCapability } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CAPABILITIES } from "@life-community-os/tenant-life-panoramica";
import {
  isPropertyPubliclyListed,
  type MembershipRole,
  type Property,
  type PropertyMembership,
  type PropertyPersonRelationshipType,
} from "@life-community-os/types";

export function isHousingStaff(
  role: MembershipRole | null | undefined,
): boolean {
  return role === "moderator" || role === "administrator";
}

export function actorCanViewHousing(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.housingView);
}

export function actorCanCreateProperty(actor: RequestActor): boolean {
  if (!actorCanViewHousing(actor)) return false;
  return (
    Boolean(actor.personId) &&
    actorHasCapability(actor.permissions, CAPABILITIES.housingCreateOwnListing)
  );
}

export function membershipsForProperty(
  memberships: readonly PropertyMembership[],
  propertyId: string,
): PropertyMembership[] {
  return memberships.filter(
    (item) => item.propertyId === propertyId && item.status === "active",
  );
}

export function actorMembership(
  actor: RequestActor,
  memberships: readonly PropertyMembership[],
  propertyId: string,
): PropertyMembership | undefined {
  if (!actor.personId) return undefined;
  return membershipsForProperty(memberships, propertyId).find(
    (item) => item.personId === actor.personId,
  );
}

export function actorHasPropertyRole(
  actor: RequestActor,
  memberships: readonly PropertyMembership[],
  propertyId: string,
  roles: readonly PropertyPersonRelationshipType[],
): boolean {
  const row = actorMembership(actor, memberships, propertyId);
  return Boolean(row && roles.includes(row.relationshipType));
}

export function actorOwnsProperty(
  actor: RequestActor,
  property: Property,
  memberships: readonly PropertyMembership[],
): boolean {
  if (!actor.personId) return false;
  if (property.createdBy && actor.personId === property.createdBy) return true;
  return actorHasPropertyRole(actor, memberships, property.id, ["owner"]);
}

export function actorCanEditProperty(
  actor: RequestActor,
  property: Property,
  memberships: readonly PropertyMembership[],
): boolean {
  if (!actorCanViewHousing(actor)) return false;
  if (isHousingStaff(actor.role)) return true;
  return actorOwnsProperty(actor, property, memberships);
}

export function actorCanManageMembers(
  actor: RequestActor,
  property: Property,
  memberships: readonly PropertyMembership[],
): boolean {
  return actorCanEditProperty(actor, property, memberships);
}

export function propertyVisibleToActor(
  actor: RequestActor,
  property: Property,
  memberships: readonly PropertyMembership[],
): boolean {
  if (actor.tenantDenied) return false;
  if (actor.tenantSlug && property.tenantId && actor.tenantSlug !== property.tenantId) {
    return false;
  }
  if (!actor.authenticated || !actor.hasMembership) return false;
  if (isHousingStaff(actor.role)) return true;
  if (actorOwnsProperty(actor, property, memberships)) return true;
  if (actorMembership(actor, memberships, property.id)) return true;
  if (isPropertyPubliclyListed(property)) return true;
  return false;
}

export function canSeePropertyHousehold(
  actor: RequestActor,
  property: Property,
  memberships: readonly PropertyMembership[],
): boolean {
  if (!propertyVisibleToActor(actor, property, memberships)) return false;
  if (isHousingStaff(actor.role)) return true;
  return Boolean(actorMembership(actor, memberships, property.id));
}
