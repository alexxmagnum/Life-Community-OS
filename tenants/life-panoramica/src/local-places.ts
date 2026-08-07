/**
 * Local places & dining discovery — community knowledge (ADR-017 / ADR-032).
 */

export type LocalPlaceKind = "restaurant" | "leisure" | "service" | "spot";

export type LocalPlace = {
  id: string;
  name: string;
  kind: LocalPlaceKind;
  categoryLabel: string;
  areaLabel: string;
  blurb: string;
  imageUrl: string;
  verified?: boolean;
  recommendedBy?: string;
};

export const localPlaceCatalog: LocalPlace[] = [
  {
    id: "lp-terraza",
    name: "Terraza del Valle",
    kind: "restaurant",
    categoryLabel: "Restaurante",
    areaLabel: "Los pinos",
    blurb: "Cena informal con vistas. Ideal para planes espontáneos.",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    recommendedBy: "Clara",
  },
  {
    id: "lp-clubhouse",
    name: "Café del club",
    kind: "restaurant",
    categoryLabel: "Café",
    areaLabel: "Terraza",
    blurb: "Desayunos y reuniones tranquilas entre vecinos.",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    recommendedBy: "Marta",
  },
  {
    id: "lp-pool",
    name: "Piscina comunitaria",
    kind: "leisure",
    categoryLabel: "Ocio",
    areaLabel: "Life Panoramica",
    blurb: "Zona de baño y sombra — consulta el horario de verano.",
    imageUrl:
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "lp-garden",
    name: "Jardinería Panoramica",
    kind: "service",
    categoryLabel: "Servicio",
    areaLabel: "Life Panoramica",
    blurb: "Cuidado de exteriores verificado por vecinos.",
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
    verified: true,
    recommendedBy: "Inés",
  },
  {
    id: "lp-lock",
    name: "Cerrajero Costa",
    kind: "service",
    categoryLabel: "Servicio",
    areaLabel: "Zona norte",
    blurb: "Llaves el mismo día — muy recomendado.",
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
    verified: true,
    recommendedBy: "Elena",
  },
  {
    id: "lp-path",
    name: "Camino de pinos",
    kind: "spot",
    categoryLabel: "Lugar",
    areaLabel: "Los pinos",
    blurb: "Paseo al atardecer. Punto de encuentro habitual.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
];

export function listLocalPlaces(kind?: LocalPlaceKind): LocalPlace[] {
  if (!kind) return localPlaceCatalog;
  return localPlaceCatalog.filter((p) => p.kind === kind);
}

export function listRestaurants(): LocalPlace[] {
  return listLocalPlaces("restaurant");
}

export function listLeisurePlaces(): LocalPlace[] {
  return listLocalPlaces("leisure");
}

export function listLocalServices(): LocalPlace[] {
  return listLocalPlaces("service");
}
