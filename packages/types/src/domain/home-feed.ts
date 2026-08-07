import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Home community feed — platform capability.
 * Surfaces “what happened in my community” as a chronological list.
 * Not a social network. Not a module launcher. Not tenant-specific.
 */

export type HomeFeedCategory =
  | "official"
  | "community"
  | "activity"
  | "recommendation"
  | "neighbour_help"
  | "marketplace";

export type HomeFeedCategoryFilter = "all" | HomeFeedCategory;

/**
 * Default Spanish labels — tenants may override when building UI options.
 * Platform UI receives labels as props; never hardcode a tenant name here.
 */
export const DEFAULT_HOME_FEED_CATEGORY_LABELS: Record<
  HomeFeedCategoryFilter,
  string
> = {
  all: "Todos",
  official: "Avisos oficiales",
  community: "Comunidad",
  activity: "Actividades",
  recommendation: "Recomendaciones",
  neighbour_help: "Ayuda vecinal",
  marketplace: "Mercado",
};

export const HOME_FEED_FILTER_ORDER: HomeFeedCategoryFilter[] = [
  "all",
  "official",
  "community",
  "activity",
  "recommendation",
  "neighbour_help",
  "marketplace",
];

/**
 * One announcement / moment in the Home feed.
 * Built from existing capabilities — does not replace their models.
 */
export type HomeFeedItem = {
  id: DomainId;
  category: HomeFeedCategory;
  /** Tenant-localized category label shown on the card */
  categoryLabel: string;
  title: string;
  authorName: string;
  authorAvatarUrl?: string;
  /** ISO — used for newest-first ordering */
  publishedAt: IsoDateTimeString;
  imageUrl?: string;
  href?: string;
};

/** Optional single sponsored placement — tenant commercial config. */
export type HomeSponsorSlot = {
  enabled: boolean;
  /** Disclosure label, e.g. “Patrocinado” */
  badgeLabel: string;
  title: string;
  authorName?: string;
  imageUrl?: string;
  href?: string;
};

export function sortHomeFeedNewestFirst(
  items: readonly HomeFeedItem[],
): HomeFeedItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function filterHomeFeed(
  items: readonly HomeFeedItem[],
  category: HomeFeedCategoryFilter,
): HomeFeedItem[] {
  const sorted = sortHomeFeedNewestFirst(items);
  if (category === "all") return sorted;
  return sorted.filter((item) => item.category === category);
}

/**
 * Insert at most one sponsored card after the first organic item.
 * Never first (avoids hijacking the opening), never duplicated.
 */
export function placeHomeSponsor<T extends { id: string }>(
  items: readonly T[],
  sponsor: (HomeSponsorSlot & { id: string }) | null | undefined,
): Array<T | (HomeSponsorSlot & { id: string; kind: "sponsor" })> {
  if (!sponsor?.enabled) return [...items];
  const entry = { ...sponsor, kind: "sponsor" as const };
  if (items.length === 0) return [entry];
  return [items[0]!, entry, ...items.slice(1)];
}
