/**
 * Neighbour-to-neighbour exchange — community life layer (not commercial marketplace).
 * Tenant mock catalog + session creates. Ready for future API.
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

export type CreateMarketplaceListingInput = {
  kind: MarketplaceListingKind;
  title: string;
  description: string;
  priceLabel?: string;
  areaLabel?: string;
  authorName: string;
  authorPersonId?: string;
  authorAvatarUrl?: string;
  imageUrl?: string;
};

const CREATED_STORAGE_KEY =
  "lcos.life-panoramica.marketplace.created.v1";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80";

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
      "La dejamos gratis a una familia de la comunidad. Ruedines incluidos.",
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

function readCreatedListings(): MarketplaceListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CREATED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MarketplaceListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreatedListings(items: MarketplaceListing[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CREATED_STORAGE_KEY, JSON.stringify(items));
}

export function listMarketplaceListings(options?: {
  includeSessionCreated?: boolean;
}): MarketplaceListing[] {
  const includeSession =
    options?.includeSessionCreated ?? typeof window !== "undefined";
  const created = includeSession ? readCreatedListings() : [];
  const seen = new Set<string>();
  const merged: MarketplaceListing[] = [];
  for (const item of [...created, ...marketplaceCatalog]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getMarketplaceListingById(
  listingId: string,
  options?: { includeSessionCreated?: boolean },
): MarketplaceListing | undefined {
  const target = listingId.trim();
  if (!target) return undefined;
  return listMarketplaceListings(options).find((item) => item.id === target);
}

export function createMarketplaceListing(
  input: CreateMarketplaceListingInput,
): MarketplaceListing {
  const id = `mp-created-${Date.now().toString(36)}`;
  const listing: MarketplaceListing = {
    id,
    kind: input.kind,
    title: input.title.trim(),
    description: input.description.trim(),
    priceLabel: input.priceLabel?.trim() || undefined,
    areaLabel: input.areaLabel?.trim() || "Life Panoramica",
    authorName: input.authorName.trim() || "Vecino",
    authorPersonId: input.authorPersonId,
    authorAvatarUrl: input.authorAvatarUrl,
    imageUrl: input.imageUrl?.trim() || DEFAULT_IMAGE,
    publishedAt: new Date().toISOString(),
  };
  const existing = readCreatedListings();
  writeCreatedListings([listing, ...existing.filter((i) => i.id !== id)]);
  return listing;
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
