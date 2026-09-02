/**
 * Existing 3D assets for Action Composer invitations.
 * Not a domain. Paths are public platform files already in the repo.
 */

import { getAsset } from "@life-community-os/assets";

export const COMPOSER_GLYPH_BY_ACTION: Record<string, string> = {
  experience_create: getAsset("sports.sports.card").path,
  event_create: getAsset("community.recommendations.card").path,
  announcement_create: getAsset("community.recommendations.card").path,
  help_request: getAsset("community.neighbour-help.card").path,
  help_offer: getAsset("community.neighbour-help.card").path,
  marketplace_listing: getAsset("community.marketplace.card").path,
  work_create: getAsset("services.maintenance.card").path,
  reservation_create: getAsset("services.spaces-reservations.card").path,
  group_create: getAsset("community.recommendations.card").path,
  business_create: getAsset("services.maintenance.card").path,
  offer_service: getAsset("services.maintenance.card").path,
};

export const LIVING_EMPTY_GLYPH = getAsset("community.recommendations.card").path;

export const LIVING_PLACE_GLYPH = getAsset("navigation.discover.card").path;
