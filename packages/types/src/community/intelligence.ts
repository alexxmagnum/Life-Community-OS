/**
 * Community Intelligence — contextual suggestions over territorial life.
 * Projection only. Never stores personality, hidden behaviour or predictions.
 */

import type { CommunityCreationAction } from "./action-composer";
import type { CommunityFeedItem } from "./community-feed";
import { communityFeedItemHref } from "./community-feed";
import type { LifePlaceContext } from "../platform/life-place";
import type {
  PersonalContext,
  PersonalFavorite,
  PersonalInterestId,
  PersonalPreferences,
  PersonalPrivacy,
} from "../personal/personal-context";
import {
  isPersonalInterestId,
  personalInterestLabel,
} from "../personal/personal-context";
import {
  composerSuggestionReason,
  listCommunityInsights,
  personalizeCommunityFeed,
  personalizationReason,
  type CommunityInsight,
  type PersonalizationInput,
} from "../personal/personalization";

export const COMMUNITY_INTELLIGENCE_PROVIDER_IDS = ["rules", "ai"] as const;

export type CommunityIntelligenceProviderId =
  (typeof COMMUNITY_INTELLIGENCE_PROVIDER_IDS)[number];

export type CommunitySuggestionKind =
  | "activity"
  | "place"
  | "help"
  | "contribution"
  | "composer";

export type CommunitySuggestion = {
  id: string;
  title: string;
  body?: string;
  reason: string;
  href?: string;
  kind: CommunitySuggestionKind;
  sourceItemId?: string;
};

export type CommunityIntelligenceContext = {
  personId: string;
  tenantId: string;
  territoryId: string;
  suggestions: CommunitySuggestion[];
  explanations: Record<string, string>;
  preferences: PersonalPreferences;
  privacy: PersonalPrivacy;
  enabled: boolean;
  providerId: CommunityIntelligenceProviderId;
};

export type CommunityIntelligenceInput = PersonalizationInput & {
  place?: LifePlaceContext;
  composerActions?: readonly CommunityCreationAction[];
};

export type CommunityIntelligenceProvider = {
  id: CommunityIntelligenceProviderId;
  resolveSuggestions(input: CommunityIntelligenceInput): CommunitySuggestion[];
};

export type RecommendationProvider = CommunityIntelligenceProvider;

export type ExplanationProvider = {
  id: CommunityIntelligenceProviderId;
  explainSuggestion(
    suggestion: CommunitySuggestion,
    context: PersonalContext,
  ): string;
};

const COMPOSER_CONTRIBUTION_LABELS: Partial<
  Record<PersonalInterestId, readonly string[]>
> = {
  golf: ["Crear una partida de golf", "Organizar experiencia de golf"],
  pool: ["Proponer actividad en piscina", "Organizar aquagym"],
  family: ["Organizar comida vecinal", "Crear evento familiar"],
  help: ["Ayudar con plantas", "Ofrecer ayuda a un vecino"],
  restaurants: ["Organizar comida vecinal", "Proponer experiencia gastronómica"],
  sports: ["Organizar partido", "Crear actividad deportiva"],
};

function isHelpFeedItem(item: CommunityFeedItem): boolean {
  return item.metadata?.domain === "help";
}

function humanActivityTitle(item: CommunityFeedItem): string {
  if (isHelpFeedItem(item)) {
    return `Un vecino necesita ayuda: ${item.title}`;
  }
  if (item.metadata?.locationLabel) {
    return `${item.title} en ${item.metadata.locationLabel}`;
  }
  return item.title;
}

function fallbackReason(item: CommunityFeedItem): string {
  if (isHelpFeedItem(item)) return "Porque alguien en tu comunidad pide ayuda";
  return "Porque ocurre hoy en tu territorio";
}

function insightToSuggestion(insight: CommunityInsight): CommunitySuggestion {
  return {
    id: insight.id,
    title: insight.title,
    body: insight.body,
    reason: insight.reason.startsWith("Porque")
      ? insight.reason
      : `Porque ${insight.reason.charAt(0).toLowerCase()}${insight.reason.slice(1)}`,
    href: insight.href,
    kind: insight.id.includes("place") ? "place" : "activity",
    sourceItemId: insight.itemId,
  };
}

export function explainSuggestion(
  suggestion: CommunitySuggestion,
  context: PersonalContext,
): string {
  if (!context.privacy.receiveRecommendations) {
    return "Las recomendaciones personales están desactivadas";
  }
  return suggestion.reason;
}

export function resolveDailyIdeas(
  input: CommunityIntelligenceInput,
): CommunitySuggestion[] {
  if (!input.context.privacy.receiveRecommendations) return [];
  const favorites = input.favorites ?? [];
  const personalized = personalizeCommunityFeed(input);
  const suggestions: CommunitySuggestion[] = [];
  for (const item of personalized.items.slice(0, 6)) {
    const reason =
      item.reason ??
      personalizationReason(item, input.context, favorites) ??
      fallbackReason(item);
    suggestions.push({
      id: `daily:${item.id}`,
      title: humanActivityTitle(item),
      body: isHelpFeedItem(item)
          ? item.description
          : "Hay algo que puedes hacer hoy cerca de ti.",
      reason: reason.startsWith("Porque")
        ? reason
        : `Porque ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`,
      href: communityFeedItemHref(item),
      kind: isHelpFeedItem(item) ? "help" : "activity",
      sourceItemId: item.id,
    });
  }
  if (suggestions.length === 0 && input.feed.length > 0) {
    for (const item of input.feed.slice(0, 3)) {
      suggestions.push({
        id: `daily:fallback:${item.id}`,
        title: humanActivityTitle(item),
        reason: fallbackReason(item),
        href: communityFeedItemHref(item),
        kind: isHelpFeedItem(item) ? "help" : "activity",
        sourceItemId: item.id,
      });
    }
  }
  for (const insight of listCommunityInsights(input)) {
    suggestions.push(insightToSuggestion(insight));
  }
  const seen = new Set<string>();
  return suggestions.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  }).slice(0, 6);
}

export function resolvePlaceIdeas(
  input: CommunityIntelligenceInput & { place: LifePlaceContext },
): CommunitySuggestion[] {
  if (!input.context.privacy.receiveRecommendations) return [];
  const favorites = input.favorites ?? [];
  const place = input.place;
  const suggestions: CommunitySuggestion[] = [];
  const feedItems = [
    ...place.currentActivity,
    ...place.experiences.map((row) => ({
      id: row.id,
      tenantId: place.tenantId,
      territoryId: place.territoryId,
      type: "experience" as const,
      title: row.title,
      startsAt: row.startsAt,
      actions: { primary: "join" as const },
      experienceId: row.id,
      locationId: place.id,
      metadata: { locationLabel: place.location.name },
    })),
  ];
  const personalized = personalizeCommunityFeed({
    context: input.context,
    feed: feedItems,
    favorites,
    trustedOrganizerIds: input.trustedOrganizerIds,
  });
  for (const item of personalized.items.slice(0, 4)) {
    const reason =
      item.reason ??
      personalizationReason(item, input.context, favorites) ??
      `Porque estás en ${place.location.name}`;
    suggestions.push({
      id: `place:${place.id}:${item.id}`,
      title: item.title,
      body: place.location.category === "pool" ? "Clase o actividad disponible" : undefined,
      reason: reason.startsWith("Porque") ? reason : `Porque ${reason}`,
      href: communityFeedItemHref(item),
      kind: "place",
      sourceItemId: item.id,
    });
  }
  for (const reservation of place.reservations.slice(0, 2)) {
    if (reservation.available <= 0) continue;
    suggestions.push({
      id: `place:reservation:${reservation.context.id}`,
      title: `Reserva abierta: ${reservation.label}`,
      reason: `Porque hay disponibilidad en ${place.location.name}`,
      href: reservation.href,
      kind: "place",
      sourceItemId: reservation.context.id,
    });
  }
  return suggestions.slice(0, 5);
}

export function resolveContributionIdeas(
  input: CommunityIntelligenceInput,
): CommunitySuggestion[] {
  if (!input.context.privacy.receiveRecommendations) return [];
  const suggestions: CommunitySuggestion[] = [];
  for (const interest of input.context.preferences.interests) {
    if (!isPersonalInterestId(interest)) continue;
    const labels = COMPOSER_CONTRIBUTION_LABELS[interest] ?? [];
    for (const label of labels.slice(0, 1)) {
      suggestions.push({
        id: `contribution:${interest}:${label}`,
        title: label,
        reason: `Porque te interesa ${personalInterestLabel(interest).toLowerCase()}`,
        kind: "contribution",
      });
    }
  }
  if (input.composerActions) {
    for (const action of input.composerActions.slice(0, 3)) {
      const reason = composerSuggestionReason(action, input.context);
      if (!reason) continue;
      suggestions.push({
        id: `composer:${action.type}`,
        title: action.title,
        reason,
        href: action.route,
        kind: "composer",
      });
    }
  }
  return suggestions.slice(0, 4);
}

export function resolveSuggestions(
  input: CommunityIntelligenceInput,
): CommunitySuggestion[] {
  const daily = resolveDailyIdeas(input);
  const contributions = resolveContributionIdeas(input);
  const place = input.place ? resolvePlaceIdeas({ ...input, place: input.place }) : [];
  const combined = [...daily, ...contributions, ...place];
  const seen = new Set<string>();
  return combined.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export function projectCommunityIntelligenceContext(input: {
  context: PersonalContext;
  suggestions: readonly CommunitySuggestion[];
  providerId?: CommunityIntelligenceProviderId;
}): CommunityIntelligenceContext {
  const enabled = input.context.privacy.receiveRecommendations;
  const explanations: Record<string, string> = {};
  for (const suggestion of input.suggestions) {
    explanations[suggestion.id] = explainSuggestion(suggestion, input.context);
  }
  return {
    personId: input.context.personId,
    tenantId: input.context.tenantId,
    territoryId: input.context.territoryId,
    suggestions: [...input.suggestions],
    explanations,
    preferences: { ...input.context.preferences },
    privacy: { ...input.context.privacy },
    enabled,
    providerId: input.providerId ?? "rules",
  };
}

export const RuleBasedCommunityIntelligenceProvider: CommunityIntelligenceProvider =
  {
    id: "rules",
    resolveSuggestions,
  };

export function intelligenceDoesNotInventContent(
  sourceCount: number,
  suggestionCount: number,
): boolean {
  return suggestionCount <= Math.max(sourceCount, 6);
}

export function intelligenceRespectsTerritory(
  context: CommunityIntelligenceContext,
  tenantId: string,
  territoryId: string,
): boolean {
  return context.tenantId === tenantId && context.territoryId === territoryId;
}

export function isOpaqueCommunityIntelligenceEntity(name: string): boolean {
  return [
    "GlobalAIEntity",
    "UniversalAssistantEntity",
    "CommunityBrainEntity",
    "UserPredictionEntity",
    "BehaviorTrackingEntity",
    "SocialGraphAI",
    "EngagementOptimizationEngine",
    "ResidentScore",
    "AICommunityManager",
    "UserEngagementScore",
    "PersonalBehaviorTracking",
  ].includes(name);
}

export function suggestionUsesExplicitPreference(
  suggestion: CommunitySuggestion,
): boolean {
  return suggestion.reason.includes("te interesa");
}

export function matchingInterestsForSuggestion(
  suggestion: CommunitySuggestion,
  interests: readonly string[],
): boolean {
  return interests.some(
    (interest) =>
      isPersonalInterestId(interest) &&
      suggestion.reason.includes(personalInterestLabel(interest).toLowerCase()),
  );
}
