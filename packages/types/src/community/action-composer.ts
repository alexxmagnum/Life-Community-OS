import { CAPABILITIES } from "../platform/capabilities";
import {
  isProductCapabilityEnabled,
  type ProductCapabilityKey,
  type ProductCapabilityMap,
} from "../platform/tenant-contract";

/**
 * Action Composer — intention layer over existing domains.
 * Does not persist a universal creation entity.
 * Each action routes to Experience, Community, Help, Marketplace or Business.
 */

export const COMMUNITY_CREATION_ACTION_TYPES = [
  "experience_create",
  "event_create",
  "announcement_create",
  "help_request",
  "help_offer",
  "marketplace_listing",
  "work_create",
  "reservation_create",
  "group_create",
  "business_create",
  "offer_service",
] as const;

export type CommunityCreationActionType =
  (typeof COMMUNITY_CREATION_ACTION_TYPES)[number];

export type CommunityCreationAction = {
  id: string;
  type: CommunityCreationActionType;
  title: string;
  description: string;
  icon: string;
  requiredCapability: string;
  route: string;
  territoryRequired: boolean;
};

/** Where the + opened. Client UX only — never sent as territory or owner. */
export const COMMUNITY_CREATION_SOURCES = [
  "global_plus",
  "life_place",
  "life_map",
  "home",
  "discover",
] as const;

export type CommunityCreationSource =
  (typeof COMMUNITY_CREATION_SOURCES)[number];

export type CommunityCreationContext = {
  source?: CommunityCreationSource;
  locationId?: string;
  locationName?: string;
  /** Opens Magic Plus focused on one intention (still routes through + sheet). */
  focusActionType?: CommunityCreationActionType;
};

export type CommunityActionRegistryInput = {
  hasMembership: boolean;
  capabilities: readonly string[];
  productCapabilities?: ProductCapabilityMap;
  territoryId?: string | null;
};

export const COMMUNITY_CREATION_ACTIONS: readonly CommunityCreationAction[] = [
  {
    id: "experience_create",
    type: "experience_create",
    title: "Crear experiencia",
    description: "Organiza una actividad que reúna vecinos",
    icon: "✨",
    requiredCapability: CAPABILITIES.experienceCreate,
    route: "/experiences/create",
    territoryRequired: true,
  },
  {
    id: "event_create",
    type: "event_create",
    title: "Organizar evento",
    description: "Convoca a quienes viven cerca",
    icon: "📅",
    requiredCapability: CAPABILITIES.contentCreate,
    route: "/community/events/create",
    territoryRequired: true,
  },
  {
    id: "announcement_create",
    type: "announcement_create",
    title: "Crear aviso",
    description: "Comparte información importante con tu comunidad",
    icon: "📣",
    requiredCapability: CAPABILITIES.contentCreate,
    route: "/community/announcements/create",
    territoryRequired: true,
  },
  {
    id: "help_request",
    type: "help_request",
    title: "Pedir ayuda",
    description: "Solicita colaboración",
    icon: "🤝",
    requiredCapability: CAPABILITIES.localView,
    route: "/help/create",
    territoryRequired: true,
  },
  {
    id: "help_offer",
    type: "help_offer",
    title: "Ofrecer ayuda",
    description: "Echa una mano a un vecino",
    icon: "🌿",
    requiredCapability: CAPABILITIES.localView,
    route: "/help/create",
    territoryRequired: true,
  },
  {
    id: "marketplace_listing",
    type: "marketplace_listing",
    title: "Vender o regalar",
    description: "Pon en circulación algo que ya no usas",
    icon: "🎁",
    requiredCapability: CAPABILITIES.marketplaceCreate,
    route: "/marketplace/create",
    territoryRequired: true,
  },
  {
    id: "work_create",
    type: "work_create",
    title: "Publicar trabajo",
    description: "Busca colaboración o ofrece tu oficio",
    icon: "💼",
    requiredCapability: CAPABILITIES.localView,
    route: "/services/work/create",
    territoryRequired: true,
  },
  {
    id: "reservation_create",
    type: "reservation_create",
    title: "Reservar espacio",
    description: "Solicita una instalación o recurso del territorio",
    icon: "📅",
    requiredCapability: CAPABILITIES.resourceReserve,
    route: "/resources",
    territoryRequired: true,
  },
  {
    id: "group_create",
    type: "group_create",
    title: "Crear grupo",
    description: "Forma una comunidad",
    icon: "👥",
    requiredCapability: CAPABILITIES.groupCreate,
    route: "/community/groups/create",
    territoryRequired: true,
  },
  {
    id: "business_create",
    type: "business_create",
    title: "Registrar negocio",
    description: "Tu negocio en el mapa",
    icon: "🏢",
    requiredCapability: CAPABILITIES.localView,
    route: "/business/register",
    territoryRequired: true,
  },
  {
    id: "offer_service",
    type: "offer_service",
    title: "Ofrecer un servicio",
    description: "Registra tu oficio en el territorio",
    icon: "🔧",
    requiredCapability: CAPABILITIES.localView,
    route: "/business/register",
    territoryRequired: true,
  },
];

export function isCommunityCreationActionType(
  value: string,
): value is CommunityCreationActionType {
  return (COMMUNITY_CREATION_ACTION_TYPES as readonly string[]).includes(value);
}

export function isCommunityCreationSource(
  value: string | null | undefined,
): value is CommunityCreationSource {
  return (COMMUNITY_CREATION_SOURCES as readonly string[]).includes(value ?? "");
}

/**
 * Client context for the +. Strips territoryId / createdBy / ownerId
 * even if a caller tries to pass them.
 */
export function sanitizeCommunityCreationContext(
  input?: CommunityCreationContext | null,
): CommunityCreationContext {
  const source = isCommunityCreationSource(input?.source)
    ? input.source
    : undefined;
  const locationId = input?.locationId?.trim() || undefined;
  const locationName = input?.locationName?.trim() || undefined;
  const focusActionType = isCommunityCreationActionType(
    input?.focusActionType ?? "",
  )
    ? input!.focusActionType
    : undefined;
  return {
    ...(source ? { source } : {}),
    ...(locationId ? { locationId } : {}),
    ...(locationName ? { locationName } : {}),
    ...(focusActionType ? { focusActionType } : {}),
  };
}

/** Magic Plus section id for contextual focus (matches magic-plus-sections). */
export function magicPlusSectionIdForActionType(
  type: CommunityCreationActionType,
): string {
  switch (type) {
    case "experience_create":
    case "event_create":
      return "experience";
    case "announcement_create":
      return "announcement";
    case "marketplace_listing":
      return "marketplace";
    case "work_create":
    case "offer_service":
    case "business_create":
      return "work";
    case "help_request":
    case "help_offer":
      return "help";
    case "reservation_create":
      return "reservation";
    case "group_create":
      return "experience";
    default:
      return "experience";
  }
}

function productKeyForCreation(
  type: CommunityCreationActionType,
): ProductCapabilityKey | null {
  switch (type) {
    case "experience_create":
      return "experiences";
    case "event_create":
    case "announcement_create":
    case "group_create":
      return "community";
    case "marketplace_listing":
      return "marketplace";
    case "business_create":
    case "offer_service":
      return "lifeMap";
    case "work_create":
      return "work";
    case "reservation_create":
      return "reservations";
    case "help_request":
    case "help_offer":
      return null;
  }
}

export function communityCreationRoute(
  action: Pick<CommunityCreationAction, "type" | "route">,
  context?: CommunityCreationContext,
): string {
  const parts: string[] = [];
  const locationId = context?.locationId?.trim();
  const locationName = context?.locationName?.trim();
  if (action.type === "help_offer") {
    parts.push("type=offer_help");
  }
  if (action.type === "help_request") {
    parts.push("type=need_help");
  }
  if (action.type === "offer_service") {
    parts.push("intent=service");
  }
  if (
    (action.type === "experience_create" ||
      action.type === "event_create" ||
      action.type === "announcement_create" ||
      action.type === "offer_service") &&
    locationId
  ) {
    parts.push(`locationId=${encodeURIComponent(locationId)}`);
  }
  if (action.type === "experience_create" && locationName) {
    parts.push(`locationName=${encodeURIComponent(locationName)}`);
  }
  if (
    (action.type === "event_create" ||
      action.type === "announcement_create") &&
    locationName
  ) {
    parts.push(`location=${encodeURIComponent(locationName)}`);
  }
  return parts.length > 0 ? `${action.route}?${parts.join("&")}` : action.route;
}

export function isCommunityCreationActionAvailable(
  action: CommunityCreationAction,
  input: CommunityActionRegistryInput,
): boolean {
  if (!input.hasMembership) return false;
  if (!input.capabilities.includes(action.requiredCapability)) return false;
  if (action.territoryRequired && !input.territoryId?.trim()) return false;
  const productKey = productKeyForCreation(action.type);
  if (productKey && input.productCapabilities) {
    if (!isProductCapabilityEnabled(input.productCapabilities, productKey)) {
      return false;
    }
  }
  return true;
}

export function listCommunityCreationActions(
  input: CommunityActionRegistryInput,
): CommunityCreationAction[] {
  return COMMUNITY_CREATION_ACTIONS.filter((action) =>
    isCommunityCreationActionAvailable(action, input),
  );
}

export const CommunityActionRegistry = {
  list: listCommunityCreationActions,
  href: communityCreationRoute,
  isAvailable: isCommunityCreationActionAvailable,
};
