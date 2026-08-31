/**
 * Local Services Context — projection of the territorial economy.
 * Business, Help, Marketplace and Reservation remain the domains.
 * Do not create EconomyEntity, LocalCommerceEntity, ServiceMarketplaceEntity,
 * UniversalOfferEntity or ProviderScoreEntity.
 */

import type { BusinessProfile } from "../domain/business-profile";
import type { CommunityFeedItem } from "../community/community-feed";
import { businessTrustLabels } from "../trust/trust-context";

export const PROFESSIONAL_CATEGORIES = [
  "electrician",
  "plumber",
  "gardening",
  "cleaning",
  "maintenance",
  "carpenter",
  "painter",
  "locksmith-service",
  "air-conditioning",
  "veterinary",
  "service",
] as const;

export type ProfessionalCategory = (typeof PROFESSIONAL_CATEGORIES)[number];

export const LOCAL_SERVICE_ACTION_KINDS = [
  "hire",
  "reserve",
  "contact",
  "ask_help",
  "view_business",
] as const;

export type LocalServiceActionKind =
  (typeof LOCAL_SERVICE_ACTION_KINDS)[number];

export type LocalServiceAction = {
  kind: LocalServiceActionKind;
  label: string;
  href: string;
  entityType: "business" | "help" | "resource" | "experience";
  entityId: string;
};

export type LocalServicesCounts = {
  businesses: number;
  professionals: number;
  helpOffers: number;
  availableReservations: number;
};

export type LocalServicesPrivacy = {
  showServices: boolean;
  showProfessionalActivity: boolean;
  showAvailability: boolean;
};

export type LocalServicesContext = {
  tenantId: string;
  territoryId: string;
  services: LocalServicesCounts;
  actions: LocalServiceAction[];
};

export type ProfessionalCapabilities = {
  professionalCategory?: string;
  serviceArea?: string;
  availability?: string;
  contactPreference?: string;
};

export type LocalServiceCard = {
  id: string;
  name: string;
  kind: "business" | "professional" | "help";
  category: string;
  href: string;
  locationId?: string;
  distanceMeters?: number;
  available: boolean;
  trustLabels: string[];
};

export const DEFAULT_LOCAL_SERVICES_PRIVACY: LocalServicesPrivacy = {
  showServices: true,
  showProfessionalActivity: true,
  showAvailability: true,
};

export function isProfessionalCategory(value: string): boolean {
  return (PROFESSIONAL_CATEGORIES as readonly string[]).includes(value);
}

export function isProfessionalBusiness(
  business: Pick<BusinessProfile, "category" | "status">,
  locationType?: string,
): boolean {
  if (business.status !== "published") return false;
  if (locationType === "service") return true;
  return isProfessionalCategory(business.category);
}

export function professionalCapabilitiesFrom(
  business: Pick<
    BusinessProfile,
    "category" | "hours" | "contact" | "status"
  > & {
    serviceArea?: string;
    availability?: string;
    contactPreference?: string;
    showProfessionalActivity?: boolean;
    showAvailability?: boolean;
  },
  location?: { type?: string; areaLabel?: string },
): ProfessionalCapabilities | undefined {
  if (!isProfessionalBusiness(business, location?.type)) return undefined;
  if (business.showProfessionalActivity === false) return undefined;
  const privacy = mergeLocalServicesPrivacy({
    showAvailability: business.showAvailability,
  });
  return {
    professionalCategory: business.category,
    serviceArea: business.serviceArea?.trim() || location?.areaLabel,
    availability: privacy.showAvailability
      ? business.availability?.trim() || business.hours
      : undefined,
    contactPreference: business.contactPreference?.trim() || business.contact,
  };
}

export function mergeLocalServicesPrivacy(
  value?: Partial<LocalServicesPrivacy> | null,
): LocalServicesPrivacy {
  return {
    showServices: value?.showServices ?? DEFAULT_LOCAL_SERVICES_PRIVACY.showServices,
    showProfessionalActivity:
      value?.showProfessionalActivity ??
      DEFAULT_LOCAL_SERVICES_PRIVACY.showProfessionalActivity,
    showAvailability:
      value?.showAvailability ?? DEFAULT_LOCAL_SERVICES_PRIVACY.showAvailability,
  };
}

export function emptyLocalServicesContext(input: {
  tenantId: string;
  territoryId: string;
}): LocalServicesContext {
  return {
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    services: {
      businesses: 0,
      professionals: 0,
      helpOffers: 0,
      availableReservations: 0,
    },
    actions: [],
  };
}

export function projectLocalServicesContext(input: {
  tenantId: string;
  territoryId: string;
  businesses?: number;
  professionals?: number;
  helpOffers?: number;
  availableReservations?: number;
  actions?: LocalServiceAction[];
}): LocalServicesContext {
  const clamp = (value: number | undefined) =>
    typeof value === "number" && value > 0 ? Math.floor(value) : 0;
  return {
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    services: {
      businesses: clamp(input.businesses),
      professionals: clamp(input.professionals),
      helpOffers: clamp(input.helpOffers),
      availableReservations: clamp(input.availableReservations),
    },
    actions: input.actions ?? [],
  };
}

export function localServiceActionLabel(kind: LocalServiceActionKind): string {
  switch (kind) {
    case "hire":
      return "Contratar";
    case "reserve":
      return "Reservar";
    case "contact":
      return "Contactar";
    case "ask_help":
      return "Pedir ayuda";
    case "view_business":
      return "Ver negocio";
  }
}

export function helpEconomyLabel(type: "offer_help" | "need_help"): string {
  return type === "offer_help" ? "Ofrecer ayuda" : "Pedir ayuda";
}

export function neighborExchangeIsMarketplace(): true {
  return true;
}

export function compareLocalServiceCards(
  left: LocalServiceCard,
  right: LocalServiceCard,
): number {
  const dist = (left.distanceMeters ?? Number.POSITIVE_INFINITY) -
    (right.distanceMeters ?? Number.POSITIVE_INFINITY);
  if (dist !== 0) return dist;
  if (left.available !== right.available) return left.available ? -1 : 1;
  return right.trustLabels.length - left.trustLabels.length;
}

export function sortLocalServiceCards(
  cards: readonly LocalServiceCard[],
): LocalServiceCard[] {
  return [...cards].sort(compareLocalServiceCards);
}

export function businessToLocalServiceCard(
  business: BusinessProfile,
  location?: { type?: string; areaLabel?: string },
): LocalServiceCard {
  const professional = isProfessionalBusiness(business, location?.type);
  return {
    id: business.id,
    name: business.name,
    kind: professional ? "professional" : "business",
    category: business.category,
    href: `/locations/${encodeURIComponent(business.locationId)}`,
    locationId: business.locationId,
    available: Boolean(business.hours?.trim() || business.status === "published"),
    trustLabels: businessTrustLabels({
      registered: true,
      locationConfirmed: Boolean(business.locationId),
      published: business.status === "published",
    }),
  };
}

export function boostRelevantServiceFeed(
  items: readonly CommunityFeedItem[],
  interests: readonly string[],
): CommunityFeedItem[] {
  if (interests.length === 0) return [...items];
  const ranked = items.map((item, index) => {
    const blob = `${item.title} ${item.description ?? ""} ${item.metadata?.domain ?? ""}`.toLowerCase();
    const hit = interests.some((interest) => blob.includes(interest.toLowerCase()));
    return { item, index, hit };
  });
  ranked.sort((left, right) => {
    if (left.hit !== right.hit) return left.hit ? -1 : 1;
    return left.index - right.index;
  });
  return ranked.map((row) => row.item);
}

export function isOpaqueEconomyEntity(name: string): boolean {
  return (
    name === "EconomyEntity" ||
    name === "LocalCommerceEntity" ||
    name === "ServiceMarketplaceEntity" ||
    name === "UniversalOfferEntity" ||
    name === "ProviderScoreEntity"
  );
}

export function hasEconomyCurrency(value: string): boolean {
  return /puntos|moneda|karma|EconomyEntity/i.test(value);
}
