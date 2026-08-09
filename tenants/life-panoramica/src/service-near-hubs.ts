/**
 * Servicios vs Cerca de ti — reusable hub config (Phase B.4).
 * Servicios = "I need something solved."
 * Cerca de ti = "What exists around me?"
 * No directory product; filters existing LocalEntity / Marketplace / Recommendations.
 */

import type {
  LocalEntity,
  LocalEntityKind,
  LocalRecommendation,
  WorkPostType,
} from "@life-community-os/types";

import type { TenantFeatureFlags } from "./features";
import {
  listLocalEntities,
  listNeighbourRecommendations,
} from "./local-places";
import {
  listMarketplaceListings,
  type MarketplaceListing,
} from "./marketplace";
import { listWorkPosts, type WorkPostListing } from "./work-posts";

export type ServicesCategorySlug =
  | "professionals"
  | "work"
  | "neighbour-help"
  | "mobility"
  | "recommendations";

export type NearCategorySlug =
  | "restaurants"
  | "businesses"
  | "services"
  | "places";

export type ServicesCategoryHub = {
  slug: ServicesCategorySlug;
  label: string;
  /** Product question this hub answers. */
  problem: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Feature flags — any true shows the nav leaf. */
  featureKeys: (keyof TenantFeatureFlags)[];
  content:
    | { kind: "local-entities"; entityKinds: LocalEntityKind[] }
    | { kind: "work" }
    | { kind: "neighbour-help" }
    | { kind: "mobility" }
    | { kind: "recommendations" };
};

export type NearCategoryHub = {
  slug: NearCategorySlug;
  label: string;
  problem: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  entityKinds: LocalEntityKind[];
};

export const servicesCategoryHubs: ServicesCategoryHub[] = [
  {
    slug: "professionals",
    label: "Profesionales",
    problem: "Necesito a alguien cualificado.",
    description:
      "Jardinería, mantenimiento, limpieza, reparaciones, clases y servicios del hogar de confianza.",
    emptyTitle: "No hay profesionales publicados todavía.",
    emptyDescription: "Cuando un vecino o proveedor publique su perfil, lo verás aquí.",
    featureKeys: ["services", "localLife"],
    content: { kind: "local-entities", entityKinds: ["service"] },
  },
  {
    slug: "work",
    label: "Trabajo",
    problem: "Busco trabajo u ofrezco un trabajo cerca de casa.",
    description:
      "Anuncios entre vecinos: trabajo puntual, mantenimiento, clases y colaboración local.",
    emptyTitle: "No hay anuncios de trabajo todavía.",
    emptyDescription:
      "Cuando alguien publique que busca u ofrece trabajo, aparecerá aquí.",
    featureKeys: ["work", "services"],
    content: { kind: "work" },
  },
  {
    slug: "neighbour-help",
    label: "Ayuda entre vecinos",
    problem: "Necesito una mano de vez en cuando.",
    description: "Préstamos, pequeñas ayudas y colaboración entre vecinos — sin feed social.",
    emptyTitle: "No hay pedidos de ayuda todavía.",
    emptyDescription: "Cuando alguien pida o ofrezca una mano, aparecerá aquí.",
    featureKeys: ["services", "marketplace"],
    content: { kind: "neighbour-help" },
  },
  {
    slug: "mobility",
    label: "Movilidad",
    problem: "Necesito ayuda para desplazarme.",
    description: "Viajes compartidos y movilidad local entre vecinos.",
    emptyTitle: "No hay opciones de movilidad publicadas todavía.",
    emptyDescription: "Cuando haya trayectos compartidos o movilidad local, los verás aquí.",
    featureKeys: ["mobility"],
    content: { kind: "mobility" },
  },
  {
    slug: "recommendations",
    label: "Recomendaciones",
    problem: "Quiero recomendaciones de confianza.",
    description: "Consejos de vecinos sobre servicios y sitios de confianza.",
    emptyTitle: "No hay recomendaciones todavía.",
    emptyDescription: "Cuando un vecino recomiende algo, aparecerá aquí.",
    featureKeys: ["recommendations"],
    content: { kind: "recommendations" },
  },
];

export const nearCategoryHubs: NearCategoryHub[] = [
  {
    slug: "restaurants",
    label: "Restaurantes",
    problem: "¿Dónde comer cerca?",
    description: "Restaurantes y cafés cerca de ti.",
    emptyTitle: "No hay restaurantes publicados todavía.",
    emptyDescription: "Cuando haya sitios para comer cerca, los verás aquí.",
    entityKinds: ["restaurant", "cafe"],
  },
  {
    slug: "businesses",
    label: "Comercios",
    problem: "¿Qué comercios hay cerca?",
    description: "Tiendas y negocios del barrio.",
    emptyTitle: "No hay comercios publicados todavía.",
    emptyDescription: "Cuando haya tiendas cercanas, las verás aquí.",
    entityKinds: ["shop"],
  },
  {
    slug: "services",
    label: "Servicios",
    problem: "¿Qué servicios útiles hay alrededor?",
    description: "Servicios locales que puedes encontrar cerca de casa.",
    emptyTitle: "No hay servicios cercanos publicados todavía.",
    emptyDescription: "Cuando haya servicios locales visibles, los verás aquí.",
    entityKinds: ["service"],
  },
  {
    slug: "places",
    label: "Lugares",
    problem: "¿Qué lugares merece la pena conocer?",
    description: "Puntos de interés, naturaleza e instalaciones cercanas.",
    emptyTitle: "No hay lugares publicados todavía.",
    emptyDescription: "Cuando haya lugares destacados, los verás aquí.",
    entityKinds: ["place"],
  },
];

export function getServicesCategoryBySlug(
  slug: string,
): ServicesCategoryHub | undefined {
  return servicesCategoryHubs.find((h) => h.slug === slug);
}

export function getNearCategoryBySlug(
  slug: string,
): NearCategoryHub | undefined {
  return nearCategoryHubs.find((h) => h.slug === slug);
}

export function listLocalEntitiesForKinds(
  kinds: readonly LocalEntityKind[],
  query?: string,
): LocalEntity[] {
  const set = new Set(kinds);
  const q = query?.trim().toLowerCase() ?? "";
  return listLocalEntities().filter((e) => {
    if (!set.has(e.kind)) return false;
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.categoryLabel.toLowerCase().includes(q) ||
      e.areaLabel.toLowerCase().includes(q) ||
      e.story.toLowerCase().includes(q)
    );
  });
}

/** Occasional neighbour help — marketplace give/request only (not a feed). */
export function listNeighbourHelpListings(
  query?: string,
): MarketplaceListing[] {
  const q = query?.trim().toLowerCase() ?? "";
  return listMarketplaceListings()
    .filter((i) => i.kind === "give" || i.kind === "request")
    .filter((i) => {
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.areaLabel.toLowerCase().includes(q)
      );
    });
}

/** Mobility surface — keyword filter on existing listings until a dedicated catalog exists. */
export function listMobilityListings(query?: string): MarketplaceListing[] {
  const mobilityHints = [
    "viaje",
    "coche",
    "trayecto",
    "movilidad",
    "transporte",
    "compart",
    "aeropuerto",
    "estación",
  ];
  const q = query?.trim().toLowerCase() ?? "";
  return listMarketplaceListings().filter((i) => {
    const hay = `${i.title} ${i.description}`.toLowerCase();
    const isMobility = mobilityHints.some((h) => hay.includes(h));
    if (!isMobility) return false;
    if (!q) return true;
    return hay.includes(q) || i.areaLabel.toLowerCase().includes(q);
  });
}

export function listRecommendationsForHub(
  query?: string,
): LocalRecommendation[] {
  return listNeighbourRecommendations(query);
}

/** Community job board — separate from professionals, neighbour-help, marketplace. */
export function listWorkPostsForHub(options?: {
  type?: WorkPostType;
  query?: string;
  includeSessionCreated?: boolean;
}): WorkPostListing[] {
  return listWorkPosts(options);
}
