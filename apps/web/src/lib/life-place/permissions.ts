/**
 * Life Place AuthZ — private life is membership-scoped.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import { guestCanAccess, type Location } from "@life-community-os/types";

export function actorCanOpenLifePlace(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (actor.authenticated) return true;
  return guestCanAccess({
    resource: "public_place",
    hasActiveMembership: actor.hasMembership,
  });
}

export function actorCanReadLifePlaceCommunityPreview(
  actor: RequestActor,
): boolean {
  if (actor.tenantDenied) return false;
  if (actor.hasMembership) return false;
  const status = actor.membershipStatus;
  return status === "pending" || status === "invited";
}

export function actorCanReadLifePlaceLife(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  return Boolean(actor.authenticated && actor.hasMembership);
}

/** Public territory preview at a Life Place — no private life or member data. */
export function actorCanReadLifePlacePublicTerritory(
  actor: RequestActor,
): boolean {
  if (actor.tenantDenied) return false;
  if (actorCanReadLifePlaceLife(actor)) return false;
  return guestCanAccess({
    resource: "public_place",
    hasActiveMembership: actor.hasMembership,
  });
}

export function actorCanSeeLocation(actor: RequestActor, location: Location): boolean {
  if (location.visibility === "public") return true;
  if (location.visibility === "members") return actor.hasMembership;
  if (location.visibility === "private") {
    const privileged =
      actor.role === "administrator" || actor.role === "moderator";
    return privileged || location.ownerId === actor.personId;
  }
  return false;
}
