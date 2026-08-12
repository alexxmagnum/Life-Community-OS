/**
 * Community Hub IA — Phase D.0.7.1.1
 *
 * Canonical Community area model for Life Panoramica.
 * Single source of truth for:
 *   - Community Hub deep links (`/community?tab=`)
 *   - Hamburger Comunidad leaves (Navigation Projector)
 *   - Module Registry deep-link targets
 *   - Belong H1 layer / scroll-section compatibility maps
 *
 * H1 ownership (Belong): plaza, groups, decide, official entry.
 * Target visible layers (future reshape): Ahora · Grupos · Proponer · Oficial.
 * Eight area ids remain for deep-link compatibility (D5/D6 pending).
 * Housing (D13) is not a Community Explorar peer.
 *
 * Community is the place neighbours live the territory.
 * Communication remains a contextual capability — not this hub.
 *
 * Compatibility maps power FASE C.1 Belong nav without new public routes.
 * DOM section ids stay `plaza-*` until a later cleanup phase.
 */

import type { TenantConfiguration } from "@life-community-os/types";
import { isTenantModuleEnabled } from "@life-community-os/types";

import {
  listPublishedCommunityContent,
  type CommunityContent,
} from "./community-content";
import type { ExplorerNavLeaf } from "./explorer-nav";
import type { TenantFeatureFlags } from "./features";
import { listGroups, type CommunityGroup } from "./groups";
import { listLocalPlaces, type LocalPlace } from "./local-places";
import { listResources, type CommunityResource } from "./resources";
import { listWorkPosts, type WorkPostListing } from "./work-posts";

export const COMMUNITY_HUB_AREA_IDS = [
  "actualidad",
  "grupos",
  "conversaciones",
  "canales",
  "propuestas",
  "participacion",
  "espacios",
  "mascotas",
] as const;

export type CommunityHubAreaId = (typeof COMMUNITY_HUB_AREA_IDS)[number];

/**
 * H1 Belong layers (product grammar). Not DOM ids — UI still uses plaza-* sections.
 * Plaza feed placement and Explorar remain outside this quartet until decided.
 */
export const COMMUNITY_BELONG_LAYER_IDS = [
  "ahora",
  "grupos",
  "proponer",
  "oficial",
] as const;

export type CommunityBelongLayerId =
  (typeof COMMUNITY_BELONG_LAYER_IDS)[number];

/**
 * Scroll landing ids on CommunityScreen (DOM contract).
 * Kept as plaza-* for anchor / deep-link stability until FASE C.
 */
export const COMMUNITY_HUB_SECTION_IDS = {
  ahora: "plaza-important",
  plaza: "plaza-activity",
  grupos: "plaza-people",
  proponer: "plaza-participate",
  oficial: "plaza-official",
  explore: "plaza-explore",
} as const;

export type CommunityHubSectionId =
  (typeof COMMUNITY_HUB_SECTION_IDS)[keyof typeof COMMUNITY_HUB_SECTION_IDS];

/**
 * Canonical area → current scroll section (compatibility; identical to prior
 * inline map in CommunityScreen).
 */
export const COMMUNITY_HUB_AREA_SECTION: Record<
  CommunityHubAreaId,
  CommunityHubSectionId
> = {
  actualidad: COMMUNITY_HUB_SECTION_IDS.ahora,
  conversaciones: COMMUNITY_HUB_SECTION_IDS.plaza,
  grupos: COMMUNITY_HUB_SECTION_IDS.grupos,
  propuestas: COMMUNITY_HUB_SECTION_IDS.proponer,
  participacion: COMMUNITY_HUB_SECTION_IDS.proponer,
  canales: COMMUNITY_HUB_SECTION_IDS.oficial,
  espacios: COMMUNITY_HUB_SECTION_IDS.explore,
  mascotas: COMMUNITY_HUB_SECTION_IDS.explore,
};

export function communityHubSectionIdForArea(
  areaId: CommunityHubAreaId,
): CommunityHubSectionId {
  return COMMUNITY_HUB_AREA_SECTION[areaId];
}

/**
 * Conceptual Belong ownership for each area id.
 * Used by FASE C.1 nav highlight and future reshape — does not delete area ids.
 */
export type CommunityBelongOwnership =
  | { kind: "belong"; layer: CommunityBelongLayerId }
  | {
      kind: "pending";
      /** Product decision id or short reason — not user-facing copy. */
      reason: "plaza" | "D5" | "D6" | "mascotas" | "D13" | "closing-peek";
    }
  | { kind: "outside"; owner: "operate" | "life" | "housing" };

export const COMMUNITY_HUB_AREA_BELONG: Record<
  CommunityHubAreaId,
  CommunityBelongOwnership
> = {
  actualidad: { kind: "belong", layer: "ahora" },
  grupos: { kind: "belong", layer: "grupos" },
  propuestas: { kind: "belong", layer: "proponer" },
  canales: { kind: "belong", layer: "oficial" },
  /** Same land as Proponer until D5; ownership still pending merge vs alias-only. */
  participacion: { kind: "pending", reason: "D5" },
  /** Plaza feed — Belong content; parent layer undecided (Ahora vs own block). */
  conversaciones: { kind: "pending", reason: "plaza" },
  espacios: { kind: "outside", owner: "operate" },
  mascotas: { kind: "pending", reason: "mascotas" },
};

export function communityBelongOwnershipForArea(
  areaId: CommunityHubAreaId,
): CommunityBelongOwnership {
  return COMMUNITY_HUB_AREA_BELONG[areaId];
}

/**
 * Visible Belong layers for Community hub navigation (FASE C.1).
 * Labels are user-facing; primaryAreaId keeps `?tab=` on canonical area ids.
 */
export type CommunityBelongLayerDefinition = {
  id: CommunityBelongLayerId;
  label: string;
  purpose: string;
  sectionId: CommunityHubSectionId;
  /** Canonical area written to `?tab=` when the neighbour picks this layer. */
  primaryAreaId: CommunityHubAreaId;
};

export const communityBelongLayers: readonly CommunityBelongLayerDefinition[] =
  [
    {
      id: "ahora",
      label: "Ahora",
      purpose: "Lo que te afecta hoy en la comunidad.",
      sectionId: COMMUNITY_HUB_SECTION_IDS.ahora,
      primaryAreaId: "actualidad",
    },
    {
      id: "grupos",
      label: "Grupos",
      purpose: "Vecinos organizados por afición o interés.",
      sectionId: COMMUNITY_HUB_SECTION_IDS.grupos,
      primaryAreaId: "grupos",
    },
    {
      id: "proponer",
      label: "Proponer",
      purpose: "Propuestas abiertas para decidir juntos.",
      sectionId: COMMUNITY_HUB_SECTION_IDS.proponer,
      primaryAreaId: "propuestas",
    },
    {
      id: "oficial",
      label: "Oficial",
      purpose: "Administración, entidades y canales.",
      sectionId: COMMUNITY_HUB_SECTION_IDS.oficial,
      primaryAreaId: "canales",
    },
  ] as const;

export function communityBelongLayerDefinition(
  layerId: CommunityBelongLayerId,
): CommunityBelongLayerDefinition {
  return communityBelongLayers.find((layer) => layer.id === layerId)!;
}

/**
 * Map a canonical area to a Belong layer for nav highlight.
 * Pending plaza / outside areas return null (no Belong chip forced).
 * `participacion` soft-highlights Proponer (same scroll land; D5 still open).
 */
export function communityBelongLayerFromArea(
  areaId: CommunityHubAreaId,
): CommunityBelongLayerId | null {
  const ownership = COMMUNITY_HUB_AREA_BELONG[areaId];
  if (ownership.kind === "belong") return ownership.layer;
  if (areaId === "participacion") return "proponer";
  return null;
}

/** Resolve Belong layer from `?tab=` (layer alias or canonical / legacy area). */
export function resolveCommunityBelongLayer(
  raw: string | null | undefined,
): CommunityBelongLayerId | null {
  if (!raw) return null;
  if ((COMMUNITY_BELONG_LAYER_IDS as readonly string[]).includes(raw)) {
    return raw as CommunityBelongLayerId;
  }
  const area = resolveCommunityHubArea(raw);
  if (!area) return null;
  return communityBelongLayerFromArea(area);
}

export type CommunityHubAreaIcon = ExplorerNavLeaf["icon"] | "family";

export type CommunityHubAreaDefinition = {
  id: CommunityHubAreaId;
  label: string;
  /** Short purpose for hub empty states / area intros. */
  purpose: string;
  icon: CommunityHubAreaIcon;
  /** Platform Module Registry ids — any listed module may gate the area. */
  moduleIds: readonly string[];
  /** Feature flags that must be on when listed (all required). */
  featureKeys?: readonly (keyof TenantFeatureFlags)[];
  /** When true, every moduleId must be enabled (default: any). */
  requireAllModules?: boolean;
};

/**
 * Canonical eight Community areas — order is product IA.
 */
export const communityHubAreas: readonly CommunityHubAreaDefinition[] = [
  {
    id: "actualidad",
    label: "Actualidad",
    purpose: "Lo que está pasando ahora en la comunidad.",
    icon: "info",
    moduleIds: ["community"],
    featureKeys: ["feed"],
  },
  {
    id: "grupos",
    label: "Grupos",
    purpose: "Comunidades organizadas de vecinos.",
    icon: "people",
    moduleIds: ["community.groups"],
    featureKeys: ["groups"],
    requireAllModules: true,
  },
  {
    id: "conversaciones",
    label: "Conversaciones",
    purpose: "Discusiones contextuales de la comunidad — no un chat global.",
    icon: "help",
    moduleIds: ["community"],
    featureKeys: ["feed"],
  },
  {
    id: "canales",
    label: "Canales",
    purpose: "Organización de la información comunitaria.",
    icon: "public",
    moduleIds: ["community.channels"],
    featureKeys: ["communityChannels"],
  },
  {
    id: "propuestas",
    label: "Propuestas",
    purpose: "Ideas para decidir juntos.",
    icon: "proposal",
    moduleIds: ["community.proposals"],
    featureKeys: ["decide"],
    requireAllModules: true,
  },
  {
    id: "participacion",
    label: "Participación",
    purpose: "Cómo participar y aportar en la vida de la comunidad.",
    icon: "handshake",
    moduleIds: ["community.proposals", "community"],
    featureKeys: ["decide"],
  },
  {
    id: "espacios",
    label: "Espacios comunitarios",
    purpose: "Lugares compartidos de la comunidad.",
    icon: "place",
    moduleIds: ["community", "reservations"],
  },
  {
    id: "mascotas",
    label: "Mascotas",
    purpose: "Vida con mascotas en la comunidad.",
    icon: "family",
    moduleIds: ["community.pets"],
    requireAllModules: true,
  },
] as const;

export function communityHubHref(areaId: CommunityHubAreaId): string {
  return `/community?tab=${areaId}`;
}

export type CommunityHubVisibilityInput = {
  isModuleEnabled: (moduleId: string) => boolean;
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean;
};

function areaVisible(
  area: CommunityHubAreaDefinition,
  input: CommunityHubVisibilityInput,
): boolean {
  const modulesOk = area.requireAllModules
    ? area.moduleIds.every((id) => input.isModuleEnabled(id))
    : area.moduleIds.some((id) => input.isModuleEnabled(id));
  if (!modulesOk) return false;
  if (area.featureKeys?.length) {
    // Actualidad / Conversaciones: feed OR interactions
    if (
      area.id === "actualidad" ||
      area.id === "conversaciones"
    ) {
      return (
        input.isFeatureEnabled("feed") ||
        input.isFeatureEnabled("interactions")
      );
    }
    // Canales: community or official channels
    if (area.id === "canales") {
      return (
        input.isFeatureEnabled("communityChannels") ||
        input.isFeatureEnabled("officialChannels")
      );
    }
    return area.featureKeys.every((key) => input.isFeatureEnabled(key));
  }
  return true;
}

export function listVisibleCommunityHubAreas(
  input: CommunityHubVisibilityInput,
): CommunityHubAreaDefinition[] {
  return communityHubAreas.filter((area) => areaVisible(area, input));
}

/**
 * Legacy / alternate tab ids → canonical Community Hub area.
 * Preserves existing deep links without parallel routes.
 * H1 layer aliases resolve to today's area ids (no new public paths).
 */
const LEGACY_TAB_MAP: Record<string, CommunityHubAreaId> = {
  feed: "actualidad",
  news: "actualidad",
  talk: "conversaciones",
  groups: "grupos",
  decide: "propuestas",
  decidir: "propuestas",
  channels: "canales",
  experiences: "actualidad",
  pets: "mascotas",
  participation: "participacion",
  spaces: "espacios",
  // H1 Belong layer aliases → current areas (FASE B compatibility)
  ahora: "actualidad",
  proponer: "propuestas",
  oficial: "canales",
};

export function resolveCommunityHubArea(
  raw: string | null | undefined,
): CommunityHubAreaId | null {
  if (!raw) return null;
  if ((COMMUNITY_HUB_AREA_IDS as readonly string[]).includes(raw)) {
    return raw as CommunityHubAreaId;
  }
  return LEGACY_TAB_MAP[raw] ?? null;
}

export function isCommunityHubAreaId(
  value: string,
): value is CommunityHubAreaId {
  return (COMMUNITY_HUB_AREA_IDS as readonly string[]).includes(value);
}

/** Projector leaf shape — mirrors ProjectedNavLeaf without importing projector. */
export type CommunityHubNavLeaf = {
  id: string;
  label: string;
  icon: CommunityHubAreaIcon;
  href: string;
};

export function listCommunityHubNavLeaves(
  configuration: TenantConfiguration,
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean,
): CommunityHubNavLeaf[] {
  const areas = listVisibleCommunityHubAreas({
    isModuleEnabled: (moduleId) =>
      isTenantModuleEnabled(configuration, moduleId),
    isFeatureEnabled,
  });
  return areas.map((area) => ({
    id: `c-${area.id}`,
    label: area.label,
    icon: area.icon,
    href: communityHubHref(area.id),
  }));
}

/** Actualidad — territory updates, not discussions or proposals. */
export function listActualidadContent(): CommunityContent[] {
  return listPublishedCommunityContent().filter(
    (c) => c.type !== "discussion" && c.type !== "proposal",
  );
}

/** Conversaciones — community discussions shortcut (not Communication Core). */
export function listCommunityDiscussionContent(): CommunityContent[] {
  return listPublishedCommunityContent().filter((c) => c.type === "discussion");
}

/** Propuestas — decision items. */
export function listPropuestaContent(): CommunityContent[] {
  return listPublishedCommunityContent().filter((c) => c.type === "proposal");
}

/**
 * Participación — participation surface (not an alias of Propuestas).
 * Reuses proposal data with participation framing; no invented backend.
 */
export function listParticipacionContent(): CommunityContent[] {
  return listPropuestaContent().filter(
    (c) => c.decisionStatus === "open" || c.decisionStatus === "closing_soon",
  );
}

/** Espacios comunitarios — shared places (resources), not channels. */
export function listEspaciosComunitarios(): CommunityResource[] {
  return listResources().filter(
    (r) => r.type === "space" || r.type === "amenity",
  );
}

export type MascotasHubItem =
  | { kind: "place"; place: LocalPlace }
  | { kind: "work"; post: WorkPostListing }
  | { kind: "group"; group: CommunityGroup };

const PET_KEYWORDS = ["mascota", "perro", "gato", "pet", "dog", "cat"];

function matchesPetText(...parts: Array<string | undefined>): boolean {
  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  return PET_KEYWORDS.some((k) => hay.includes(k));
}

/**
 * Mascotas — Community entry surface from existing catalogs.
 * No new domain; no chat.
 */
export function listMascotasHubItems(): MascotasHubItem[] {
  const items: MascotasHubItem[] = [];

  for (const place of listLocalPlaces()) {
    if (
      place.categoryLabel?.toLowerCase() === "mascotas" ||
      matchesPetText(place.name, place.story, place.categoryLabel)
    ) {
      items.push({ kind: "place", place });
    }
  }

  for (const post of listWorkPosts({ includeSessionCreated: false })) {
    if (matchesPetText(post.title, post.description, post.categoryLabel)) {
      items.push({ kind: "work", post });
    }
  }

  for (const group of listGroups()) {
    if (matchesPetText(group.name, group.description, group.categoryLabel)) {
      items.push({ kind: "group", group });
    }
  }

  return items;
}
