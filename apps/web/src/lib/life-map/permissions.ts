/**
 * Life Map AuthZ — living layer is membership-scoped.
 * Territory fabric may still render; private life does not.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import { actorHasCapability } from "@/lib/auth/permissions";
import { CAPABILITIES } from "@life-community-os/types";

export function actorCanViewLifeMap(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.lifeMapView);
}

/** Private community life on the map (Feed, members-only places). */
export function actorCanReadLifeMapLife(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.lifeMapView);
}
