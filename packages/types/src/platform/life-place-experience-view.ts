/**
 * Life Place Experience View — presentation projection over LifePlaceContext.
 * Location remains SoT. This is not a PlaceEntity aggregate.
 */

import type { LifePlaceContext } from "./life-place";
import {
  LIVING_PLACE_EMPTY_CTA,
  LIVING_PLACE_EMPTY_TITLE,
} from "../community/community-feed";
import { communityFeedLivingLabel } from "../community/community-feed";
import type { CommunitySuggestion } from "../community/intelligence";
import type { CommunityOperationalHint } from "../community/automation";

export type LifePlaceExperienceView = {
  locationId: string;
  tenantId: string;
  territoryId: string;
  identity: {
    name: string;
    type: string;
    category: string;
    summary?: string;
    coverUrl?: string;
  };
  nowLabel?: string;
  currentActivity: LifePlaceContext["currentActivity"];
  upcoming: LifePlaceContext["experiences"];
  reservations: LifePlaceContext["reservations"];
  nearbyServices: LifePlaceContext["nearbyProfessionals"];
  nearbyHelp: LifePlaceContext["nearbyHelp"];
  actions: LifePlaceContext["actions"];
  operationsLabel?: string;
  empty: {
    title: string;
    cta: string;
  };
  suggestions?: CommunitySuggestion[];
  operationalHints?: CommunityOperationalHint[];
};

export function projectLifePlaceExperienceView(
  context: LifePlaceContext,
  suggestions?: readonly CommunitySuggestion[],
  operationalHints?: readonly CommunityOperationalHint[],
): LifePlaceExperienceView {
  const nowItem = context.currentActivity[0];
  const nowLabel = nowItem
    ? `${nowItem.title}${communityFeedLivingLabel(nowItem) ? ` · ${communityFeedLivingLabel(nowItem)}` : ""}`
    : context.operations?.label;
  const hasLife =
    context.currentActivity.length > 0 ||
    context.experiences.length > 0 ||
    context.reservations.length > 0 ||
    Boolean(context.business);
  return {
    locationId: context.id,
    tenantId: context.tenantId,
    territoryId: context.territoryId,
    identity: {
      name: context.location.name,
      type: context.location.type,
      category: context.location.category,
      summary: context.location.summary,
      coverUrl: undefined,
    },
    nowLabel,
    currentActivity: context.currentActivity,
    upcoming: context.experiences,
    reservations: context.reservations,
    nearbyServices: context.nearbyProfessionals,
    nearbyHelp: context.nearbyHelp,
    actions: context.actions,
    operationsLabel: context.operations?.label,
    empty: {
      title: hasLife ? "" : LIVING_PLACE_EMPTY_TITLE,
      cta: LIVING_PLACE_EMPTY_CTA,
    },
    ...(suggestions?.length ? { suggestions: [...suggestions] } : {}),
    ...(operationalHints?.length
      ? { operationalHints: [...operationalHints] }
      : {}),
  };
}

export function lifePlaceMaintainsLocationSoT(
  view: LifePlaceExperienceView,
  locationId: string,
): boolean {
  return view.locationId === locationId;
}

export function lifePlaceViewIsNotSocialProfile(
  view: LifePlaceExperienceView,
): boolean {
  return !("followers" in view) && !("timeline" in view);
}
