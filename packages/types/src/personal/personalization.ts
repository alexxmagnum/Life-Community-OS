/**
 * Personalization — projection layer over Community Experience Feed.
 * Reorders existing items. Never invents, hides or scores people.
 * Rule-based first. AI provider is an interface only.
 */

import type { CommunityCreationAction } from "../community/action-composer";
import type { CommunityFeedItem } from "../community/community-feed";
import { communityFeedItemHref } from "../community/community-feed";
import type { LifePlaceContext } from "../platform/life-place";
import {
  isPersonalInterestId,
  personalInterestLabel,
  type PersonalContext,
  type PersonalFavorite,
  type PersonalInterestId,
} from "./personal-context";

export const PERSONALIZATION_PROVIDER_IDS = ["rules", "ai"] as const;

export type PersonalizationProviderId =
  (typeof PERSONALIZATION_PROVIDER_IDS)[number];

export type PersonalizedCommunityFeedItem = CommunityFeedItem & {
  reason?: string;
};

export type PersonalizedCommunityFeed = {
  items: PersonalizedCommunityFeedItem[];
  enabled: boolean;
  providerId: PersonalizationProviderId;
};

export type CommunityInsight = {
  id: string;
  title: string;
  body: string;
  reason: string;
  href?: string;
  itemId?: string;
};

export type PersonalizationInput = {
  context: PersonalContext;
  feed: readonly CommunityFeedItem[];
  favorites?: readonly PersonalFavorite[];
  trustedOrganizerIds?: readonly string[];
};

export type PersonalizationProvider = {
  id: PersonalizationProviderId;
  personalize(input: PersonalizationInput): PersonalizedCommunityFeed;
};

export type CommunityInsightProvider = {
  id: PersonalizationProviderId;
  list(input: PersonalizationInput): CommunityInsight[];
};

/** Future AI slot. Not implemented in this phase. */
export type AIRecommendationProvider = PersonalizationProvider;

const INTEREST_KEYWORDS: Record<PersonalInterestId, readonly string[]> = {
  golf: ["golf", "golfista", "hoyo", "green"],
  pool: ["piscina", "aquagym", "natacion", "natación", "swim", "pool"],
  family: ["familia", "familiar", "niños", "infantil", "kids", "family"],
  restaurants: [
    "restaurante",
    "cena",
    "gastro",
    "tapas",
    "brunch",
    "comida",
    "cocina",
  ],
  sports: [
    "deporte",
    "pádel",
    "padel",
    "tenis",
    "tennis",
    "yoga",
    "fitness",
    "gym",
    "sport",
  ],
  help: ["ayuda", "ayudar", "colabor", "mano", "vecino"],
};

const ADULT_NIGHT_KEYWORDS = [
  "nocturno",
  "copas",
  "after",
  "cocktail",
  "discoteca",
  "adulto",
];

const COMPOSER_INTEREST: Partial<
  Record<PersonalInterestId, readonly string[]>
> = {
  golf: ["experience_create"],
  pool: ["experience_create"],
  sports: ["experience_create", "event_create"],
  family: ["event_create", "experience_create"],
  help: ["help_request"],
  restaurants: ["business_create", "experience_create"],
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function itemBlob(item: CommunityFeedItem): string {
  return normalize(
    [
      item.title,
      item.description ?? "",
      item.metadata?.locationLabel ?? "",
      item.metadata?.domain ?? "",
      item.type,
    ].join(" "),
  );
}

export function matchingInterestsForItem(
  item: CommunityFeedItem,
  interests: readonly string[],
): PersonalInterestId[] {
  const blob = itemBlob(item);
  const matched: PersonalInterestId[] = [];
  for (const raw of interests) {
    if (!isPersonalInterestId(raw)) continue;
    const hit = INTEREST_KEYWORDS[raw].some((keyword) =>
      blob.includes(normalize(keyword)),
    );
    if (hit) matched.push(raw);
  }
  return matched;
}

export function personalizationReason(
  item: CommunityFeedItem,
  context: PersonalContext,
  favorites: readonly PersonalFavorite[] = [],
): string | undefined {
  if (item.locationId && context.favoriteLocations.includes(item.locationId)) {
    return "Es uno de tus lugares";
  }
  if (
    item.experienceId &&
    favorites.some(
      (row) => row.kind === "experience" && row.targetId === item.experienceId,
    )
  ) {
    return "Sigues esta actividad";
  }
  if (
    item.resourceId &&
    favorites.some(
      (row) => row.kind === "resource" && row.targetId === item.resourceId,
    )
  ) {
    return "Es uno de tus recursos";
  }
  const matched = matchingInterestsForItem(
    item,
    context.preferences.interests,
  );
  if (matched[0]) {
    return `Te interesa ${personalInterestLabel(matched[0]).toLowerCase()}`;
  }
  return undefined;
}

function scoreItem(
  item: CommunityFeedItem,
  index: number,
  context: PersonalContext,
  favorites: readonly PersonalFavorite[],
  trustedOrganizerIds: readonly string[] = [],
): number {
  let score = 0;
  const blob = itemBlob(item);
  const matched = matchingInterestsForItem(
    item,
    context.preferences.interests,
  );
  score += matched.length * 40;
  if (
    context.preferences.interests.includes("family") &&
    ADULT_NIGHT_KEYWORDS.some((keyword) => blob.includes(normalize(keyword)))
  ) {
    score -= 20;
  }
  if (item.locationId && context.favoriteLocations.includes(item.locationId)) {
    score += 50;
  }
  if (
    item.experienceId &&
    favorites.some(
      (row) => row.kind === "experience" && row.targetId === item.experienceId,
    )
  ) {
    score += 45;
  }
  if (
    item.resourceId &&
    favorites.some(
      (row) => row.kind === "resource" && row.targetId === item.resourceId,
    )
  ) {
    score += 35;
  }
  if (
    item.type === "business_activity" &&
    favorites.some((row) => row.kind === "business" && row.targetId === item.id)
  ) {
    score += 35;
  }
  const historyBoost = context.participationHistory.find(
    (row) =>
      (row.type === "experience" && item.type === "experience") ||
      (row.type === "help" && item.metadata?.domain === "help") ||
      (row.type === "event" && item.type === "event"),
  );
  if (historyBoost && historyBoost.count > 0) score += 8;
  if (
    item.metadata?.organizerPersonId &&
    trustedOrganizerIds.includes(item.metadata.organizerPersonId)
  ) {
    score += 10;
  }
  return score * 1000 - index;
}

export function personalizeCommunityFeed(
  input: PersonalizationInput,
): PersonalizedCommunityFeed {
  const enabled = input.context.privacy.receiveRecommendations;
  const favorites = input.favorites ?? [];
  const trustedOrganizerIds = input.trustedOrganizerIds ?? [];
  if (!enabled) {
    return {
      items: input.feed.map((item) => ({ ...item })),
      enabled: false,
      providerId: "rules",
    };
  }
  const ranked = input.feed.map((item, index) => ({
    item,
    index,
    score: scoreItem(
      item,
      index,
      input.context,
      favorites,
      trustedOrganizerIds,
    ),
  }));
  ranked.sort((left, right) => right.score - left.score);
  return {
    items: ranked.map(({ item }) => {
      const reason = personalizationReason(item, input.context, favorites);
      return reason ? { ...item, reason } : { ...item };
    }),
    enabled: true,
    providerId: "rules",
  };
}

export function listCommunityInsights(
  input: PersonalizationInput,
): CommunityInsight[] {
  if (!input.context.privacy.receiveRecommendations) return [];
  const personalized = personalizeCommunityFeed(input);
  const insights: CommunityInsight[] = [];
  for (const item of personalized.items) {
    if (!item.reason) continue;
    const available = item.capacity?.available;
    if (typeof available === "number" && available > 0 && available <= 3) {
      insights.push({
        id: `insight:capacity:${item.id}`,
        title: item.title,
        body: "No quedan muchas plazas para una actividad que te importa.",
        reason: item.reason,
        href: communityFeedItemHref(item),
        itemId: item.id,
      });
    } else if (item.reason === "Es uno de tus lugares") {
      insights.push({
        id: `insight:place:${item.id}`,
        title: item.title,
        body: "Hay una actividad nueva cerca de tu lugar favorito.",
        reason: item.reason,
        href: communityFeedItemHref(item),
        itemId: item.id,
      });
    }
  }
  return insights.slice(0, 3);
}

export function personalizeComposerActions(
  actions: readonly CommunityCreationAction[],
  context: PersonalContext,
): CommunityCreationAction[] {
  if (!context.privacy.receiveRecommendations) return [...actions];
  const preferred = new Set<string>();
  for (const interest of context.preferences.interests) {
    if (!isPersonalInterestId(interest)) continue;
    for (const type of COMPOSER_INTEREST[interest] ?? []) {
      preferred.add(type);
    }
  }
  if (preferred.size === 0) return [...actions];
  return [...actions].sort((left, right) => {
    const leftHit = preferred.has(left.type) ? 0 : 1;
    const rightHit = preferred.has(right.type) ? 0 : 1;
    return leftHit - rightHit;
  });
}

export function composerSuggestionReason(
  action: Pick<CommunityCreationAction, "type">,
  context: PersonalContext,
): string | undefined {
  if (!context.privacy.receiveRecommendations) return undefined;
  for (const interest of context.preferences.interests) {
    if (!isPersonalInterestId(interest)) continue;
    if ((COMPOSER_INTEREST[interest] ?? []).includes(action.type)) {
      return `Porque te interesa ${personalInterestLabel(interest).toLowerCase()}`;
    }
  }
  return undefined;
}

export function personalizeLifePlaceContext(
  place: LifePlaceContext,
  context: PersonalContext,
  favorites: readonly PersonalFavorite[] = [],
): LifePlaceContext {
  if (!context.privacy.receiveRecommendations) return place;
  const ranked = personalizeCommunityFeed({
    context,
    feed: place.currentActivity,
    favorites,
  });
  const rankIndex = (experience: { id: string; title: string }) => {
    const index = ranked.items.findIndex(
      (item) => item.experienceId === experience.id || item.title === experience.title,
    );
    return index === -1 ? ranked.items.length : index;
  };
  const experiences = [...place.experiences].sort(
    (left, right) => rankIndex(left) - rankIndex(right),
  );
  return {
    ...place,
    currentActivity: ranked.items,
    experiences,
    id: place.id,
  };
}

export const RuleBasedPersonalizationProvider: PersonalizationProvider = {
  id: "rules",
  personalize: personalizeCommunityFeed,
};

export const RuleBasedCommunityInsightProvider: CommunityInsightProvider = {
  id: "rules",
  list: listCommunityInsights,
};

export function isOpaqueRecommendationEntity(name: string): boolean {
  return (
    name === "RecommendationEntity" ||
    name === "InterestPost" ||
    name === "AIActivityEntity" ||
    name === "UserScoreEntity" ||
    name === "EngagementEntity"
  );
}

export function hasContinuousLocationTracking(context: PersonalContext): boolean {
  const serialized = JSON.stringify(context);
  return /latitude|longitude|geofence|exactLocation/i.test(serialized);
}
