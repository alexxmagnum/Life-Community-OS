/**
 * Location / feed card images — category → platform asset registry.
 * Places are context; visuals follow domain, not generic map-pin fallbacks.
 */

import { getAsset } from "@life-community-os/assets";
import type {
  CommunityFeedItem,
  CommunityFeedItemType,
  Location,
  LocationType,
} from "@life-community-os/types";

import {
  cardAssetKeyForCategory,
  cardAssetKeyForExperienceType,
} from "./experience-resolver";

const FALLBACK_CARD_KEY = "navigation.discover.card";

export function cardAssetPathForKey(key: string): string {
  try {
    return getAsset(key).path;
  } catch {
    return getAsset(FALLBACK_CARD_KEY).path;
  }
}

export function cardAssetPathForCategory(
  category: string,
  type: LocationType = "business",
): string {
  return cardAssetPathForKey(cardAssetKeyForCategory(category, type));
}

export { cardAssetKeyForCategory, cardAssetKeyForExperienceType };

export function locationCardImageUrl(
  location: Pick<Location, "category" | "type" | "imageUrl">,
): string {
  const explicit = location.imageUrl?.trim();
  if (explicit) return explicit;
  return cardAssetPathForCategory(location.category, location.type);
}

function feedCardAssetKey(type: CommunityFeedItemType): string {
  switch (type) {
    case "experience":
      return "sports.sports.card";
    case "event":
      return "community.recommendations.card";
    case "reservation":
    case "resource_activity":
      return "services.spaces-reservations.card";
    case "business_activity":
      return "services.maintenance.card";
    case "community":
      return "community.neighbour-help.card";
    default:
      return FALLBACK_CARD_KEY;
  }
}

export function communityFeedCardImageUrl(item: CommunityFeedItem): string {
  const explicit = item.metadata?.imageUrl?.trim();
  if (explicit) return explicit;
  return cardAssetPathForKey(feedCardAssetKey(item.type));
}
