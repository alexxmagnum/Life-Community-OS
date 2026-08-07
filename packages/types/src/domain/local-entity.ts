import type { DomainId } from "./ids";

/**
 * Platform Local Entity / Local Discovery capability (ADR-017 + ADR-032).
 * Tenant-neutral — catalogs and copy come from tenant configuration.
 * Not a commercial marketplace or booking system.
 */

/** Kind of local life entity — not a visible nav module. */
export type LocalEntityKind =
  | "restaurant"
  | "cafe"
  | "shop"
  | "service"
  | "place"
  | "other";

/**
 * Discoverable local business, venue or spot in community life.
 * Complements Service Directory profiles; does not invent parallel identity.
 */
export type LocalEntity = {
  id: DomainId;
  name: string;
  kind: LocalEntityKind;
  /** Human category for UI (tenant-localized), e.g. "Restaurante". */
  categoryLabel: string;
  /** Territory / area facet label — not a security boundary. */
  areaLabel: string;
  /** Short story / human context — not a directory description field first. */
  story: string;
  imageUrl: string;
  /** Directory-style verification signal when applicable (ADR-016/017). */
  verified?: boolean;
  /** Neighbour who surfaces trust (ADR-032). */
  recommendedBy?: string;
  /** Optional soft trust line, tenant-authored. */
  trustNote?: string;
};

/**
 * Member-authored local recommendation — social discovery, not reviews commerce.
 */
export type LocalRecommendation = {
  id: DomainId;
  body: string;
  authorName: string;
  authorAvatarUrl?: string;
  imageUrl?: string;
  /** Optional link to a LocalEntity / Directory profile id. */
  relatedEntityId?: DomainId;
  /** Display label for related place (denormalized for UI stubs). */
  relatedLabel?: string;
};

export type LocalDiscoveryFilter = {
  query?: string;
};

function matchesQuery(
  query: string | undefined,
  ...fields: (string | undefined)[]
): boolean {
  const q = query?.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

/** Places to go — restaurants, cafés, shops, interesting spots. */
const NEAR_KINDS: ReadonlySet<LocalEntityKind> = new Set([
  "restaurant",
  "cafe",
  "shop",
  "place",
]);

/** Trusted help — professionals and local service businesses. */
const HELP_KINDS: ReadonlySet<LocalEntityKind> = new Set(["service"]);

export function filterLocalEntities(
  entities: readonly LocalEntity[],
  filter: LocalDiscoveryFilter = {},
): LocalEntity[] {
  return entities.filter((e) =>
    matchesQuery(
      filter.query,
      e.name,
      e.categoryLabel,
      e.areaLabel,
      e.story,
      e.recommendedBy,
      e.trustNote,
    ),
  );
}

export function listEntitiesNearYou(
  entities: readonly LocalEntity[],
  filter: LocalDiscoveryFilter = {},
): LocalEntity[] {
  return filterLocalEntities(entities, filter).filter((e) =>
    NEAR_KINDS.has(e.kind),
  );
}

export function listTrustedHelpEntities(
  entities: readonly LocalEntity[],
  filter: LocalDiscoveryFilter = {},
): LocalEntity[] {
  return filterLocalEntities(entities, filter).filter((e) =>
    HELP_KINDS.has(e.kind),
  );
}

export function filterLocalRecommendations(
  items: readonly LocalRecommendation[],
  filter: LocalDiscoveryFilter = {},
): LocalRecommendation[] {
  return items.filter((r) =>
    matchesQuery(
      filter.query,
      r.body,
      r.authorName,
      r.relatedLabel,
    ),
  );
}
