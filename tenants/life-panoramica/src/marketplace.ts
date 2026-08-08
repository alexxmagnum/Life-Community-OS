/**
 * Neighbour-to-neighbour exchange — community life layer (not commercial marketplace).
 * Tenant mock catalog; same shape for any tenant. Ready for future API.
 */

import {
  DEMO_PERSON_ANA,
  DEMO_PERSON_ELENA,
  DEMO_PERSON_JORDI,
  DEMO_PERSON_LUIS,
} from "./demo-ids";

export type MarketplaceListingKind =
  | "sell"
  | "buy"
  | "give"
  | "request";

export type MarketplaceListing = {
  id: string;
  kind: MarketplaceListingKind;
  title: string;
  description: string;
  priceLabel?: string;
  areaLabel: string;
  authorName: string;
  /** Person id when known — contribution join key (Phase C.4). */
  authorPersonId?: string;
  authorAvatarUrl?: string;
  imageUrl: string;
  publishedAt: string;
};

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const marketplaceCatalog: MarketplaceListing[] = [
  {
    id: "mp-sofa",
    kind: "sell",
    title: "Sofá de dos plazas",
    description:
      "Buen estado, tela beige. Ideal para terraza cubierta. Recogida en Zona norte.",
    priceLabel: "80 €",
    areaLabel: "Life Panoramica",
    authorName: "Elena",
    authorPersonId: DEMO_PERSON_ELENA,
    authorAvatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    imageUrl:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
    publishedAt: hoursAgo(6),
  },
  {
    id: "mp-bike",
    kind: "give",
    title: "Bicicleta infantil",
    description:
      "La dejamos gratis a una familia del territorio. Ruedines incluidos.",
    areaLabel: "Los pinos",
    authorName: "Jordi",
    authorPersonId: DEMO_PERSON_JORDI,
    authorAvatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    imageUrl:
      "https://images.unsplash.com/photo-1571333252817-cdf2701c5c6b?auto=format&fit=crop&w=900&q=80",
    publishedAt: hoursAgo(20),
  },
  {
    id: "mp-drill",
    kind: "request",
    title: "¿Alguien presta un taladro?",
    description:
      "Necesito colgar dos cuadros este finde. Devuelvo el mismo día.",
    areaLabel: "Centro",
    authorName: "Ana",
    authorPersonId: DEMO_PERSON_ANA,
    authorAvatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    imageUrl:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
    publishedAt: hoursAgo(3),
  },
  {
    id: "mp-table",
    kind: "buy",
    title: "Busco mesa de exterior",
    description: "Preferible madera o hierro. Presupuesto flexible.",
    areaLabel: "El pinar",
    authorName: "Luis",
    authorPersonId: DEMO_PERSON_LUIS,
    imageUrl:
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=900&q=80",
    publishedAt: hoursAgo(30),
  },
];

export function listMarketplaceListings(): MarketplaceListing[] {
  return [...marketplaceCatalog].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function marketplaceKindLabel(kind: MarketplaceListingKind): string {
  switch (kind) {
    case "sell":
      return "Vendo";
    case "buy":
      return "Busco";
    case "give":
      return "Regalo";
    case "request":
      return "Presto";
  }
}
