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

function summaryForObject(object: LifeMapObject): string {
  switch (object.type) {
    case "place":
      return "Información del lugar y acceso a su ficha en la comunidad.";
    case "service":
      return "Profesional o servicio local — abre el perfil para contactar.";
    case "resource":
      return "Instalación deportiva o de ocio — disponibilidad completa en una fase posterior.";
    case "experience":
    case "community":
      return "Actividad de la comunidad — consulta detalles y participación.";
    case "housing":
      return "Referencia de vivienda en el territorio.";
    default:
      return "Objeto espacial de la comunidad.";
  }
}

export function buildLifeMapContextPanel(
  object: LifeMapObject,
): LifeMapContextPanelModel {
  return {
    objectId: object.objectId,
    label: object.label ?? object.objectId,
    type: object.type,
    categoryHint: CATEGORY_HINT[object.type] ?? "Espacio",
    state: object.state,
    availableActions: object.availableActions,
    ...(object.asset3DKey ? { asset3DKey: object.asset3DKey } : {}),
    ...(object.ref ? { ref: object.ref } : {}),
    summary: summaryForObject(object),
  };
}

/**
 * Build a LifeMapInteraction intent from a selected object + action.
 * Actor is supplied by the host (session person).
 */
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
