/**
 * Ocean Hills content — original coastal community, not cloned from Panorámica.
 */

const IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80";

export const oceanHillsCommunityCatalog = [
  {
    id: "oh-cc-welcome",
    type: "official_announcement",
    status: "published",
    title: "Welcome to Ocean Hills",
    body: "A hillside community above the marina. Neighbours meet at the boardwalk, not a golf club.",
    areaLabel: "Marina District",
    authorName: "Ocean Hills",
    author: {
      id: "oh-author-official",
      name: "Ocean Hills",
      kind: "official",
    },
    publishedAt: new Date().toISOString(),
    reactionCounts: {},
    comments: [],
    commentCount: 0,
    imageUrl: IMAGE,
  },
];

export const oceanHillsExperienceCatalog = [
  {
    id: "oh-exp-boardwalk",
    title: "Sunrise boardwalk",
    description: "Walk the marina boardwalk with neighbours before the boats leave.",
    imageUrl: IMAGE,
    startsAt: new Date(Date.now() + 172800000).toISOString(),
    location: "Ocean Hills Marina",
    areaLabel: "Marina District",
    organizer: {
      id: "oh-org-hills",
      name: "Ocean Hills",
      kind: "official",
    },
    capacity: 18,
    participantCount: 5,
    participants: [],
    status: "published",
    type: "experience",
  },
];

export const oceanHillsMarketplaceCatalog: unknown[] = [];

export const oceanHillsResourceCatalog = [
  {
    id: "oh-res-boathouse",
    name: "Boathouse room",
    description: "Small hall over the marina for neighbour meetings.",
    imageUrl: IMAGE,
    location: "Ocean Hills Marina",
    areaLabel: "Marina District",
    type: "space",
    status: "available",
    capacity: 10,
  },
];

export function oceanHillsCatalogSeed(
  domain: "community" | "experiences" | "marketplace" | "resources",
): unknown[] {
  switch (domain) {
    case "community":
      return [...oceanHillsCommunityCatalog];
    case "experiences":
      return [...oceanHillsExperienceCatalog];
    case "marketplace":
      return [...oceanHillsMarketplaceCatalog];
    case "resources":
      return [...oceanHillsResourceCatalog];
  }
}

export const oceanHillsLocationSeeds = [
  {
    id: "loc-catalog-oh-marina-life-ocean-hills",
    name: "Ocean Hills Marina",
    category: "place",
    type: "community-place" as const,
    summary: "Working marina and neighbour meeting point.",
    areaLabel: "Marina District",
    latitude: 28.1234,
    longitude: -15.4312,
    address: "Marina District, Ocean Hills",
    hours: "Open waterfront",
    contact: "hello@oceanhills.community",
    imageUrl: IMAGE,
  },
  {
    id: "loc-catalog-oh-club-life-ocean-hills",
    name: "Hillside Beach Club",
    category: "hospitality",
    type: "business" as const,
    summary: "Neighbour beach club — not a golf house.",
    areaLabel: "Cliffside",
    latitude: 28.1261,
    longitude: -15.4288,
    address: "Cliffside, Ocean Hills",
    hours: "Tue–Sun · 10:00–20:00",
    contact: "+34 928 000 300",
    imageUrl:
      "https://images.unsplash.com/photo-1519046900104-136efde15e5d?auto=format&fit=crop&w=1200&q=80",
  },
];
