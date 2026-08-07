/**
 * Community Life Pulse — tenant demo aggregation.
 * Maps existing catalogs into platform CommunityActivity (TECH-011).
 * Tenant configuration + demo content only.
 */

import type { CommunityActivity } from "@life-community-os/types";
import {
  selectCommunityPulse,
  summarizeCommunityPulse,
} from "@life-community-os/types";
import { listPublishedCommunityContent } from "./community-content";
import { listDiscoverableExperiences } from "./experiences";
import { listGroups } from "./groups";
import {
  listNearYou,
  listNeighbourRecommendations,
} from "./local-places";
import { listMarketplaceListings, marketplaceKindLabel } from "./marketplace";
import { listResources } from "./resources";

export type BuildCommunityPulseInput = {
  /** Feature gates from tenant config (ADR-023). */
  features?: {
    experiences?: boolean;
    marketplace?: boolean;
    recommendations?: boolean;
    localLife?: boolean;
    feed?: boolean;
    resources?: boolean;
    groups?: boolean;
  };
  /** Max moments on Home — keep calm. */
  limit?: number;
};

function marketplaceVerb(kind: string): string {
  switch (kind) {
    case "sell":
      return "ofrece";
    case "buy":
      return "busca";
    case "give":
      return "regala";
    case "request":
      return "presta";
    default:
      return "comparte";
  }
}

/**
 * Build a short pulse from existing capabilities — no parallel domain.
 */
export function buildCommunityPulse(
  input: BuildCommunityPulseInput = {},
): CommunityActivity[] {
  const f = input.features ?? {};
  const raw: CommunityActivity[] = [];

  if (f.experiences !== false) {
    for (const exp of listDiscoverableExperiences().slice(0, 4)) {
      const starts = new Date(exp.startsAt).getTime();
      const soon =
        starts > Date.now() && starts - Date.now() < 3 * 60 * 60 * 1000;
      raw.push({
        id: `pulse-exp-${exp.id}`,
        source: "experience",
        headline:
          exp.participantCount > 0
            ? `${exp.participantCount} vecinos en “${exp.title}”`
            : `Plan abierto: ${exp.title}`,
        context: `${exp.location} · ${exp.areaLabel}`,
        imageUrl: exp.imageUrl,
        personName: exp.organizer.name,
        personAvatarUrl: exp.organizer.avatarUrl,
        href: `/experiences/${exp.id}`,
        occurredAt: exp.startsAt,
        weight: soon ? 40 : 20 + Math.min(exp.participantCount, 20),
        live: soon,
      });
    }
  }

  if (f.marketplace !== false) {
    for (const item of listMarketplaceListings().slice(0, 3)) {
      raw.push({
        id: `pulse-mp-${item.id}`,
        source: "marketplace",
        headline: `${item.authorName} ${marketplaceVerb(item.kind)} ${item.title.toLowerCase()}`,
        context: `${marketplaceKindLabel(item.kind)} · ${item.areaLabel}`,
        imageUrl: item.imageUrl,
        personName: item.authorName,
        personAvatarUrl: item.authorAvatarUrl,
        href: "/marketplace",
        occurredAt: item.publishedAt,
        weight: 28,
      });
    }
  }

  if (f.recommendations !== false && f.localLife !== false) {
    for (const tip of listNeighbourRecommendations().slice(0, 3)) {
      raw.push({
        id: `pulse-rec-${tip.id}`,
        source: "recommendation",
        headline: tip.relatedLabel
          ? `${tip.authorName} recomienda ${tip.relatedLabel}`
          : `${tip.authorName} comparte un consejo local`,
        context: tip.body.slice(0, 90),
        imageUrl: tip.imageUrl,
        personName: tip.authorName,
        personAvatarUrl: tip.authorAvatarUrl,
        href: "/discover",
        occurredAt: new Date().toISOString(),
        weight: 24,
      });
    }
  }

  if (f.localLife !== false) {
    const near = listNearYou().filter((e) => e.recommendedBy).slice(0, 2);
    for (const place of near) {
      raw.push({
        id: `pulse-place-${place.id}`,
        source: "local_entity",
        headline: place.recommendedBy
          ? `${place.recommendedBy} señala ${place.name}`
          : `${place.name} cerca de ti`,
        context: `${place.categoryLabel} · ${place.areaLabel}`,
        imageUrl: place.imageUrl,
        personName: place.recommendedBy,
        href: "/discover",
        occurredAt: new Date().toISOString(),
        weight: 18,
      });
    }
  }

  if (f.resources !== false) {
    for (const resource of listResources().slice(0, 2)) {
      raw.push({
        id: `pulse-res-${resource.id}`,
        source: "reservation",
        headline: `${resource.name} · ${resource.availabilityPreview}`,
        context: resource.areaLabel,
        imageUrl: resource.imageUrl,
        href: `/resources/${resource.id}`,
        occurredAt: new Date().toISOString(),
        weight: 22,
      });
    }
  }

  if (f.feed !== false) {
    for (const content of listPublishedCommunityContent().slice(0, 4)) {
      const isOfficial = content.isOfficial || content.type === "announcement";
      raw.push({
        id: `pulse-content-${content.id}`,
        source: isOfficial ? "announcement" : "community_content",
        headline: isOfficial
          ? `Aviso: ${content.title}`
          : `${content.author.name} · ${content.title}`,
        context: content.areaLabel,
        imageUrl: content.imageUrl,
        personName: content.author.name,
        personAvatarUrl: content.author.avatarUrl,
        href: `/community/content/${content.id}`,
        occurredAt: content.publishedAt ?? content.createdAt,
        weight: isOfficial ? 35 : 16,
      });
    }
  }

  if (f.groups !== false) {
    const group = listGroups()[0];
    if (group) {
      raw.push({
        id: `pulse-group-${group.id}`,
        source: "group",
        headline: `Grupo abierto: ${group.name}`,
        context: `${group.memberCount} vecinos · ${group.categoryLabel}`,
        imageUrl: group.imageUrl,
        href: "/community?tab=grupos",
        occurredAt: new Date().toISOString(),
        weight: 12,
      });
    }
  }

  return selectCommunityPulse(raw, { limit: input.limit ?? 5 });
}

export function communityPulseLivingLine(
  activities: readonly CommunityActivity[],
): string {
  const participating = listDiscoverableExperiences().reduce(
    (sum, e) => sum + e.participantCount,
    0,
  );
  if (participating >= 8) {
    return `${participating} vecinos participan en planes cerca`;
  }
  return summarizeCommunityPulse(activities);
}
