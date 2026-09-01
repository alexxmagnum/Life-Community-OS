/**
 * Community Intelligence Service — contextual suggestions over territorial life.
 * Composes Personal Context + domain projections. Does not persist intelligence.
 */

import {
  CommunityActionRegistry,
  projectCommunityIntelligenceContext,
  RuleBasedCommunityIntelligenceProvider,
  resolveContributionIdeas,
  resolveDailyIdeas,
  resolvePlaceIdeas,
  explainSuggestion,
  type CommunityIntelligenceContext,
  type CommunitySuggestion,
  type DiscoverExperienceContext,
  type LifeHomeContext,
  type LifePlaceContext,
  type LifePlaceExperienceView,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import { PersonalizationService } from "@/lib/personal/personalization-service";
import { listPersonalFavoritesServer } from "@/lib/personal/server-personal-repository";
import { getTenantPack } from "@/lib/tenant/registry";

async function intelligenceInput(input: {
  tenantId: string;
  actor: RequestActor;
  territoryId: string;
  feed?: readonly import("@life-community-os/types").CommunityFeedItem[];
  place?: LifePlaceContext;
}) {
  const context = await PersonalizationService.resolve({
    tenantId: input.tenantId,
    actor: input.actor,
    territoryId: input.territoryId,
  });
  const favorites =
    input.actor.personId && input.actor.hasMembership
      ? await listPersonalFavoritesServer({
          tenantId: input.tenantId,
          personId: input.actor.personId,
        })
      : [];
  const pack = getTenantPack(input.tenantId);
  const feed =
    input.feed ??
    (await CommunityExperienceFeedService.list({
      tenantId: input.tenantId,
      territoryId: input.territoryId,
      productCapabilities: pack?.productCapabilities,
      permissions: input.actor.permissions,
    }));
  const composerActions = CommunityActionRegistry.list({
    hasMembership: input.actor.hasMembership,
    capabilities: input.actor.permissions,
    productCapabilities: pack?.productCapabilities,
    territoryId: input.territoryId,
  });
  return {
    context,
    feed,
    favorites,
    place: input.place,
    composerActions,
  };
}

export const CommunityIntelligenceService = {
  async resolve(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    place?: LifePlaceContext;
  }): Promise<CommunityIntelligenceContext> {
    const base = await intelligenceInput(input);
    const suggestions = RuleBasedCommunityIntelligenceProvider.resolveSuggestions(
      base,
    );
    return projectCommunityIntelligenceContext({
      context: base.context,
      suggestions,
    });
  },

  resolveSuggestions(input: {
    context: import("@life-community-os/types").PersonalContext;
    feed: readonly import("@life-community-os/types").CommunityFeedItem[];
    favorites?: readonly import("@life-community-os/types").PersonalFavorite[];
    place?: LifePlaceContext;
    composerActions?: readonly import("@life-community-os/types").CommunityCreationAction[];
  }): CommunitySuggestion[] {
    return RuleBasedCommunityIntelligenceProvider.resolveSuggestions(input);
  },

  explainSuggestion,

  async resolveDailyIdeas(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    feed?: readonly import("@life-community-os/types").CommunityFeedItem[];
  }): Promise<CommunitySuggestion[]> {
    const base = await intelligenceInput(input);
    return resolveDailyIdeas(base);
  },

  async resolvePlaceIdeas(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
    place: LifePlaceContext;
  }): Promise<CommunitySuggestion[]> {
    const base = await intelligenceInput(input);
    return resolvePlaceIdeas({ ...base, place: input.place });
  },

  async resolveContributionIdeas(input: {
    tenantId: string;
    actor: RequestActor;
    territoryId: string;
  }): Promise<CommunitySuggestion[]> {
    const base = await intelligenceInput(input);
    return resolveContributionIdeas(base);
  },

  async enrichHome(
    home: LifeHomeContext,
    input: {
      tenantId: string;
      actor: RequestActor;
      territoryId: string;
      feed?: readonly import("@life-community-os/types").CommunityFeedItem[];
    },
  ): Promise<LifeHomeContext> {
    if (!input.actor.hasMembership) return home;
    const forYouToday = await this.resolveDailyIdeas(input);
    return forYouToday.length > 0 ? { ...home, forYouToday } : home;
  },

  async enrichDiscover(
    discover: DiscoverExperienceContext,
    input: {
      tenantId: string;
      actor: RequestActor;
      territoryId: string;
    },
  ): Promise<DiscoverExperienceContext> {
    if (!input.actor.hasMembership) return discover;
    const ideasForToday = await this.resolveDailyIdeas({
      ...input,
      feed: [...discover.nowNearby, ...discover.upcomingPlans],
    });
    return ideasForToday.length > 0 ? { ...discover, ideasForToday } : discover;
  },

  async enrichLifePlaceView(
    view: LifePlaceExperienceView,
    input: {
      tenantId: string;
      actor: RequestActor;
      territoryId: string;
      place: LifePlaceContext;
    },
  ): Promise<LifePlaceExperienceView> {
    if (!input.actor.hasMembership) return view;
    const suggestions = await this.resolvePlaceIdeas(input);
    return suggestions.length > 0 ? { ...view, suggestions } : view;
  },
};
