/**
 * Experience AuthZ — owner from session Person. Never body.ownerId.
 */

import { actorHasCapability } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CAPABILITIES } from "@life-community-os/types";
import type {
  ExperienceLifecycleStatus,
  ExperienceRecord,
  MembershipRole,
} from "@life-community-os/types";

function isStaff(role: MembershipRole | null | undefined): boolean {
  return (
    role === "group_manager" ||
    role === "moderator" ||
    role === "administrator"
  );
}

export function actorCanViewExperiences(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.experienceView);
}

export function actorCanCreateExperience(actor: RequestActor): boolean {
  if (!actorCanViewExperiences(actor)) return false;
  if (!actor.personId) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.experienceCreate);
}

export function actorCanJoinExperience(actor: RequestActor): boolean {
  if (!actorCanViewExperiences(actor)) return false;
  if (!actor.personId) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.experienceJoin);
}

export function actorOwnsExperience(
  actor: RequestActor,
  item: Pick<ExperienceRecord, "ownerPersonId" | "createdBy">,
): boolean {
  return Boolean(
    actor.personId &&
      (actor.personId === item.ownerPersonId ||
        actor.personId === item.createdBy),
  );
}

export function actorCanManageExperience(
  actor: RequestActor,
  item?: Pick<ExperienceRecord, "ownerPersonId" | "createdBy">,
): boolean {
  if (!actorCanViewExperiences(actor)) return false;
  if (item && actorOwnsExperience(actor, item)) return true;
  return actorHasCapability(actor.permissions, CAPABILITIES.experienceManage);
}

export function actorCanCancelExperience(
  actor: RequestActor,
  item: Pick<ExperienceRecord, "ownerPersonId" | "createdBy">,
): boolean {
  return actorCanManageExperience(actor, item);
}

export function experienceVisibleToActor(
  actor: RequestActor,
  item: Pick<
    ExperienceRecord,
    "status" | "ownerPersonId" | "createdBy" | "tenantId"
  >,
): boolean {
  if (!actorCanViewExperiences(actor)) return false;
  if (actor.tenantSlug && item.tenantId && actor.tenantSlug !== item.tenantId) {
    return false;
  }
  if (actorOwnsExperience(actor, item) || isStaff(actor.role)) return true;
  const published: ExperienceLifecycleStatus[] = [
    "published",
    "cancelled",
    "completed",
  ];
  return published.includes(item.status);
}
