/**
 * Life Panoramica demo catalog for Local Entity / Local Discovery.
 * Implements platform types from @life-community-os/types (ADR-017 / ADR-032).
 * Tenant configuration + demo content only — no Panoramica-only platform forks.
 */

import type {
  LocalEntity,
  LocalEntityKind,
  LocalRecommendation,
} from "@life-community-os/types";
import {
  filterLocalRecommendations,
  listEntitiesNearYou,
  listTrustedHelpEntities,
} from "@life-community-os/types";

/** @deprecated Prefer LocalEntityKind from @life-community-os/types */
export type LocalPlaceKind = LocalEntityKind;

/** Tenant alias kept for existing screens — same as LocalEntity. */
export type LocalPlace = LocalEntity & {
  /** Legacy field — mirrors story for older call sites. */
  blurb: string;
};

function asPlace(entity: LocalEntity): LocalPlace {
  return { ...entity, blurb: entity.story };
}

export const localEntityCatalog: LocalEntity[] = [
  {
    id: "lp-terraza",
    name: "Terraza del Valle",
    kind: "restaurant",
    categoryLabel: "Restaurante",
    areaLabel: "Los pinos",
    story: "Cena informal con vistas. Ideal para planes espontáneos entre vecinos.",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    recommendedBy: "Clara",
    trustNote: "Mesa exterior recomendada al atardecer",
  },
  {
    id: "lp-clubhouse",
    name: "Café del club",
    kind: "cafe",
    categoryLabel: "Café",
    areaLabel: "Centro",
    story: "Desayunos y reuniones tranquilas. Wifi bueno para trabajar un rato.",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    recommendedBy: "Marta",
  },
  {
    id: "lp-pan",
    name: "Horno Los Pinos",
    kind: "shop",
    categoryLabel: "Panadería",
    areaLabel: "Los pinos",
    story: "Pan del día y bollería. Punto de encuentro matinal del barrio.",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    recommendedBy: "Luis",
  },
  {
    id: "lp-market",
    name: "Mercado de la plaza",
    kind: "shop",
    categoryLabel: "Tienda",
    areaLabel: "Centro",
    story: "Fruta, queso y lo esencial sin salir de la comunidad.",
    imageUrl:
      "https://images.unsplash.com/photo-1488459716781-31db5254d4a0?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "lp-path",
    name: "Camino de pinos",
    kind: "place",
    categoryLabel: "Paseo",
    areaLabel: "Los pinos",
    story: "Paseo al atardecer. Punto de encuentro habitual para caminar.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    recommendedBy: "Ana",
  },
  {
    id: "lp-pool",
    name: "Piscina comunitaria",
    kind: "place",
    categoryLabel: "Ocio",
    areaLabel: "Life Panoramica",
    story: "Zona de baño y sombra — consulta el horario de verano.",
    imageUrl:
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "lp-mirador",
    name: "Mirador del valle",
    kind: "place",
    categoryLabel: "Lugar",
    areaLabel: "Zona norte",
    story: "Vistas abiertas. Ideal para fotos o un descanso corto.",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "lp-garden",
    name: "Jardinería Panoramica",
    kind: "service",
    categoryLabel: "Jardinería",
    areaLabel: "Life Panoramica",
    story: "Cuidado de exteriores. Varios vecinos ya los han usado.",
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
    verified: true,
    recommendedBy: "Inés",
    trustNote: "Perfil verificado en el directorio",
  },
  {
    id: "lp-lock",
    name: "Cerrajero Costa",
    kind: "service",
    categoryLabel: "Hogar",
    areaLabel: "Zona norte",
    story: "Llaves el mismo día. Rápido y cercano.",
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
    verified: true,
    recommendedBy: "Elena",
    trustNote: "Muy recomendado por vecinos",
  },
  {
    id: "lp-vet",
    name: "Clínica animal Valle",
    kind: "service",
    categoryLabel: "Mascotas",
    areaLabel: "Centro",
    story: "Urgencias y revisiones. Trato cercano con las mascotas del barrio.",
    imageUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    verified: true,
    recommendedBy: "Pedro",
  },
];

export const localRecommendationCatalog: LocalRecommendation[] = [
  {
    id: "rec-lock",
    body: "Las mejores llaves el mismo día — pregunta por Cerrajero Costa.",
    authorName: "Elena",
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
    relatedEntityId: "lp-lock",
    relatedLabel: "Cerrajero Costa",
  },
  {
    id: "rec-terraza",
    body: "Si quieres cena al aire libre sin reservar con semanas, Terraza del Valle casi siempre saca mesa.",
    authorName: "Clara",
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80",
    relatedEntityId: "lp-terraza",
    relatedLabel: "Terraza del Valle",
  },
  {
    id: "rec-path",
    body: "El Camino de pinos al atardecer es el secreto mejor guardado para desconectar.",
    authorName: "Ana",
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80",
    relatedEntityId: "lp-path",
    relatedLabel: "Camino de pinos",
  },
  {
    id: "rec-pan",
    body: "El pan de Horno Los Pinos a las 8:00 — merece la pena madrugar un poco.",
    authorName: "Luis",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    relatedEntityId: "lp-pan",
    relatedLabel: "Horno Los Pinos",
  },
];

/** @deprecated Prefer localEntityCatalog */
export const localPlaceCatalog: LocalPlace[] =
  localEntityCatalog.map(asPlace);

export function listLocalEntities(kind?: LocalEntityKind): LocalEntity[] {
  if (!kind) return [...localEntityCatalog];
  return localEntityCatalog.filter((p) => p.kind === kind);
}

export function listLocalPlaces(kind?: LocalEntityKind): LocalPlace[] {
  return listLocalEntities(kind).map(asPlace);
}

export function listRestaurants(): LocalPlace[] {
  return listLocalEntities()
    .filter((e) => e.kind === "restaurant" || e.kind === "cafe")
    .map(asPlace);
}

export function listLeisurePlaces(): LocalPlace[] {
  return listLocalEntities("place").map(asPlace);
}

export function listLocalServices(): LocalPlace[] {
  return listLocalEntities("service").map(asPlace);
}

/** Cerca de ti — restaurants, cafés, shops, places. */
export function listNearYou(query?: string): LocalEntity[] {
  return listEntitiesNearYou(localEntityCatalog, { query });
}

/** Ayuda de confianza — services and professionals. */
export function listTrustedHelp(query?: string): LocalEntity[] {
  return listTrustedHelpEntities(localEntityCatalog, { query });
}

/** Recomendado por vecinos. */
export function listNeighbourRecommendations(
  query?: string,
): LocalRecommendation[] {
  return filterLocalRecommendations(localRecommendationCatalog, { query });
}

/** Legacy shape used by older Home rails. */
export const recommendations = localRecommendationCatalog.map((r) => ({
  id: r.id,
  quote: r.body,
  author: r.authorName,
  imageUrl: r.imageUrl ?? "",
}));
