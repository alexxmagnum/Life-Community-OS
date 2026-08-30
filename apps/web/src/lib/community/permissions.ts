/**
 * Community AuthZ — server-side. UI may hide; APIs enforce.
 * Roles come from membership, never from the client body.
 */

import { actorHasCapability } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CAPABILITIES } from "@life-community-os/types";
import type { MembershipRole } from "@life-community-os/types";

export function canModerateCommunity(
  role: MembershipRole | null | undefined,
): boolean {
  return role === "moderator" || role === "administrator";
}

export function canManageCommunityGroups(
  role: MembershipRole | null | undefined,
): boolean {
  return (
    role === "group_manager" ||
    role === "moderator" ||
    role === "administrator"
  );
}

export function actorCanViewCommunity(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.contentView);
}

/** Community Experience Feed — members of the tenant only. */
export function actorCanReadCommunityExperienceFeed(
  actor: RequestActor,
): boolean {
  if (actor.tenantDenied) return false;
  return Boolean(actor.authenticated && actor.hasMembership);
}

export function actorCanCreatePost(actor: RequestActor): boolean {
  if (!actorCanViewCommunity(actor)) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.contentCreate);
}

export function actorCanCreateGroup(actor: RequestActor): boolean {
  if (!actorCanViewCommunity(actor)) return false;
  return (
    canManageCommunityGroups(actor.role) ||
    actorHasCapability(actor.permissions, CAPABILITIES.groupCreate)
  );
}

export function actorCanCreateEvent(actor: RequestActor): boolean {
  if (!actorCanViewCommunity(actor)) return false;
  return (
    actorHasCapability(actor.permissions, CAPABILITIES.experienceCreate) ||
    actorHasCapability(actor.permissions, CAPABILITIES.contentCreate)
  );
}

export function actorCanComment(actor: RequestActor): boolean {
  if (!actorCanViewCommunity(actor)) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.interactionComment);
}

export function actorCanReact(actor: RequestActor): boolean {
  if (!actorCanViewCommunity(actor)) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.interactionReact);
}

export function actorOwnsRecord(
  actor: RequestActor,
  createdBy: string,
): boolean {
  return Boolean(actor.personId && actor.personId === createdBy);
}
