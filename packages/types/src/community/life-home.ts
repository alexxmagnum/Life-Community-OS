/**
 * Territory Home Experience — read projection over existing domains.
 * Does not create UniversalCommunityFeed, SocialGraph, or CommunityClone.
 */

import type { CommunityFeedItem } from "./community-feed";
import {
  LIVING_EMPTY_CTA,
  LIVING_EMPTY_DESCRIPTION,
  LIVING_EMPTY_TITLE,
  partitionLivingCommunityFeed,
} from "./community-feed";
import type { CommunityCreationSource } from "./action-composer";
import type { CommunitySuggestion } from "./intelligence";
import type { LifeHomeCommunicationSummary } from "./communication";
import type { CommunityOperationAction } from "./operations";
import type { TerritoryDailyPulse } from "./operations";
import type { TerritoryHomeQuery } from "../platform/territory-experience";
import { membershipGrantsCommunityAccess } from "../domain/membership";
import type { MembershipStatus } from "../domain/membership";
import { magicPlusEligible } from "../membership/onboarding-context";
import { CAPABILITIES } from "../platform/capabilities";

export type LifeHomeTerritoryHero = {
  tenantId: string;
  territoryId: string;
  territoryName: string;
};

export type LifeHomePlace = {
  id: string;
  name: string;
  label?: string;
  href: string;
};

export type LifeHomeAction = {
  kind: "do" | "contribute" | "discover";
  label: string;
  href?: string;
  composerSource?: CommunityCreationSource;
};

export type LifeHomeEmptyState = {
  title: string;
  description: string;
  cta: string;
  secondaryCta?: string;
  discoverCta?: string;
};

export type LifeHomeMembershipScope = "guest" | "pending" | "active";

export type LifeHomeContext = {
  territory: LifeHomeTerritoryHero;
  moments: CommunityFeedItem[];
  currentActivities: CommunityFeedItem[];
  upcomingActivities: CommunityFeedItem[];
  places: LifeHomePlace[];
  actions: LifeHomeAction[];
  empty?: LifeHomeEmptyState;
  magicPlusEligible: boolean;
  membershipScope: LifeHomeMembershipScope;
  forYouToday?: CommunitySuggestion[];
  communication?: LifeHomeCommunicationSummary;
};

export type ProfileLifeContext = {
  tenantId: string;
  territoryId: string;
  title: string;
  places: LifeHomePlace[];
  experiences: Array<{ id: string; title: string; href: string }>;
  reservations: Array<{ id: string; title: string; href: string }>;
  help: Array<{ id: string; title: string; href: string }>;
  contributions: Array<{ id: string; label: string }>;
  isPublicTimeline: false;
};

export function resolveLifeHomeMembershipScope(input: {
  hasMembership: boolean;
  membershipStatus?: MembershipStatus | null;
}): LifeHomeMembershipScope {
  if (
    input.hasMembership &&
    membershipGrantsCommunityAccess(input.membershipStatus ?? "active")
  ) {
    return "active";
  }
  if (
    input.membershipStatus === "pending" ||
    input.membershipStatus === "invited"
  ) {
    return "pending";
  }
  return "guest";
}

export function projectLifeHomeContext(input: {
  query: TerritoryHomeQuery;
  territoryName: string;
  pulse: TerritoryDailyPulse;
  favoritePlaces?: readonly LifeHomePlace[];
  operationActions?: readonly CommunityOperationAction[];
  membershipScope: LifeHomeMembershipScope;
  capabilities: readonly string[];
  forYouToday?: readonly CommunitySuggestion[];
}): LifeHomeContext {
  const living = partitionLivingCommunityFeed([
    ...input.pulse.now,
    ...input.pulse.next,
    ...input.pulse.community,
  ]);
  const moments = [...living.moments, ...input.pulse.important.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    territoryId: row.territoryId,
    type: "community" as const,
    title: row.title,
    description: row.body,
    actions: { primary: "view" as const },
  }))];
  const actions: LifeHomeAction[] = [
    ...(input.operationActions ?? []).map((row) => ({
      kind:
        row.kind === "create_today" || row.kind === "create_here"
          ? ("contribute" as const)
          : row.kind === "view_place"
            ? ("discover" as const)
            : ("do" as const),
      label: row.label,
      href: row.href,
      composerSource:
        row.kind === "create_today"
          ? ("home" as CommunityCreationSource)
          : row.kind === "create_here"
            ? ("life_place" as CommunityCreationSource)
            : undefined,
    })),
    {
      kind: "discover",
      label: "Descubrir lugares",
      href: "/discover",
    },
  ];
  const hasLife =
    input.pulse.now.length > 0 ||
    input.pulse.next.length > 0 ||
    moments.length > 0;
  const empty = hasLife
    ? undefined
    : {
        title: LIVING_EMPTY_TITLE,
        description: LIVING_EMPTY_DESCRIPTION,
        cta: LIVING_EMPTY_CTA,
        secondaryCta: "Proponer actividad",
        discoverCta: "Descubrir lugares",
      };
  return {
    territory: {
      tenantId: input.query.tenantId,
      territoryId: input.query.territoryId ?? "",
      territoryName: input.territoryName,
    },
    moments,
    currentActivities: input.pulse.now,
    upcomingActivities: input.pulse.next,
    places: [...(input.favoritePlaces ?? [])],
    actions,
    empty,
    magicPlusEligible: magicPlusEligible({
      membershipStatus:
        input.membershipScope === "active"
          ? "active"
          : input.membershipScope === "pending"
            ? "pending"
            : "removed",
      capabilities: input.capabilities,
      requiredCapability: CAPABILITIES.experienceCreate,
    }),
    membershipScope: input.membershipScope,
    ...(input.forYouToday?.length
      ? { forYouToday: [...input.forYouToday] }
      : {}),
  };
}

export function projectProfileLifeContext(input: {
  tenantId: string;
  territoryId: string;
  places?: readonly LifeHomePlace[];
  experiences?: Array<{ id: string; title: string; href: string }>;
  reservations?: Array<{ id: string; title: string; href: string }>;
  help?: Array<{ id: string; title: string; href: string }>;
  contributions?: Array<{ id: string; label: string }>;
}): ProfileLifeContext {
  return {
    tenantId: input.tenantId,
    territoryId: input.territoryId,
    title: "Mi vida aquí",
    places: [...(input.places ?? [])],
    experiences: [...(input.experiences ?? [])],
    reservations: [...(input.reservations ?? [])],
    help: [...(input.help ?? [])],
    contributions: [...(input.contributions ?? [])],
    isPublicTimeline: false,
  };
}

export function isOpaqueCommunityExperienceEntity(name: string): boolean {
  return [
    "GlobalSocialNetworkEntity",
    "UniversalCommunityFeed",
    "UserEngagementScore",
    "ResidentRanking",
    "SocialGraph",
    "PersonalBehaviorTracking",
    "CommunityClone",
    "CrossTenantExperienceEntity",
    "EngagementScore",
  ].includes(name);
}

export function personalizationDoesNotInventContent(
  originalCount: number,
  personalizedCount: number,
): boolean {
  return personalizedCount <= originalCount;
}

export function homeShowsTerritoryLife(context: LifeHomeContext): boolean {
  return (
    context.currentActivities.length > 0 ||
    context.upcomingActivities.length > 0 ||
    context.moments.length > 0 ||
    Boolean(context.empty)
  );
}
