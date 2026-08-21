/**
 * Life Panoramica — enrich Life Map context from domain catalogs.
 * Presentation only — Local Entity / Resource / Experience remain SoT.
 * Returns plain fields for the web host to merge into context cards.
 */

import type { LifeMapObject } from "@life-community-os/types";

import { listActiveCommunityAlerts } from "./community-alerts";
import { getExperienceById } from "./experiences";
import { getLocalEntityById } from "./local-places";
import { getOfficialEntityById } from "./official-entities";
import { getResourceById } from "./resources";
import { getLifePanoramicaTerritoryMeta } from "./life-map-territory-objects";

export type LifeMapContextEnrichment = {
  label?: string;
  summary?: string;
  experienceTag?: string;
  heroTone?: string;
  imageUrl?: string;
  categoryHint?: string;
};

const TONE_BY_KIND: Record<string, string> = {
  restaurant: "#c4a890",
  cafe: "#c8b8a4",
  shop: "#b8a890",
  place: "#a8c4c8",
  service: "#b0a088",
  golf: "#8faf7a",
  pool: "#7eb0c4",
  padel: "#7a9e8a",
  security: "#9a8a7a",
  experience: "#a89888",
  alert: "#c47868",
  housing: "#d0c4b0",
};

/**
 * Domain-backed context enrichment for context cards.
 * Returns null when no domain entity is resolvable.
 */
export function enrichLifePanoramicaLifeMapContext(
  object: LifeMapObject,
): LifeMapContextEnrichment | null {
  const ref = object.ref;
  if (!ref?.entityId) {
    if (String(object.layerId) === "territory" || object.type === "decoration") {
      const meta = getLifePanoramicaTerritoryMeta(object.objectId);
      return {
        label: object.label,
        summary: meta?.summary ?? "Espacio comunitario de la urbanización.",
        experienceTag: "Comunidad",
        heroTone: TONE_BY_KIND.golf,
        categoryHint: "Territorio",
      };
    }
    return null;
  }

  if (ref.moduleId === "community" && ref.entityKind === "local_entity") {
    const entity = getLocalEntityById(ref.entityId);
    if (!entity) return null;
    return {
      label: entity.name,
      summary: entity.story,
      experienceTag: entity.categoryLabel,
      heroTone: TONE_BY_KIND[entity.kind] ?? TONE_BY_KIND.place,
      imageUrl: entity.imageUrl,
      categoryHint: entity.categoryLabel,
    };
  }

  if (ref.moduleId === "resources" || ref.moduleId === "reservations") {
    const resource = getResourceById(ref.entityId);
    if (!resource) return null;
    return {
      label: resource.name,
      summary: resource.description,
      experienceTag: resource.areaLabel || "Instalación",
      heroTone: TONE_BY_KIND.padel,
      imageUrl: resource.imageUrl,
      categoryHint: resource.type,
    };
  }

  if (ref.moduleId === "experiences") {
    const exp = getExperienceById(ref.entityId);
    if (!exp) return null;
    return {
      label: exp.title,
      summary: exp.description,
      experienceTag: exp.type === "event" ? "Evento" : "Experiencia",
      heroTone: TONE_BY_KIND.experience,
      imageUrl: exp.imageUrl,
      categoryHint: exp.areaLabel,
    };
  }

  if (ref.moduleId === "official") {
    const official = getOfficialEntityById(ref.entityId);
    if (!official) return null;
    return {
      label: official.name,
      summary: official.description,
      experienceTag: "Seguridad",
      heroTone: TONE_BY_KIND.security,
      ...(official.imageUrl ? { imageUrl: official.imageUrl } : {}),
      categoryHint: "Oficial",
    };
  }

  if (ref.moduleId === "community" && ref.entityKind === "community_alert") {
    const alert = listActiveCommunityAlerts().find((a) => a.id === ref.entityId);
    if (!alert) return null;
    return {
      label: alert.title,
      summary: alert.body,
      experienceTag: "Aviso",
      heroTone: TONE_BY_KIND.alert,
      categoryHint: alert.contextLabel,
    };
  }

  return null;
}
