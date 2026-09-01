/**
 * Discover Experience — territorial exploration projection.
 * Not a catalog. Not user ranking or engagement scoring.
 */

import type { CommunityFeedItem } from "./community-feed";
import {
  LIVING_EMPTY_CTA,
  LIVING_EMPTY_TITLE,
  partitionLivingCommunityFeed,
  sortCommunityFeedItems,
} from "./community-feed";
import type { DiscoverQueryContext } from "../platform/territory-experience";
import type { LifeHomePlace } from "./life-home";

export type DiscoverServiceSummary = {
  id: string;
  name: string;
  category: string;
  href: string;
};

export type DiscoverHelpSummary = {
  id: string;
  title: string;
  href: string;
};

export type DiscoverExperienceContext = {
  tenantId: string;
  territoryId: string;
  nowNearby: CommunityFeedItem[];
  upcomingPlans: CommunityFeedItem[];
  livingPlaces: LifeHomePlace[];
  services: DiscoverServiceSummary[];
  help: DiscoverHelpSummary[];
  empty?: {
    title: string;
    cta: string;
  };
};

export function projectDiscoverExperienceContext(input: {
  query: DiscoverQueryContext;
  items: readonly CommunityFeedItem[];
  livingPlaces?: readonly LifeHomePlace[];
  services?: readonly DiscoverServiceSummary[];
  help?: readonly DiscoverHelpSummary[];
}): DiscoverExperienceContext {
  const scoped = input.items.filter(
    (item) =>
      item.tenantId === input.query.tenantId &&
      (!input.query.territoryId ||
        item.territoryId === input.query.territoryId),
  );
  const sorted = sortCommunityFeedItems(scoped);
  const living = partitionLivingCommunityFeed(sorted);
  const hasContent =
    living.now.length > 0 ||
    living.upcoming.length > 0 ||
    (input.livingPlaces?.length ?? 0) > 0 ||
    (input.services?.length ?? 0) > 0 ||
    (input.help?.length ?? 0) > 0;
  return {
    tenantId: input.query.tenantId,
    territoryId: input.query.territoryId ?? "",
    nowNearby: living.now,
    upcomingPlans: living.upcoming,
    livingPlaces: [...(input.livingPlaces ?? [])],
    services: [...(input.services ?? [])],
    help: [...(input.help ?? [])],
    empty: hasContent
      ? undefined
      : {
          title: LIVING_EMPTY_TITLE,
          cta: LIVING_EMPTY_CTA,
        },
  };
}

export function discoverUsesRealDomainData(
  context: DiscoverExperienceContext,
): boolean {
  return (
    !("syntheticPosts" in context) &&
    !("engagementScore" in context) &&
    !("userRanking" in context)
  );
}
