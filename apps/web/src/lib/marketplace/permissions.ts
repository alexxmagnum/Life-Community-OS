/**
 * Marketplace AuthZ — owner from session, never from the client body.
 */

import { actorHasCapability } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CAPABILITIES } from "@life-community-os/tenant-life-panoramica";
import type { MarketplaceListing, MembershipRole } from "@life-community-os/types";

export function isCommerceStaff(
  role: MembershipRole | null | undefined,
): boolean {
  return role === "moderator" || role === "administrator";
}

export function actorCanViewMarketplace(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.marketplaceView);
}

export function actorCanCreateMarketplace(actor: RequestActor): boolean {
  if (!actorCanViewMarketplace(actor)) return false;
  return (
    Boolean(actor.personId) &&
    actorHasCapability(actor.permissions, CAPABILITIES.marketplaceCreate)
  );
}

export function actorOwnsListing(
  actor: RequestActor,
  listing: Pick<MarketplaceListing, "ownerPersonId" | "createdBy">,
): boolean {
  return Boolean(
    actor.personId &&
      (actor.personId === listing.ownerPersonId ||
        actor.personId === listing.createdBy),
  );
}

export function actorCanEditListing(
  actor: RequestActor,
  listing: Pick<MarketplaceListing, "ownerPersonId" | "createdBy" | "tenantId">,
): boolean {
  if (!actorCanViewMarketplace(actor)) return false;
  if (isCommerceStaff(actor.role)) return true;
  return actorOwnsListing(actor, listing);
}

export function listingVisibleToActor(
  actor: RequestActor,
  listing: MarketplaceListing,
): boolean {
  if (actor.tenantDenied) return false;
  if (actor.tenantSlug && actor.tenantSlug !== listing.tenantId) return false;
  if (listing.status === "archived") {
    return isCommerceStaff(actor.role) || actorOwnsListing(actor, listing);
  }
  if (listing.status === "draft") {
    return isCommerceStaff(actor.role) || actorOwnsListing(actor, listing);
  }
  return actor.authenticated && actor.hasMembership;
}
