/**
 * Resource / Reservation AuthZ.
 * Server decides. UI may hide; APIs enforce.
 */

import { actorHasCapability } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CAPABILITIES } from "@life-community-os/types";
import type {
  CommunityResource,
  MembershipRole,
  Reservation,
  ResourceCategory,
} from "@life-community-os/types";
import { resourceIsBookable } from "@life-community-os/types";

export function isReservationsStaff(
  role: MembershipRole | null | undefined,
): boolean {
  return (
    role === "group_manager" ||
    role === "moderator" ||
    role === "administrator"
  );
}

export function actorCanViewResources(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return (
    actorHasCapability(actor.permissions, CAPABILITIES.resourceView) ||
    actorHasCapability(actor.permissions, CAPABILITIES.experienceView)
  );
}

export function actorCanReserveResource(actor: RequestActor): boolean {
  if (!actorCanViewResources(actor)) return false;
  return (
    Boolean(actor.personId) &&
    (actorHasCapability(actor.permissions, CAPABILITIES.resourceReserve) ||
      actorHasCapability(actor.permissions, CAPABILITIES.experienceJoin))
  );
}

export function actorCanManageResources(actor: RequestActor): boolean {
  if (!actorCanViewResources(actor)) return false;
  return (
    isReservationsStaff(actor.role) ||
    actorHasCapability(actor.permissions, CAPABILITIES.resourceManage) ||
    actorHasCapability(actor.permissions, CAPABILITIES.resourceCreateTerritorial)
  );
}

export function actorCanCreateResource(
  actor: RequestActor,
  category: ResourceCategory,
): boolean {
  if (!actorCanViewResources(actor) || !actor.personId) return false;
  if (actorCanManageResources(actor)) return true;
  if (category === "activity") {
    return actorHasCapability(actor.permissions, CAPABILITIES.experienceCreate);
  }
  return false;
}

export function resourceVisibleToActor(
  actor: RequestActor,
  resource: CommunityResource,
): boolean {
  if (!actorCanViewResources(actor)) return false;
  if (actor.tenantDenied) return false;
  if (resource.tenantId && resource.tenantId !== actor.tenantSlug) return false;
  if (actorCanManageResources(actor)) return true;
  if (resource.createdBy && actor.personId === resource.createdBy) return true;
  return resource.status === "active";
}

export function actorCanBookResource(
  actor: RequestActor,
  resource: CommunityResource,
): boolean {
  if (!actorCanReserveResource(actor)) return false;
  if (!resourceVisibleToActor(actor, resource)) return false;
  return resourceIsBookable(resource);
}

export function actorOwnsReservation(
  actor: RequestActor,
  reservation: Reservation,
): boolean {
  if (!actor.personId) return false;
  return (
    actor.personId === reservation.createdBy ||
    actor.personId === reservation.personId
  );
}

export function actorCanCancelReservation(
  actor: RequestActor,
  reservation: Reservation,
): boolean {
  if (!actorCanViewResources(actor)) return false;
  if (actorOwnsReservation(actor, reservation)) return true;
  return (
    actor.role === "moderator" ||
    actor.role === "administrator" ||
    actorHasCapability(actor.permissions, CAPABILITIES.resourceManage)
  );
}

export function actorCanModifyReservation(
  actor: RequestActor,
  reservation: Reservation,
): boolean {
  return actorCanCancelReservation(actor, reservation);
}
