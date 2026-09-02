/**
 * Magic Plus — universal creation engine sections.
 * Routes intentions to existing domains; does not persist content.
 */

import type {
  CommunityCreationAction,
  CommunityCreationActionType,
} from "@life-community-os/types";
import type { CreateAction, CreateActionSection } from "@life-community-os/ui";

/** Intention groups shown in the + sheet (group_create stays in Community). */
const MAGIC_PLUS_SECTION_DEFS: readonly {
  id: string;
  title: string;
  actionTypes: readonly CommunityCreationActionType[];
}[] = [
  {
    id: "experience",
    title: "Experiencia",
    actionTypes: ["experience_create", "event_create"],
  },
  {
    id: "announcement",
    title: "Aviso",
    actionTypes: ["announcement_create"],
  },
  {
    id: "marketplace",
    title: "Comprar / vender",
    actionTypes: ["marketplace_listing"],
  },
  {
    id: "work",
    title: "Trabajo / servicio",
    actionTypes: ["work_create", "offer_service", "business_create"],
  },
  {
    id: "help",
    title: "Ayuda",
    actionTypes: ["help_request", "help_offer"],
  },
  {
    id: "reservation",
    title: "Reserva",
    actionTypes: ["reservation_create"],
  },
];

export function buildMagicPlusSections(
  listed: readonly CommunityCreationAction[],
  toCreateAction: (action: CommunityCreationAction) => CreateAction,
): CreateActionSection[] {
  const byType = new Map(listed.map((action) => [action.type, action]));
  return MAGIC_PLUS_SECTION_DEFS.map((section) => ({
    id: section.id,
    title: section.title,
    actions: section.actionTypes
      .map((type) => byType.get(type))
      .filter((action): action is CommunityCreationAction => Boolean(action))
      .map((action) => toCreateAction(action)),
  })).filter((section) => section.actions.length > 0);
}

export function magicPlusSectionActionTypes(): readonly CommunityCreationActionType[] {
  return MAGIC_PLUS_SECTION_DEFS.flatMap((section) => section.actionTypes);
}
