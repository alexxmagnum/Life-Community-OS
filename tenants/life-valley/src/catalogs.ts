/**
 * Life Valley catalog seeds — tenant-owned, not copied from Panorámica.
 */

const IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80";

export const lifeValleyCommunityCatalog = [
  {
    id: "lv-cc-welcome",
    type: "official_announcement",
    status: "published",
    title: "Bienvenida a Life Valley",
    body: "Bienvenido a Life Valley. Aquí empiezas a descubrir tu comunidad.",
    areaLabel: "Centro Valle",
    authorName: "Life Valley",
    author: {
      id: "lv-author-official",
      name: "Life Valley",
      kind: "official",
    },
    publishedAt: new Date().toISOString(),
    reactionCounts: {},
    comments: [],
    commentCount: 0,
    imageUrl: IMAGE,
  },
];

export const lifeValleyExperienceCatalog = [
  {
    id: "lv-exp-walk",
    title: "Paseo del valle",
    description: "Camina con vecinos por el sendero al atardecer.",
    imageUrl: IMAGE,
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    location: "Plaza Life Valley",
    areaLabel: "Centro Valle",
    organizer: {
      id: "lv-org-valley",
      name: "Life Valley",
      kind: "official",
    },
    capacity: 24,
    participantCount: 3,
    participants: [],
    status: "published",
    type: "experience",
  },
];

export const lifeValleyMarketplaceCatalog = [
  {
    id: "lv-mp-bike",
    kind: "give",
    title: "Bicicleta Valley",
    description: "Bici en buen estado para alguien de la comunidad.",
    areaLabel: "Centro Valle",
    authorName: "Vecino Valley",
    imageUrl: IMAGE,
    publishedAt: new Date().toISOString(),
  },
];

export const lifeValleyResourceCatalog = [
  {
    id: "lv-res-room",
    name: "Sala Valley",
    description: "Sala comunitaria para reuniones y talleres.",
    imageUrl: IMAGE,
    location: "Centro comunitario",
    areaLabel: "Centro Valle",
    type: "space",
    status: "available",
    capacity: 12,
  },
];

export function lifeValleyCatalogSeed(
  domain: "community" | "experiences" | "marketplace" | "resources",
): unknown[] {
  switch (domain) {
    case "community":
      return [...lifeValleyCommunityCatalog];
    case "experiences":
      return [...lifeValleyExperienceCatalog];
    case "marketplace":
      return [...lifeValleyMarketplaceCatalog];
    case "resources":
      return [...lifeValleyResourceCatalog];
  }
}

export const lifeValleyLocationSeeds = [
  {
    id: "loc-catalog-lv-plaza-life-valley",
    name: "Plaza Life Valley",
    category: "place",
    type: "community-place" as const,
    summary: "Plaza y punto de encuentro de Life Valley.",
    areaLabel: "Centro Valle",
    latitude: 39.4825,
    longitude: -0.378,
    address: "Centro Valle, Life Valley",
    hours: "Acceso libre · eventos anunciados",
    contact: "hola@lifevalley.community",
    imageUrl: IMAGE,
  },
  {
    id: "loc-catalog-lv-cafe-life-valley",
    name: "Café del Valle",
    category: "cafe",
    type: "business" as const,
    summary: "Café acogedor en el centro de Life Valley.",
    areaLabel: "Centro Valle",
    latitude: 39.4832,
    longitude: -0.3785,
    address: "Centro Valle, Life Valley",
    hours: "Lun–Dom · 08:00–20:00",
    contact: "+34 960 000 200",
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
  },
];
