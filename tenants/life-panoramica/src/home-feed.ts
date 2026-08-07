/**
 * Home community feed — tenant demo aggregator.
 * Maps existing Life Panoramica catalogs into platform HomeFeedItem.
 * Other tenants swap catalogs; keep the same HomeFeedItem shape.
 */

import type {
  HomeFeedCategory,
  HomeFeedItem,
  HomeSponsorSlot,
} from "@life-community-os/types";
import {
  DEFAULT_HOME_FEED_CATEGORY_LABELS,
  filterHomeFeed,
  sortHomeFeedNewestFirst,
} from "@life-community-os/types";
import {
  formatContentWhen,
  listPublishedCommunityContent,
} from "./community-content";
import {
  formatExperienceWhen,
  listDiscoverableExperiences,
} from "./experiences";
import {
  listMarketplaceListings,
} from "./marketplace";
import {
  listNeighbourRecommendations,
  listTrustedHelp,
} from "./local-places";

export type HomeFeedBuildOptions = {
  features: {
    feed?: boolean;
    experiences?: boolean;
    marketplace?: boolean;
    recommendations?: boolean;
    localLife?: boolean;
  };
};

function labelFor(category: HomeFeedCategory): string {
  return DEFAULT_HOME_FEED_CATEGORY_LABELS[category];
}

/**
 * Build chronological Home announcements from existing capabilities.
 */
export function buildHomeFeed(options: HomeFeedBuildOptions): HomeFeedItem[] {
  const { features } = options;
  const items: HomeFeedItem[] = [];

  if (features.feed !== false) {
    for (const content of listPublishedCommunityContent()) {
      const category: HomeFeedCategory = content.isOfficial
        ? "official"
        : "community";
      items.push({
        id: `feed-${content.id}`,
        category,
        categoryLabel: labelFor(category),
        title: content.title,
        authorName: content.author.name,
        authorAvatarUrl: content.author.avatarUrl,
        publishedAt: content.publishedAt ?? content.createdAt,
        imageUrl: content.imageUrl,
        href: `/community/content/${content.id}`,
      });
    }
  }

  if (features.experiences) {
    listDiscoverableExperiences().forEach((exp, index) => {
      const publishedAt = new Date();
      publishedAt.setHours(publishedAt.getHours() - (1 + index * 5));
      items.push({
        id: `act-${exp.id}`,
        category: "activity",
        categoryLabel: labelFor("activity"),
        title: exp.title,
        authorName: exp.organizer.name,
        authorAvatarUrl: exp.organizer.avatarUrl,
        publishedAt: publishedAt.toISOString(),
        imageUrl: exp.imageUrl,
        href: `/experiences/${exp.id}`,
      });
    });
  }

  if (features.recommendations || features.localLife) {
    listNeighbourRecommendations().forEach((tip, index) => {
      const publishedAt = new Date();
      publishedAt.setHours(publishedAt.getHours() - (4 + index * 7));
      items.push({
        id: `rec-${tip.id}`,
        category: "recommendation",
        categoryLabel: labelFor("recommendation"),
        title: tip.body,
        authorName: tip.authorName,
        publishedAt: publishedAt.toISOString(),
        imageUrl: tip.imageUrl,
        href: "/discover",
      });
    });
  }

  if (features.localLife) {
    listTrustedHelp()
      .slice(0, 3)
      .forEach((help, index) => {
        const publishedAt = new Date();
        publishedAt.setHours(publishedAt.getHours() - (9 + index * 11));
        items.push({
          id: `help-${help.id}`,
          category: "neighbour_help",
          categoryLabel: labelFor("neighbour_help"),
          title: help.name,
          authorName: help.recommendedBy ?? help.categoryLabel,
          publishedAt: publishedAt.toISOString(),
          imageUrl: help.imageUrl,
          href: "/discover",
        });
      });
  }

  if (features.marketplace) {
    for (const listing of listMarketplaceListings()) {
      const isHelp =
        listing.kind === "request" || listing.kind === "give";
      const category: HomeFeedCategory = isHelp
        ? "neighbour_help"
        : "marketplace";
      items.push({
        id: `mp-${listing.id}`,
        category,
        categoryLabel: isHelp
          ? labelFor("neighbour_help")
          : labelFor("marketplace"),
        title: listing.title,
        authorName: listing.authorName,
        authorAvatarUrl: listing.authorAvatarUrl,
        publishedAt: listing.publishedAt,
        imageUrl: listing.imageUrl,
        href: "/marketplace",
      });
    }
  }

  return sortHomeFeedNewestFirst(items);
}

export function listHomeFeedFiltered(
  category: Parameters<typeof filterHomeFeed>[1],
  options: HomeFeedBuildOptions,
): HomeFeedItem[] {
  return filterHomeFeed(buildHomeFeed(options), category);
}

export function formatHomeFeedWhen(iso: string): string {
  return formatContentWhen(iso);
}

/** Soft relative line for activities when experience formatter fits better. */
export function formatHomeFeedActivityWhen(iso: string): string {
  return formatExperienceWhen(iso);
}

/**
 * Tenant-configurable sponsored community card.
 * Max one. Always disclosed. Disabled by default toggle in theme/config.
 */
export const homeSponsorSlot: HomeSponsorSlot = {
  enabled: true,
  badgeLabel: "Patrocinado",
  title: "Mercadillo de primavera en la plaza del valle",
  authorName: "Comercio local · Aldea Golf",
  imageUrl:
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
  href: "/discover",
};

export function getHomeSponsorSlot(): HomeSponsorSlot | null {
  return homeSponsorSlot.enabled ? homeSponsorSlot : null;
}
