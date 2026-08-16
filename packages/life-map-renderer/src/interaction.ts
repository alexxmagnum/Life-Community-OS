/**
 * Digital Twin interaction helpers — selection → context experience.
 * Uses existing LifeMapInteraction shape; no booking logic.
 */

import type {
  LifeMapActionKind,
  LifeMapDomainRef,
  LifeMapInteraction,
  LifeMapObject,
} from "@life-community-os/types";

export type LifeMapContextPanelModel = {
  objectId: string;
  label: string;
  type: LifeMapObject["type"];
  categoryHint: string;
  state: LifeMapObject["state"];
  availableActions: readonly LifeMapActionKind[];
  asset3DKey?: string;
  ref?: LifeMapDomainRef;
  /** Short contextual blurb — product copy, not domain SoT. */
  summary: string;
  /** Experience tag for context cards. */
  experienceTag?: string;
  /** Soft visual tone for card header (CSS-friendly). */
  heroTone?: string;
  /** Optional image URL from domain when available later. */
  imageUrl?: string;
};

const CATEGORY_HINT: Record<LifeMapObject["type"], string> = {
  place: "Lugar",
  service: "Servicio",
  community: "Comunidad",
  experience: "Experiencia",
  resource: "Instalación",
  housing: "Vivienda",
  official: "Oficial",
  poi: "Punto",
  decoration: "Espacio",
};

function experienceForObject(object: LifeMapObject): {
  summary: string;
  experienceTag: string;
  heroTone: string;
} {
  const key = (object.asset3DKey ?? "").toLowerCase();
  if (key.includes("restaurant") || key.includes("ikon")) {
    return {
      summary:
        "Restaurante y lounge de la comunidad. Abre la ficha para conocer la carta social y eventos.",
      experienceTag: "Gastronomía",
      heroTone: "#c4a890",
    };
  }
  if (key.includes("pool")) {
    return {
      summary:
        "Zona de baño comunitaria. Consulta horarios y actividad en la ficha del lugar.",
      experienceTag: "Bienestar",
      heroTone: "#7eb0c4",
    };
  }
  if (key.includes("golf")) {
    return {
      summary:
        "Experiencia golf en el territorio. Accede a la ficha del club para más detalles.",
      experienceTag: "Deporte",
      heroTone: "#8faf7a",
    };
  }
  if (key.includes("padel")) {
    return {
      summary:
        "Pista de pádel. La reserva completa llegará en una fase posterior.",
      experienceTag: "Deporte",
      heroTone: "#7a9e8a",
    };
  }
  if (key.includes("cafe") || key.includes("clubhouse")) {
    return {
      summary:
        "Espacio social del club. Ideal para encontrarte con vecinos.",
      experienceTag: "Social",
      heroTone: "#c8b8a4",
    };
  }
  if (object.type === "service") {
    return {
      summary:
        "Servicio local verificado. Abre el perfil para contactar.",
      experienceTag: "Servicios",
      heroTone: "#b0a088",
    };
  }
  switch (object.type) {
    case "place":
      return {
        summary:
          "Lugar de la comunidad. Explora su ficha y cómo llegar.",
        experienceTag: "Lugar",
        heroTone: "#a8c4c8",
      };
    case "resource":
      return {
        summary:
          "Instalación de ocio — disponibilidad completa en una fase posterior.",
        experienceTag: "Instalación",
        heroTone: "#8ab89a",
      };
    case "housing":
      return {
        summary: "Referencia de vivienda en el territorio.",
        experienceTag: "Vivienda",
        heroTone: "#d0c4b0",
      };
    default:
      return {
        summary: "Objeto espacial de la comunidad.",
        experienceTag: CATEGORY_HINT[object.type] ?? "Espacio",
        heroTone: "#b8b0a4",
      };
  }
}

export function buildLifeMapContextPanel(
  object: LifeMapObject,
): LifeMapContextPanelModel {
  const experience = experienceForObject(object);
  return {
    objectId: object.objectId,
    label: object.label ?? object.objectId,
    type: object.type,
    categoryHint: CATEGORY_HINT[object.type] ?? "Espacio",
    state: object.state,
    availableActions: object.availableActions,
    ...(object.asset3DKey ? { asset3DKey: object.asset3DKey } : {}),
    ...(object.ref ? { ref: object.ref } : {}),
    summary: experience.summary,
    experienceTag: experience.experienceTag,
    heroTone: experience.heroTone,
  };
}

export function buildLifeMapInteraction(input: {
  object: LifeMapObject;
  action: LifeMapActionKind;
  actorPersonId: string;
}): LifeMapInteraction {
  return {
    tenantId: input.object.tenantId,
    territoryId: input.object.territoryId,
    actorPersonId: input.actorPersonId,
    objectId: input.object.objectId,
    action: input.action,
    ...(input.object.ref ? { ref: input.object.ref } : {}),
  };
}
