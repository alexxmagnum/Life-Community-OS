/**
 * Business AuthZ — server-side. UI may hide; APIs enforce.
 * Owner comes from session membership, never from the client body.
 */

import { actorHasCapability } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CAPABILITIES, guestCanAccess } from "@life-community-os/types";
import type {
  BusinessProfile,
  BusinessProfileStatus,
  MembershipRole,
} from "@life-community-os/types";

export function isTenantStaffRole(
  role: MembershipRole | null | undefined,
): boolean {
  return role === "moderator" || role === "administrator";
}

function actorHasMemberTerritoryView(actor: RequestActor): boolean {
  if (!actor.authenticated || !actor.hasMembership) return false;
  return (
    actorHasCapability(actor.permissions, CAPABILITIES.localView) ||
    actorHasCapability(actor.permissions, CAPABILITIES.lifeMapView)
  );
}

/** Public read of published territory businesses — visitors included. */
export function actorCanViewBusinesses(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (actorHasMemberTerritoryView(actor)) return true;
  return guestCanAccess({
    resource: "public_place",
    hasActiveMembership: false,
  });
}

export function actorCanCreateBusiness(actor: RequestActor): boolean {
  if (!actorHasMemberTerritoryView(actor)) return false;
  return Boolean(actor.personId);
}

export function actorOwnsBusiness(
  actor: RequestActor,
  business: Pick<BusinessProfile, "ownerPersonId">,
): boolean {
  return Boolean(actor.personId && actor.personId === business.ownerPersonId);
}

export function actorCanEditBusiness(
  actor: RequestActor,
  business: Pick<BusinessProfile, "ownerPersonId" | "tenantId">,
): boolean {
  if (!actorHasMemberTerritoryView(actor)) return false;
  if (isTenantStaffRole(actor.role)) return true;
  return actorOwnsBusiness(actor, business);
}

export function actorCanReviewBusiness(actor: RequestActor): boolean {
  if (!actorHasMemberTerritoryView(actor)) return false;
  return isTenantStaffRole(actor.role);
}

export function actorCanPublishBusiness(
  actor: RequestActor,
  business: Pick<BusinessProfile, "ownerPersonId" | "status">,
): boolean {
  if (!actorHasMemberTerritoryView(actor)) return false;
  if (isTenantStaffRole(actor.role)) return true;
  return (
    actorOwnsBusiness(actor, business) &&
    (business.status === "draft" || business.status === "pending_review")
  );
}

export function businessVisibleToActor(
  actor: RequestActor,
  business: BusinessProfile,
): boolean {
  if (actor.tenantDenied) return false;
  if (actor.tenantSlug && actor.tenantSlug !== business.tenantId) return false;
  if (business.status === "published") {
    return guestCanAccess({
      resource: "public_place",
      hasActiveMembership: actor.hasMembership,
    });
  }
  if (isTenantStaffRole(actor.role) && actor.hasMembership) return true;
  return actorOwnsBusiness(actor, business);
}

export function locationVisibilityForStatus(
  status: BusinessProfileStatus,
): "public" | "private" {
  return status === "published" ? "public" : "private";
}
