import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Community Life Pulse — platform capability.
 * Aggregates existing domain signals into a short living view.
 * Not a social network feed. Not a Panoramica-specific module.
 */

export type CommunityActivitySource =
  | "experience"
  | "marketplace"
  | "recommendation"
  | "local_entity"
  | "community_content"
  | "announcement"
  | "reservation"
  | "group";

/**
 * One human-readable moment in community life.
 * Built from existing capabilities — does not duplicate their models.
 */
export type CommunityActivity = {
  id: DomainId;
  source: CommunityActivitySource;
  /** Narrative line residents read first. */
  headline: string;
  /** Soft supporting context (place, time, people). */
  context?: string;
  imageUrl?: string;
  personName?: string;
  personAvatarUrl?: string;
  /** App route or deep link — tenant decides paths. */
  href?: string;
  occurredAt: IsoDateTimeString;
  /** Ranking hint — higher surfaces first. */
  weight?: number;
  /** Happening soon / live signal. */
  live?: boolean;
};

export type CommunityPulseOptions = {
  /** Default 5 — Home should stay calm (3–5). */
  limit?: number;
};

/**
 * Select a short, ranked pulse from mixed activity sources.
 * Prefer live / high weight, then recency. Deduplicate by id.
 */
export function selectCommunityPulse(
  activities: readonly CommunityActivity[],
  options: CommunityPulseOptions = {},
): CommunityActivity[] {
  const limit = options.limit ?? 5;
  const seen = new Set<string>();
  const unique = activities.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return Boolean(a.headline?.trim());
  });

  return [...unique]
    .sort((a, b) => {
      const liveDiff = Number(Boolean(b.live)) - Number(Boolean(a.live));
      if (liveDiff !== 0) return liveDiff;
      const weightDiff = (b.weight ?? 0) - (a.weight ?? 0);
      if (weightDiff !== 0) return weightDiff;
      return (
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
    })
    .slice(0, limit);
}

/**
 * Soft living-line for Home — Spanish default; tenants may override.
 */
export function summarizeCommunityPulse(
  activities: readonly CommunityActivity[],
  emptyLine = "Hoy está tranquilo en la comunidad",
): string {
  if (activities.length === 0) return emptyLine;
  const live = activities.filter((a) => a.live).length;
  if (live > 0) {
    return live === 1
      ? "Hay algo pasando ahora cerca de ti"
      : `Hay ${live} momentos vivos cerca de ti`;
  }
  return "Hay vida cerca de ti";
}
