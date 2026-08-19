/**
 * Community Help AuthZ — created_by from session.
 */

import { actorHasCapability } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CAPABILITIES } from "@life-community-os/tenant-life-panoramica";
import type { HelpRequest, MembershipRole } from "@life-community-os/types";

function isStaff(role: MembershipRole | null | undefined): boolean {
  return role === "moderator" || role === "administrator";
}

export function actorCanViewHelp(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return (
    actorHasCapability(actor.permissions, CAPABILITIES.localView) ||
    actorHasCapability(actor.permissions, CAPABILITIES.marketplaceView)
  );
}

export function actorCanCreateHelp(actor: RequestActor): boolean {
  if (!actorCanViewHelp(actor)) return false;
  return Boolean(actor.personId);
}

export function actorOwnsHelp(
  actor: RequestActor,
  item: Pick<HelpRequest, "createdBy">,
): boolean {
  return Boolean(actor.personId && actor.personId === item.createdBy);
}

export function actorCanEditHelp(
  actor: RequestActor,
  item: Pick<HelpRequest, "createdBy">,
): boolean {
  if (!actorCanViewHelp(actor)) return false;
  if (isStaff(actor.role)) return true;
  return actorOwnsHelp(actor, item);
}

export function helpVisibleToActor(
  actor: RequestActor,
  item: HelpRequest,
): boolean {
  if (actor.tenantDenied) return false;
  if (actor.tenantSlug && actor.tenantSlug !== item.tenantId) return false;
  if (item.status === "closed" || item.status === "completed") {
    return isStaff(actor.role) || actorOwnsHelp(actor, item);
  }
  return actor.authenticated && actor.hasMembership;
}
