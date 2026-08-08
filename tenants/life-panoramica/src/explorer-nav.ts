/**
 * Community Explorer — Activity Hub navigation config (Life Panoramica).
 * Presentation / IA only — not a domain model. Filters existing catalogs by keywords.
 */

import type { Channel } from "@life-community-os/types";

import { listChannels } from "./channels";
import {
  listDiscoverableExperiences,
  type Experience,
} from "./experiences";
import { listGroups, type CommunityGroup } from "./groups";
import { listResources, type CommunityResource } from "./resources";

export type ExplorerNavLeaf = {
  id: string;
  label: string;
  /** Maps to AppMenuLeafIcon in @life-community-os/ui */
  icon:
    | "golf"
    | "padel"
    | "tennis"
    | "hike"
    | "class"
    | "games"
    | "info"
    | "proposal"
    | "help"
    | "people"
    | "calendar"
    | "sport"
    | "place"
    | "cart"
    | "handshake"
    | "car"
    | "restaurant"
    | "shop"
    | "service"
    | "admin"
    | "city"
    | "public"
    | "security";
  href: string;
};

/** Tenant activity hub — reusable via /activities/[slug]. */
export type ExplorerActivityHub = {
  slug: string;
  label: string;
  icon: ExplorerNavLeaf["icon"];
  description: string;
  imageUrl: string;
  /** Keywords to relate existing Experience / Resource / Group / Channel rows */
  matchKeywords: string[];
  /** Optional explicit channel ids from the demo catalog */
  channelIds?: string[];
  /** Optional explicit group ids from the demo catalog */
  groupIds?: string[];
};

/**
 * Permanent activities — Golf first (identity of this community).
 * Order is tenant-specific. Not events, not reservations.
 */
export const explorerActivityHubs: ExplorerActivityHub[] = [
  {
    slug: "golf",
    label: "Golf",
    icon: "golf",
    description:
      "Una comunidad para jugadores y amantes del golf en Panorámica.",
    imageUrl:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1400&q=80",
    matchKeywords: ["golf"],
    channelIds: ["ch-golf"],
    groupIds: ["g-golf"],
  },
  {
    slug: "padel",
    label: "Pádel",
    icon: "padel",
    description:
      "Partidas, niveles mixtos y gente con la que jugar cerca de casa.",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80",
    matchKeywords: ["pádel", "padel"],
    channelIds: ["ch-padel"],
    groupIds: ["g-padel"],
  },
  {
    slug: "tennis",
    label: "Tenis",
    icon: "tennis",
    description:
      "Comunidad permanente de tenis: partidos, práctica y pistas.",
    imageUrl:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80",
    matchKeywords: ["tenis", "tennis"],
  },
  {
    slug: "nature",
    label: "Naturaleza",
    icon: "hike",
    description:
      "Paseos, rutas y aire libre con vecinos que viven Panorámica al exterior.",
    imageUrl:
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1400&q=80",
    matchKeywords: [
      "paseo",
      "sender",
      "pinos",
      "naturaleza",
      "camin",
      "walk",
      "outdoor",
    ],
    groupIds: ["g-walk"],
  },
  {
    slug: "wellness",
    label: "Bienestar",
    icon: "class",
    description:
      "Yoga, movimiento suave y hábitos saludables en comunidad.",
    imageUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=80",
    matchKeywords: ["yoga", "bienestar", "estir", "wellness", "medit"],
  },
  {
    slug: "workshops",
    label: "Clases y talleres",
    icon: "class",
    description:
      "Aprende y comparte: idiomas, arte, cocina, tecnología y más.",
    imageUrl:
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1400&q=80",
    matchKeywords: [
      "taller",
      "clase",
      "workshop",
      "fotografía",
      "cocina",
      "pintura",
      "idioma",
    ],
  },
  {
    slug: "social",
    label: "Ocio social",
    icon: "games",
    description:
      "Juegos, encuentros y vida social entre vecinos.",
    imageUrl:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80",
    matchKeywords: [
      "juego",
      "social",
      "café",
      "cafe",
      "bbq",
      "encuentro",
      "terraza",
      "board",
    ],
  },
];

/** Nav leaves for the hamburger — hrefs point at Activity Hubs. */
export const explorerActivityNav: ExplorerNavLeaf[] =
  explorerActivityHubs.map((hub) => ({
    id: `act-${hub.slug}`,
    label: hub.label,
    icon: hub.icon,
    href: `/activities/${hub.slug}`,
  }));

export function listExplorerActivities(): ExplorerNavLeaf[] {
  return explorerActivityNav;
}

export function listExplorerActivityHubs(): ExplorerActivityHub[] {
  return explorerActivityHubs;
}

export function getExplorerActivityBySlug(
  slug: string,
): ExplorerActivityHub | undefined {
  return explorerActivityHubs.find((h) => h.slug === slug);
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const hay = text.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}

/**
 * Sport resources often include territory names like "Aldea Golf" in the title.
 * Prefer explicit sport tokens so padel/tennis courts never land on Golf.
 */
const SPORT_ACTIVITY_SLUGS = ["padel", "tennis", "golf"] as const;

function sportSlugFromResourceName(name: string): (typeof SPORT_ACTIVITY_SLUGS)[number] | null {
  const n = name.toLowerCase();
  // More specific sports first — "Padel Court Aldea Golf" → padel, not golf.
  if (n.includes("padel") || n.includes("pádel")) return "padel";
  if (n.includes("tennis") || n.includes("tenis")) return "tennis";
  if (n.includes("golf")) return "golf";
  return null;
}

export function listChannelsForActivity(slug: string): Channel[] {
  const hub = getExplorerActivityBySlug(slug);
  if (!hub) return [];
  const channels = listChannels();
  const byId = new Set(hub.channelIds ?? []);
  return channels.filter(
    (c) =>
      byId.has(c.id) ||
      matchesKeywords(`${c.name} ${c.slug} ${c.description ?? ""}`, hub.matchKeywords),
  );
}

export function listGroupsForActivity(slug: string): CommunityGroup[] {
  const hub = getExplorerActivityBySlug(slug);
  if (!hub) return [];
  const groups = listGroups();
  const byId = new Set(hub.groupIds ?? []);
  return groups.filter(
    (g) =>
      byId.has(g.id) ||
      matchesKeywords(
        `${g.name} ${g.description} ${g.categoryLabel}`,
        hub.matchKeywords,
      ),
  );
}

export function listExperiencesForActivity(
  slug: string,
  options?: { includeSessionCreated?: boolean },
): Experience[] {
  const hub = getExplorerActivityBySlug(slug);
  if (!hub) return [];
  const channelIds = new Set(listChannelsForActivity(slug).map((c) => c.id));
  const groupIds = new Set(listGroupsForActivity(slug).map((g) => g.id));
  return listDiscoverableExperiences(options).filter((e) => {
    if (e.channelId && channelIds.has(e.channelId)) return true;
    if (e.groupId && groupIds.has(e.groupId)) return true;
    return matchesKeywords(
      `${e.title} ${e.description} ${e.location}`,
      hub.matchKeywords,
    );
  });
}

export function listResourcesForActivity(slug: string): CommunityResource[] {
  const hub = getExplorerActivityBySlug(slug);
  if (!hub) return [];

  return listResources().filter((r) => {
    const sport = sportSlugFromResourceName(r.name);
    if (sport) {
      // Sport courts/facilities belong only to that activity hub.
      return sport === slug;
    }

    // Non-sport resources: match activity keywords on name only
    // (never location/area — territory names like "Aldea Golf" leak across hubs).
    if ((SPORT_ACTIVITY_SLUGS as readonly string[]).includes(slug)) {
      return false;
    }
    return matchesKeywords(r.name, hub.matchKeywords);
  });
}
