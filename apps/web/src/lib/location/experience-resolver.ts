/**
 * Location Experience Resolver — category/type → product experience.
 *
 * Bridge: Location (SoT) → representation for map, cards, and future visuals.
 * No GIS, no tenant hardcoding, no 3D assets yet — only experience vocabulary.
 */

import type {
  LifeMapActionKind,
  Location,
  LocationType,
} from "@life-community-os/types";

import { locationCategoryLabel } from "./category-labels";
import { demoPlaceProfileFor } from "./demo-place-profile";

/**
 * Stable experience vocabulary for any tenant Location.
 * Future visual resolver keys off `experienceType` (not raw category strings).
 */
export type LocationExperienceType =
  | "restaurant"
  | "cafe"
  | "shop"
  | "professional_service"
  | "community_facility"
  | "sports_facility"
  | "community_event"
  | "community_place";

export type LocationExperienceRepresentation = {
  experienceType: LocationExperienceType;
  /** Human category label for chips / cards. */
  categoryLabel: string;
  /** Short type hint (Negocio / Servicio / …). */
  typeHint: string;
  /** Product copy for context cards. */
  summary: string;
  /** Soft header tone for cards. */
  heroTone: string;
  /** Map / LifeMapObject action kinds. */
  availableActions: readonly LifeMapActionKind[];
  /**
   * Soft asset vocabulary key for today’s procedural map markers.
   * Future 3D resolver will prefer `experienceType` over this string.
   */
  representationKey: string;
  /**
   * Reserved for a future visual / 3D resolver.
   * Do not load assets from this field yet.
   */
  futureVisualKey: string;
};

const TYPE_HINT: Record<LocationType, string> = {
  business: "Negocio",
  service: "Servicio",
  facility: "Instalación",
  event: "Evento",
  "community-place": "Lugar comunitario",
};

function experienceTypeFor(
  category: string,
  type: LocationType,
): LocationExperienceType {
  const key = category.trim().toLowerCase();

  if (key.includes("restaurant") || key.includes("lounge")) return "restaurant";
  if (key.includes("cafe")) return "cafe";
  if (key.includes("shop") || key.includes("market") || key.includes("bakery")) {
    return "shop";
  }
  if (
    key.includes("electrician") ||
    key.includes("veterinary") ||
    key.includes("vet") ||
    key.includes("service") ||
    key.includes("garden")
  ) {
    return "professional_service";
  }
  if (
    key.includes("sports") ||
    key.includes("padel") ||
    key.includes("golf") ||
    key.includes("pool") ||
    key.includes("piscina")
  ) {
    return "sports_facility";
  }
  if (key.includes("facility")) return "community_facility";

  switch (type) {
    case "service":
      return "professional_service";
    case "facility":
      return "community_facility";
    case "event":
      return "community_event";
    case "community-place":
      return "community_place";
    case "business":
    default:
      return "restaurant";
  }
}

function representationKeyFor(
  category: string,
  experienceType: LocationExperienceType,
): string {
  const key = category.trim().toLowerCase();
  if (key.includes("pool") || key.includes("piscina")) {
    return "recreation.pool.spatial_object";
  }
  if (key.includes("golf")) return "recreation.golf.spatial_object";
  if (key.includes("padel") || key.includes("sports")) {
    return "recreation.padel.spatial_object";
  }
  if (key.includes("electrician") || key.includes("service")) {
    return "place.service.spatial_object";
  }
  if (key.includes("restaurant") || key.includes("lounge")) {
    return "place.restaurant.spatial_object";
  }
  return profileFor(experienceType).representationKey;
}

/** Semantic card asset key for UI surfaces (Discover, Home, Life Place). */
export function cardAssetKeyForExperienceType(
  experienceType: LocationExperienceType,
  category = "",
): string {
  const key = category.trim().toLowerCase();
  if (key.includes("golf")) return "sports.golf.card";
  if (key.includes("football") || key.includes("fútbol") || key.includes("futbol")) {
    return "sports.football.card";
  }
  switch (experienceType) {
    case "restaurant":
    case "cafe":
      return "experiences.eat.card";
    case "shop":
      return "community.marketplace.card";
    case "professional_service":
      return "services.maintenance.card";
    case "sports_facility":
      return "sports.sports.card";
    case "community_facility":
      return "services.spaces-reservations.card";
    case "community_event":
      return "community.recommendations.card";
    case "community_place":
    default:
      return "navigation.discover.card";
  }
}

export function cardAssetKeyForCategory(
  category: string,
  type: LocationType,
): string {
  return cardAssetKeyForExperienceType(
    experienceTypeFor(category, type),
    category,
  );
}

function profileFor(
  experienceType: LocationExperienceType,
): Pick<
  LocationExperienceRepresentation,
  "summary" | "heroTone" | "representationKey" | "futureVisualKey"
> {
  switch (experienceType) {
    case "restaurant":
      return {
        summary:
          "Negocio gastronómico de la comunidad. Abre la ficha o cómo llegar.",
        heroTone: "#c47848",
        representationKey: "place.restaurant.spatial_object",
        futureVisualKey: "experience.restaurant.visual",
      };
    case "cafe":
      return {
        summary: "Café o lounge social. Ideal para encontrarte con vecinos.",
        heroTone: "#d4a060",
        representationKey: "place.clubhouse.spatial_object",
        futureVisualKey: "experience.cafe.visual",
      };
    case "shop":
      return {
        summary: "Comercio local. Consulta la ficha para más detalles.",
        heroTone: "#c45c5c",
        representationKey: "place.shop.spatial_object",
        futureVisualKey: "experience.shop.visual",
      };
    case "professional_service":
      return {
        summary:
          "Servicio profesional local. Contacta o consulta cómo llegar.",
        heroTone: "#c89040",
        representationKey: "place.service.spatial_object",
        futureVisualKey: "experience.professional_service.visual",
      };
    case "sports_facility":
      return {
        summary:
          "Instalación deportiva de la comunidad. Abre la ficha para más info.",
        heroTone: "#3aaa60",
        representationKey: "recreation.padel.spatial_object",
        futureVisualKey: "experience.sports_facility.visual",
      };
    case "community_facility":
      return {
        summary: "Instalación comunitaria. Explora la ficha y cómo llegar.",
        heroTone: "#5a9a70",
        representationKey: "recreation.pool.spatial_object",
        futureVisualKey: "experience.community_facility.visual",
      };
    case "community_event":
      return {
        summary: "Evento o encuentro en la comunidad.",
        heroTone: "#c070d0",
        representationKey: "community.gathering.spatial_object",
        futureVisualKey: "experience.community_event.visual",
      };
    case "community_place":
    default:
      return {
        summary: "Lugar de la comunidad. Abre la ficha o cómo llegar.",
        heroTone: "#5a9aaa",
        representationKey: "place.restaurant.spatial_object",
        futureVisualKey: "experience.community_place.visual",
      };
  }
}

function actionsFor(location: Location): readonly LifeMapActionKind[] {
  const actions: LifeMapActionKind[] = ["open", "navigate"];
  if (location.type === "facility") {
    actions.push("reserve");
  }
  if (location.contact?.trim()) {
    actions.push("message");
  }
  return actions;
}

/**
 * Resolve how a Location should appear and behave in product surfaces.
 */
export function resolveLocationExperience(
  location: Location,
): LocationExperienceRepresentation {
  const experienceType = experienceTypeFor(location.category, location.type);
  const profile = profileFor(experienceType);
  const demo = demoPlaceProfileFor({
    id: location.id,
    name: location.name,
  });
  return {
    experienceType,
    categoryLabel: locationCategoryLabel(location.category),
    typeHint: TYPE_HINT[location.type] ?? "Lugar",
    summary: demo?.summary ?? profile.summary,
    heroTone: profile.heroTone,
    availableActions: actionsFor(location),
    representationKey: representationKeyFor(location.category, experienceType),
    futureVisualKey: profile.futureVisualKey,
  };
}

/**
 * Open a contact handle when present (tel / mailto / https).
 * Returns false when nothing actionable exists.
 */
export function openLocationContact(contact: string | undefined): boolean {
  const value = contact?.trim();
  if (!value) return false;

  let href = value;
  if (/^https?:\/\//i.test(value)) {
    href = value;
  } else if (value.includes("@") && !value.includes(" ")) {
    href = `mailto:${value}`;
  } else if (/^[\d\s+().-]{6,}$/.test(value)) {
    href = `tel:${value.replace(/[^\d+]/g, "")}`;
  } else if (/^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(value)) {
    href = `https://${value}`;
  } else {
    return false;
  }

  window.open(href, "_blank", "noopener,noreferrer");
  return true;
}
