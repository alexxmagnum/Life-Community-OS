/**
 * Community Hub IA — Phase D.0.7.1.1
 *
 * Canonical Community area model for Life Panoramica.
 * Single source of truth for:
 *   - Community Hub chips
 *   - Hamburger Comunidad leaves (Navigation Projector)
 *   - Module Registry deep-link targets
 *
 * Community is the place neighbours live the territory.
 * Communication remains a contextual capability — not this hub.
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
