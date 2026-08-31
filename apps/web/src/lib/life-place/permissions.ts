/**
 * Life Place AuthZ — private life is membership-scoped.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import type { Location } from "@life-community-os/types";

export function actorCanOpenLifePlace(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  return actor.authenticated;
}

export function actorCanReadLifePlaceLife(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  return Boolean(actor.authenticated && actor.hasMembership);
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
