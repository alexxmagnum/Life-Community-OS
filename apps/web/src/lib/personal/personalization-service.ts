/**
 * Personalization Service — applies Personal Context to existing projections.
 * Does not persist a recommendation entity. Territory comes from Active Territory.
 */

import {
  emptyPersonalContext,
  personalizeComposerActions,
  personalizeLifePlaceContext,
  RuleBasedCommunityInsightProvider,
  RuleBasedPersonalizationProvider,
  type CommunityCreationAction,
  type CommunityFeedItem,
  type CommunityInsight,
  type LifePlaceContext,
  type PersonalContext,
  type PersonalizedCommunityFeed,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { listOwnCommunityActivity } from "@/lib/community/community-participation-service";
import { createCommunityNotification } from "@/lib/community/server-community-repository";
import {
  getPersonalContextServer,
  listDeliveredInsightIdsServer,
  listPersonalFavoritesServer,
  markInsightsDeliveredServer,
  patchPersonalContextServer,
} from "@/lib/personal/server-personal-repository";

function historyFromOwn(own: {
  experiencesCreated: { id: string }[];
  upcomingEvents: { id: string }[];
  helpOffered: { id: string }[];
  upcomingReservations: { id: string }[];
}) {
  return [
    { type: "experience", count: own.experiencesCreated.length },
    { type: "event", count: own.upcomingEvents.length },
    { type: "help", count: own.helpOffered.length },
    { type: "reservation", count: own.upcomingReservations.length },
  ].filter((row) => row.count > 0);
}

export async function resolvePersonalContext(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
}): Promise<PersonalContext> {
  const personId = input.actor.personId;
  if (!input.actor.hasMembership || !personId) {
    return emptyPersonalContext({
      personId: "anonymous",
      tenantId: input.tenantId,
      territoryId: input.territoryId,
    });
  }
  let history: { type: string; count: number }[] = [];
  try {
    const own = await listOwnCommunityActivity({
      tenantId: input.tenantId,
      actor: input.actor,
    });
    history = historyFromOwn(own);
  } catch {
    history = [];
  }
  return getPersonalContextServer({
    tenantId: input.tenantId,
    personId,
    territoryId: input.territoryId,
    participationHistory: history,
  });
}

export async function savePersonalPreferences(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  interests?: string[];
  categories?: string[];
  privacy?: Partial<PersonalContext["privacy"]>;
}): Promise<PersonalContext> {
  const personId = input.actor.personId;
  if (!personId || !input.actor.hasMembership) {
    return emptyPersonalContext({
      personId: "anonymous",
      tenantId: input.tenantId,
      territoryId: input.territoryId,
    });
  }
  return patchPersonalContextServer({
    tenantId: input.tenantId,
    personId,
    territoryId: input.territoryId,
    interests: input.interests,
    categories: input.categories,
    privacy: input.privacy,
  });
}

export async function personalizeFeedForActor(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  items: readonly CommunityFeedItem[];
}): Promise<PersonalizedCommunityFeed> {
  const personId = input.actor.personId;
  if (!personId || !input.actor.hasMembership) {
    return {
      items: [...input.items],
      enabled: false,
      providerId: "rules",
    };
  }
  const context = await resolvePersonalContext(input);
  const favorites = await listPersonalFavoritesServer({
    tenantId: input.tenantId,
    personId,
  });
  return RuleBasedPersonalizationProvider.personalize({
    context,
    feed: input.items,
    favorites,
  });
}

export async function personalizePlaceForActor(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  place: LifePlaceContext;
}): Promise<LifePlaceContext> {
  const personId = input.actor.personId;
  if (!personId || !input.actor.hasMembership) return input.place;
  const context = await resolvePersonalContext(input);
  const favorites = await listPersonalFavoritesServer({
    tenantId: input.tenantId,
    personId,
  });
  return personalizeLifePlaceContext(input.place, context, favorites);
}

export async function suggestComposerActionsForActor(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  actions: readonly CommunityCreationAction[];
}): Promise<{
  actions: CommunityCreationAction[];
  context: PersonalContext;
}> {
  const context = await resolvePersonalContext(input);
  return {
    actions: personalizeComposerActions(input.actions, context),
    context,
  };
}

export async function listInsightsForActor(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  items: readonly CommunityFeedItem[];
  publish?: boolean;
}): Promise<CommunityInsight[]> {
  const personId = input.actor.personId;
  if (!personId || !input.actor.hasMembership) return [];
  const context = await resolvePersonalContext(input);
  const favorites = await listPersonalFavoritesServer({
    tenantId: input.tenantId,
    personId,
  });
  const insights = RuleBasedCommunityInsightProvider.list({
    context,
    feed: input.items,
    favorites,
  });
  if (!input.publish || !context.privacy.receiveRecommendations) {
    return insights;
  }
  const delivered = new Set(
    await listDeliveredInsightIdsServer({
      tenantId: input.tenantId,
      personId,
    }),
  );
  const fresh = insights.filter((item) => !delivered.has(item.id));
  for (const insight of fresh) {
    await createCommunityNotification({
      tenantId: input.tenantId,
      recipientPersonId: personId,
      kind: "experience_reminder",
      title: insight.title,
      body: `${insight.body} ${insight.reason}`.trim(),
      createdBy: personId,
    });
  }
  if (fresh.length > 0) {
    await markInsightsDeliveredServer({
      tenantId: input.tenantId,
      personId,
      ids: fresh.map((item) => item.id),
    });
  }
  return insights;
}

export const PersonalizationService = {
  resolve: resolvePersonalContext,
  save: savePersonalPreferences,
  feed: personalizeFeedForActor,
  place: personalizePlaceForActor,
  composer: suggestComposerActionsForActor,
  insights: listInsightsForActor,
};
