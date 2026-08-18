/**
 * Territory Services & Local Life Connection (D.0.7.2.3).
 *
 * Answers: "My place → What can help me here?"
 * Relevance / ranking from Territory Access Context — not AuthZ.
 *
 * Reuses LocalEntity + Near / Services hubs.
 * Does NOT create marketplace, booking, Business Profile, or a directory product.
 */

import type { LocalEntity, LocalEntityKind } from "@life-community-os/types";

import { listLocalEntities } from "./local-places";
import {
  getTerritoryAccessContext,
  territoryDiscoveryAreaLabels,
} from "./territory-access-context";

export type TerritoryLocalLifeGroupId =
  | "home_care"
  | "daily_life"
  | "community_life";

export type TerritoryLocalLifeItem = {
  entity: LocalEntity;
  score: number;
  /** Soft badge when entity area matches residency/claim. */
  inYourArea: boolean;
  href: string;
};

export type TerritoryLocalLifeGroup = {
  id: TerritoryLocalLifeGroupId;
  title: string;
  subtitle: string;
  /** Existing route — Near or Services hub. */
  href: string;
  items: TerritoryLocalLifeItem[];
};

export type TerritoryLocalLifeContext = {
  personId: string;
  preferredAreaLabels: string[];
  belongingLine: string;
  groups: TerritoryLocalLifeGroup[];
  /** Flat top picks across groups for compact rails. */
  highlights: TerritoryLocalLifeItem[];
};

const HOME_CARE_HINTS = [
  "jardin",
  "jardinería",
  "piscina",
  "pool",
  "repar",
  "manten",
  "limpie",
  "llave",
  "cerraj",
  "hogar",
  "mascota",
  "animal",
];

type GroupDef = {
  id: TerritoryLocalLifeGroupId;
  title: string;
  subtitle: string;
  href: string;
  kinds: readonly LocalEntityKind[];
  /** Optional keyword preference within those kinds. */
  preferHints?: readonly string[];
};

const GROUP_DEFS: readonly GroupDef[] = [
  {
    id: "home_care",
    title: "Cuidado del hogar",
    subtitle: "Jardinería, reparaciones y ayuda cerca de casa.",
    href: "/services/professionals",
    kinds: ["service"],
    preferHints: HOME_CARE_HINTS,
  },
  {
    id: "daily_life",
    title: "Vida diaria",
    subtitle: "Restaurantes, cafés y comercios del territorio.",
    href: "/map",
    kinds: ["restaurant", "cafe", "shop"],
  },
  {
    id: "community_life",
    title: "Vida en comunidad",
    subtitle: "Lugares y puntos de encuentro alrededor de ti.",
    href: "/map",
    kinds: ["place", "other"],
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function areaMatches(
  entity: LocalEntity,
  preferredAreaLabels: readonly string[],
): boolean {
  if (preferredAreaLabels.length === 0) return false;
  const area = normalize(entity.areaLabel);
  return preferredAreaLabels.some((label) =>
    area.includes(normalize(label)),
  );
}

function hrefForEntity(entity: LocalEntity): string {
  switch (entity.kind) {
    case "service":
      return "/services/professionals";
    case "restaurant":
    case "cafe":
    case "shop":
    case "place":
    default:
      return `/map?focus=${encodeURIComponent(`loc-catalog-${entity.id}-life-panoramica`)}`;
  }
}

function scoreEntity(
  entity: LocalEntity,
  preferredAreaLabels: readonly string[],
  preferHints?: readonly string[],
): { score: number; inYourArea: boolean } {
  const inYourArea = areaMatches(entity, preferredAreaLabels);
  let score = inYourArea ? 40 : 8;
  if (entity.recommendedBy) score += 10;
  if (
    entity.verified ||
    entity.verificationLevel === "business_verified" ||
    entity.verificationLevel === "official_verified"
  ) {
    score += 6;
  }
  if (preferHints?.length) {
    const blob = normalize(
      `${entity.name} ${entity.categoryLabel} ${entity.story}`,
    );
    if (preferHints.some((h) => blob.includes(normalize(h)))) score += 12;
  }
  return { score, inYourArea };
}

function rankEntities(
  kinds: readonly LocalEntityKind[],
  preferredAreaLabels: readonly string[],
  preferHints: readonly string[] | undefined,
  limit: number,
): TerritoryLocalLifeItem[] {
  const kindSet = new Set(kinds);
  return listLocalEntities()
    .filter((e) => kindSet.has(e.kind))
    .map((entity) => {
      const { score, inYourArea } = scoreEntity(
        entity,
        preferredAreaLabels,
        preferHints,
      );
      return {
        entity,
        score,
        inYourArea,
        href: hrefForEntity(entity),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.entity.id.localeCompare(b.entity.id, "en"),
    )
    .slice(0, limit);
}

/**
 * Territory-aware local life rails for Services / discovery.
 * Ranking only — does not grant permissions.
 */
export function getTerritoryLocalLife(
  personId: string,
  options: { limitPerGroup?: number; highlightLimit?: number } = {},
): TerritoryLocalLifeContext {
  const limitPerGroup = options.limitPerGroup ?? 3;
  const highlightLimit = options.highlightLimit ?? 4;
  const access = getTerritoryAccessContext(personId);
  const preferredAreaLabels = territoryDiscoveryAreaLabels(personId);

  const belongingLine = access.hasVerifiedResidency
    ? `Útil cerca de ${access.verifiedAreaLabels.join(", ")}`
    : access.home.primary
      ? "Sugerencias alrededor de tu lugar en el territorio"
      : "Vida local del territorio";

  const groups: TerritoryLocalLifeGroup[] = GROUP_DEFS.map((def) => ({
    id: def.id,
    title: def.title,
    subtitle: def.subtitle,
    href: def.href,
    items: rankEntities(
      def.kinds,
      preferredAreaLabels,
      def.preferHints,
      limitPerGroup,
    ),
  })).filter((g) => g.items.length > 0);

  const highlights = [...groups.flatMap((g) => g.items)]
    .sort(
      (a, b) =>
        b.score - a.score || a.entity.id.localeCompare(b.entity.id, "en"),
    )
    .filter(
      (item, index, all) =>
        all.findIndex((x) => x.entity.id === item.entity.id) === index,
    )
    .slice(0, highlightLimit);

  return {
    personId,
    preferredAreaLabels,
    belongingLine,
    groups,
    highlights,
  };
}

/**
 * Rank an existing LocalEntity list by territory relevance (stable).
 */
export function rankLocalEntitiesForTerritory(
  entities: readonly LocalEntity[],
  personId: string,
): LocalEntity[] {
  const preferred = territoryDiscoveryAreaLabels(personId);
  return [...entities]
    .map((entity) => ({
      entity,
      ...scoreEntity(entity, preferred),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || a.entity.id.localeCompare(b.entity.id, "en"),
    )
    .map((row) => row.entity);
}
