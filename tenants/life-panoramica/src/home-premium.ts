/**
 * Life Panoramica — Home presentation demo pack.
 *
 * Home shows signals the platform does not model yet (walking distance,
 * ratings, live venue state, relative neighbour activity). They live here as
 * tenant demo content instead of widening Core domain models.
 */

import type { Experience } from "./experiences";
import { listUpcomingHomeExperiences } from "./home-front-door";
import { localEntityCatalog } from "./local-places";

export type HomeMomentTone = "open" | "soon" | "calm";

export type HomeMomentPresentation = {
  /** Time-of-day badge tone over the photo. */
  tone: HomeMomentTone;
  /** Replaces the clock badge when the moment is not time-critical. */
  badgeLabel?: string;
  glyph: HomeGlyph;
  ctaLabel: string;
  /** Occupancy or venue note shown instead of the participant stack. */
  statusLabel?: string;
  /** Overrides the location line under the title. */
  whereLabel?: string;
};

export type HomeGlyph =
  | "coffee"
  | "trail"
  | "golf"
  | "heart"
  | "people"
  | "ball"
  | "camera"
  | "calendar"
  | "dining"
  | "compass";

const MOMENT_PRESENTATION: Record<string, HomeMomentPresentation> = {
  "exp-coffee": { tone: "open", glyph: "coffee", ctaLabel: "Unirme" },
  "exp-sunrise-pines": {
    tone: "soon",
    glyph: "trail",
    ctaLabel: "Ver plan",
    whereLabel: "Empieza en 45 min",
  },
  "exp-golf-afternoon": {
    tone: "calm",
    badgeLabel: "Buen momento",
    glyph: "golf",
    ctaLabel: "Ver",
    statusLabel: "Poca ocupación",
  },
};

/** Order Home opens with. Anything missing falls back to the live catalog. */
const MOMENT_ORDER = [
  "exp-coffee",
  "exp-sunrise-pines",
  "exp-golf-afternoon",
] as const;

export type HomeMomentCard = {
  experience: Experience;
  presentation: HomeMomentPresentation;
};

export function listHomeMomentCards(options?: {
  includeSessionExperiences?: boolean;
  stabilizeTime?: boolean;
  limit?: number;
}): HomeMomentCard[] {
  const catalog = listUpcomingHomeExperiences({
    limit: 12,
    includeSessionExperiences: options?.includeSessionExperiences ?? false,
    stabilizeTime: options?.stabilizeTime ?? true,
  });
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const curated = MOMENT_ORDER.map((id) => byId.get(id)).filter(
    (item): item is Experience => Boolean(item),
  );
  const rest = catalog.filter((item) => !MOMENT_ORDER.includes(item.id as never));
  const ordered = [...curated, ...rest].slice(0, options?.limit ?? 3);
  return ordered.map((experience) => ({
    experience,
    presentation:
      MOMENT_PRESENTATION[experience.id] ??
      ({ tone: "open", glyph: "people", ctaLabel: "Ver plan" } as const),
  }));
}

export type HomeMoveCardTone = "green" | "cyan" | "violet" | "default";

export type HomeMoveItem = {
  id: string;
  tone?: HomeMoveCardTone;
  glyph: HomeGlyph;
  /** Lead line. Neighbour name is emphasised by the card when present. */
  headline: string;
  personName?: string;
  personAvatarUrl?: string;
  /** Short verbatim from the neighbour. */
  quote?: string;
  meta: string;
  liked?: boolean;
  href: string;
};

/** What neighbours are doing right now — human activity, not a feed. */
export function listHomeMoves(): HomeMoveItem[] {
  return [
    {
      id: "move-recommendation",
      tone: "green",
      glyph: "heart",
      personName: "Ana",
      personAvatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      headline: "Ana recomienda el Camino de los Pinos",
      quote: "A esta hora está precioso.",
      meta: "Hace 18 min · Aldea Golf",
      liked: true,
      href: "/near/place/lp-path",
    },
    {
      id: "move-join",
      tone: "cyan",
      glyph: "people",
      headline: "12 vecinos se han unido al café de mañana",
      meta: "Hace 32 min",
      href: "/experiences/exp-coffee",
    },
    {
      id: "move-kids",
      tone: "default",
      glyph: "ball",
      headline: "Los niños vuelven a entrenar esta tarde",
      meta: "Escuela de fútbol · 18:30\nCampo municipal",
      href: "/community",
    },
    {
      id: "move-photos",
      tone: "violet",
      glyph: "camera",
      headline: "Marta compartió fotos del atardecer en el lago",
      meta: "Hace 45 min",
      href: "/community",
    },
  ];
}

export type HomeIntentTone = "plans" | "dining" | "golf" | "discover";

export type HomeIntentDoor = {
  id: string;
  title: string;
  subtitle: string;
  tone: HomeIntentTone;
  glyph: HomeGlyph;
  href: string;
  /** Premium 3D illustration — isolated transparent asset. */
  imageUrl?: string;
  /** Ambient background photo behind the 3D icon. */
  bgImageUrl?: string;
};

/** The four things a neighbour may feel like doing today. */
export function listHomeIntents(): HomeIntentDoor[] {
  return [
    {
      id: "plans",
      title: "Planes",
      subtitle: "Eventos y encuentros",
      tone: "plans",
      glyph: "calendar",
      href: "/experiences",
      imageUrl: "/tenants/life-panoramica/intents/plans.png?v=premium-ref11",
      bgImageUrl: undefined,
    },
    {
      id: "dining",
      title: "Comer",
      subtitle: "Restaurantes y terrazas",
      tone: "dining",
      glyph: "dining",
      href: "/near/restaurants",
      imageUrl: "/tenants/life-panoramica/intents/dining.png?v=premium-ref13",
      bgImageUrl: "/tenants/life-panoramica/intents/metal-dining.png",
    },
    {
      id: "golf",
      title: "Golf",
      subtitle: "Tu club, reservas y más",
      tone: "golf",
      glyph: "golf",
      href: "/activities/golf",
      imageUrl: "/tenants/life-panoramica/intents/golf.png?v=premium-ref11",
      bgImageUrl: undefined,
    },
    {
      id: "discover",
      title: "Descubrir",
      subtitle: "Lugares y rutas cerca de ti",
      tone: "discover",
      glyph: "compass",
      href: "/discover",
      imageUrl: "/tenants/life-panoramica/intents/discover.png?v=premium-ref11",
      bgImageUrl: undefined,
    },
  ];
}

export type HomeNearbyPlace = {
  id: string;
  name: string;
  imageUrl: string;
  /** Walking distance or live agenda line. */
  distanceLabel: string;
  /** Venue state shown next to the rating. */
  statusLabel?: string;
  ratingLabel?: string;
  ratingCountLabel?: string;
  badgeLabel?: string;
  href: string;
};

type NearbyPresentation = Omit<HomeNearbyPlace, "id" | "name" | "imageUrl" | "href">;

const NEARBY_PRESENTATION: Array<{ id: string } & NearbyPresentation> = [
  {
    id: "lp-pan",
    distanceLabel: "A 4 min caminando",
    ratingLabel: "4,8",
    ratingCountLabel: "23 vecinos",
    badgeLabel: "Recomendado",
  },
  {
    id: "lp-path",
    distanceLabel: "A 6 min",
    statusLabel: "Perfecto ahora",
    ratingLabel: "4,9",
  },
  {
    id: "lp-ikon",
    distanceLabel: "Hoy · evento a las 19:30",
    statusLabel: "Terraza · Música en vivo",
    ratingLabel: "4,7",
  },
  {
    id: "lp-golf-club",
    distanceLabel: "A 7 min",
    statusLabel: "Green fee disponible",
  },
];

/** Places the community points at, with the demo signals Home displays. */
export function listHomeNearbyPlaces(): HomeNearbyPlace[] {
  const byId = new Map(localEntityCatalog.map((entity) => [entity.id, entity]));
  return NEARBY_PRESENTATION.flatMap((entry) => {
    const entity = byId.get(entry.id);
    if (!entity) return [];
    const { id, ...presentation } = entry;
    return [
      {
        id,
        name: entity.name,
        imageUrl: entity.imageUrl,
        href: `/near/place/${id}`,
        ...presentation,
      },
    ];
  });
}

/** Live context pill under the hero greeting. */
export function homeHappeningCount(momentCount: number, moveCount: number) {
  return momentCount + moveCount;
}

/** Qualitative sky reading for the hero, not a forecast. */
export function homeSkyMood(hour: number): { title: string; subtitle: string } {
  if (hour < 12) return { title: "Mañana perfecta", subtitle: "para salir" };
  if (hour < 20) return { title: "Tarde perfecta", subtitle: "para salir" };
  return { title: "Noche tranquila", subtitle: "para pasear" };
}

/**
 * Which hero photograph belongs to this Madrid hour.
 * 0 night 20–08 · 1 morning 08–12 · 2 afternoon 12–18 · 3 evening 18–20
 */
export function homeHeroIndexForHour(hour: number): number {
  if (hour >= 20 || hour < 8) return 0;
  if (hour < 12) return 1;
  if (hour < 18) return 2;
  return 3;
}

/** Ordered slide URLs for the Home hero carousel. */
export function listHomeHeroSlideUrls(imagery: {
  homeHero: string;
  homeHeroSlides?: ReadonlyArray<string>;
  homeHeroWindows?: {
    night: string;
    morning: string;
    afternoon: string;
    evening: string;
  };
}): string[] {
  if (imagery.homeHeroWindows) {
    const w = imagery.homeHeroWindows;
    return [w.night, w.morning, w.afternoon, w.evening];
  }
  if (imagery.homeHeroSlides && imagery.homeHeroSlides.length > 0) {
    return [...imagery.homeHeroSlides];
  }
  return [imagery.homeHero];
}

/** 3D header art for the Profesionales services page. */
export const PROFESSIONALS_HEADER_ART_URL =
  "/tenants/life-panoramica/glyphs/professionals.png?v=premium-pro2";
