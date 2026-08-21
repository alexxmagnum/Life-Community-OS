import type { RequestActor } from "@/lib/auth/request-actor";
import type { MediaAsset, MediaPurpose, MediaReference } from "@life-community-os/types";
import { isPublicMediaPurpose } from "@life-community-os/types";

export function actorCanUploadMedia(actor: RequestActor): boolean {
  return Boolean(
    actor.authenticated && actor.hasMembership && actor.personId && !actor.tenantDenied,
  );
}

export function actorOwnsMedia(actor: RequestActor, asset: MediaAsset): boolean {
  return Boolean(actor.personId && asset.ownerPersonId === actor.personId);
}

export function actorIsTenantStaff(actor: RequestActor): boolean {
  return actor.role === "administrator" || actor.role === "moderator";
}

export function actorCanReadMedia(
  actor: RequestActor,
  asset: MediaAsset,
  references: MediaReference[],
): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  if (actor.tenantSlug !== asset.tenantId) return false;
  if (asset.status === "deleted") return false;
  if (actorOwnsMedia(actor, asset) || actorIsTenantStaff(actor)) return true;
  if (asset.status !== "ready") return false;
  return references.some((item) => isPublicMediaPurpose(item.purpose));
}

export function actorCanDeleteMedia(
  actor: RequestActor,
  asset: MediaAsset,
): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  if (actor.tenantSlug !== asset.tenantId) return false;
  return actorOwnsMedia(actor, asset) || actorIsTenantStaff(actor);
}

export function actorCanLinkMedia(
  actor: RequestActor,
  asset: MediaAsset,
  purpose: MediaPurpose,
): boolean {
  if (!actorCanUploadMedia(actor)) return false;
  if (actor.tenantSlug !== asset.tenantId) return false;
  if (asset.status === "deleted" || asset.status === "failed") return false;
  if (actorOwnsMedia(actor, asset) || actorIsTenantStaff(actor)) return true;
  return false;
}
