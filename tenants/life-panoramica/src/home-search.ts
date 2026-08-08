/**
 * Cross-capability Home search — demo index over tenant catalogs.
 * Platform UI stays tenant-agnostic; this pack supplies the hits.
 */

import { listPublishedCommunityContent } from "./community-content";
import { listDiscoverableExperiences } from "./experiences";
import { listNearYou } from "./local-places";
import { listMarketplaceListings } from "./marketplace";
import { listResources } from "./resources";

export type HomeSearchHit = {
  id: string;
  title: string;
  subtitle: string;
  kindLabel: string;
  href: string;
  imageUrl?: string;
};

function matches(query: string, ...parts: Array<string | undefined>) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return false;
  return parts.some((p) => (p ?? "").toLowerCase().includes(q));
}

export function searchHomeCatalog(query: string, limit = 8): HomeSearchHit[] {
  const hits: HomeSearchHit[] = [];

  for (const exp of listDiscoverableExperiences()) {
    if (
      matches(query, exp.title, exp.description, exp.location, exp.areaLabel)
    ) {
      hits.push({
        id: `exp-${exp.id}`,
        title: exp.title,
        subtitle: `${exp.location} · ${exp.areaLabel}`,
        kindLabel: "Plan",
        href: `/experiences/${exp.id}`,
        imageUrl: exp.imageUrl,
      });
    }
  }

  for (const resource of listResources()) {
    if (
      matches(
        query,
        resource.name,
        resource.description,
        resource.location,
        resource.areaLabel,
      )
    ) {
      hits.push({
        id: `res-${resource.id}`,
        title: resource.name,
        subtitle: resource.location,
        kindLabel: "Reservar",
        href: `/resources/${resource.id}`,
        imageUrl: resource.imageUrl,
      });
    }
  }

  for (const item of listMarketplaceListings()) {
    if (matches(query, item.title, item.description, item.areaLabel)) {
      hits.push({
        id: `mp-${item.id}`,
        title: item.title,
        subtitle: item.areaLabel,
        kindLabel: "Mercado",
        href: "/marketplace",
        imageUrl: item.imageUrl,
      });
    }
  }

  for (const place of listNearYou()) {
    if (
      matches(
        query,
        place.name,
        place.categoryLabel,
        place.areaLabel,
        place.story,
      )
    ) {
      hits.push({
        id: `place-${place.id}`,
        title: place.name,
        subtitle: `${place.categoryLabel} · ${place.areaLabel}`,
        kindLabel: "Cerca",
        href: "/discover",
        imageUrl: place.imageUrl,
      });
    }
  }

  for (const post of listPublishedCommunityContent().slice(0, 12)) {
    if (matches(query, post.title, post.body, post.areaLabel)) {
      hits.push({
        id: `post-${post.id}`,
        title: post.title,
        subtitle: post.areaLabel ?? "Comunidad",
        kindLabel: "Comunidad",
        href: `/community/content/${post.id}`,
        imageUrl: post.imageUrl,
      });
    }
  }

  return hits.slice(0, limit);
}
