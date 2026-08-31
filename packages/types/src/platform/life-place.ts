import type { CommunityFeedItem } from "../community/community-feed";
import {
  communityFeedItemHref,
  communityFeedPrimaryLabel,
} from "../community/community-feed";
import type { Location } from "../domain/location";
import type { ReservationContext } from "../domain/reservation-context";
import type { MediaReference } from "./files";

/**
 * Life Place Experience Layer — read projection over a Location.
 * Location remains SoT. Experience / Reservation / Resource / Business / Community
 * remain domains. This is a projection, not a place aggregate.
 */

export const LIFE_PLACE_ACTION_KINDS = [
  "join_experience",
  "reserve_resource",
  "view_business",
  "contact",
  "participate",
  "create_activity",
] as const;

export type LifePlaceActionKind = (typeof LIFE_PLACE_ACTION_KINDS)[number];

export type LifePlaceAction = {
  kind: LifePlaceActionKind;
  label: string;
  href: string;
  experienceId?: string;
  resourceId?: string;
  businessId?: string;
};

export type LifePlaceLocationView = {
  id: string;
  name: string;
  type: string;
  category: string;
  address?: string;
  summary?: string;
  hours?: string;
  contact?: string;
};

export type LifePlaceResourceSummary = {
  id: string;
  name: string;
  category?: string;
  bookable: boolean;
};

export type LifePlaceExperienceSummary = {
  id: string;
  title: string;
  startsAt?: string;
  available?: number;
  href: string;
};

export type LifePlaceReservationAvailability = {
  context: ReservationContext;
  available: number;
  label: string;
  href: string;
};

export type LifePlaceBusinessSummary = {
  id: string;
  name: string;
  category: string;
  href: string;
};

export type LifePlaceCommunityView = {
  participantCount: number;
  label: string;
};

export type LifePlaceContext = {
  id: string;
  tenantId: string;
  territoryId: string;
  location: LifePlaceLocationView;
  currentActivity: CommunityFeedItem[];
  resources: LifePlaceResourceSummary[];
  experiences: LifePlaceExperienceSummary[];
  reservations: LifePlaceReservationAvailability[];
  business?: LifePlaceBusinessSummary;
  actions: LifePlaceAction[];
  community?: LifePlaceCommunityView;
  cover?: MediaReference;
};

export type LifePlaceQueryInput = {
  tenantId: string;
  territoryId: string;
  locationId: string;
};

export function isLifePlaceActionKind(
  value: string,
): value is LifePlaceActionKind {
  return (LIFE_PLACE_ACTION_KINDS as readonly string[]).includes(value);
}

export function lifePlaceActionLabel(kind: LifePlaceActionKind): string {
  switch (kind) {
    case "join_experience":
      return "Unirme";
    case "reserve_resource":
      return "Reservar";
    case "view_business":
      return "Ver negocio";
    case "contact":
      return "Contactar";
    case "participate":
      return "Participar";
    case "create_activity":
      return "Proponer un plan";
  }
}

export function contactHref(contact: string): string | null {
  const value = contact.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes("@") && !value.includes(" ")) return `mailto:${value}`;
  if (/^[\d\s+().-]{6,}$/.test(value)) {
    return `tel:${value.replace(/[^\d+]/g, "")}`;
  }
  return null;
}

export function projectLocationToLifePlaceView(
  location: Location,
): LifePlaceLocationView {
  return {
    id: location.id,
    name: location.name,
    type: location.type,
    category: location.category,
    address: location.geocodeDisplayName ?? location.address,
    summary: location.summary,
    hours: location.hours,
    contact: location.contact,
  };
}

export function buildLifePlaceActions(input: {
  location: LifePlaceLocationView;
  currentActivity: readonly CommunityFeedItem[];
  experiences: readonly LifePlaceExperienceSummary[];
  reservations: readonly LifePlaceReservationAvailability[];
  business?: LifePlaceBusinessSummary;
  canCreateActivity?: boolean;
}): LifePlaceAction[] {
  const actions: LifePlaceAction[] = [];
  const seen = new Set<string>();
  const push = (action: LifePlaceAction) => {
    const key = `${action.kind}:${action.href}`;
    if (seen.has(key)) return;
    seen.add(key);
    actions.push(action);
  };

  for (const item of input.currentActivity) {
    if (item.actions.primary === "join" && item.experienceId) {
      push({
        kind: item.type === "event" ? "participate" : "join_experience",
        label: communityFeedPrimaryLabel(item),
        href: communityFeedItemHref(item),
        experienceId: item.experienceId,
      });
    }
    if (
      item.actions.primary === "reserve" &&
      item.resourceId
    ) {
      push({
        kind: "reserve_resource",
        label: "Reservar",
        href: communityFeedItemHref(item),
        resourceId: item.resourceId,
      });
    }
    if (item.actions.primary === "contact") {
      const href = item.metadata?.href ?? contactHref(input.location.contact ?? "");
      if (href) {
        push({ kind: "contact", label: "Contactar", href });
      }
    }
  }

  for (const experience of input.experiences) {
    push({
      kind: "join_experience",
      label: "Unirme",
      href: experience.href,
      experienceId: experience.id,
    });
  }

  for (const reservation of input.reservations) {
    push({
      kind: "reserve_resource",
      label: "Reservar",
      href: reservation.href,
      resourceId:
        reservation.context.type === "resource"
          ? reservation.context.id
          : undefined,
    });
  }

  if (input.business) {
    push({
      kind: "view_business",
      label: "Ver negocio",
      href: input.business.href,
      businessId: input.business.id,
    });
  }

  const contact = contactHref(input.location.contact ?? "");
  if (contact) {
    push({ kind: "contact", label: "Contactar", href: contact });
  }

  if (input.canCreateActivity) {
    push({
      kind: "create_activity",
      label: "Proponer un plan",
      href: "/experiences/create",
    });
  }

  return actions;
}

export function createLifePlaceContext(input: {
  tenantId: string;
  territoryId: string;
  location: Location;
  currentActivity?: readonly CommunityFeedItem[];
  resources?: readonly LifePlaceResourceSummary[];
  experiences?: readonly LifePlaceExperienceSummary[];
  reservations?: readonly LifePlaceReservationAvailability[];
  business?: LifePlaceBusinessSummary;
  community?: LifePlaceCommunityView;
  cover?: MediaReference;
  canCreateActivity?: boolean;
}): LifePlaceContext {
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  const locationView = projectLocationToLifePlaceView(input.location);
  const currentActivity = (input.currentActivity ?? []).filter(
    (item) =>
      item.tenantId === tenantId &&
      item.territoryId === territoryId &&
      item.locationId === input.location.id,
  );
  const resources = input.resources ?? [];
  const experiences = input.experiences ?? [];
  const reservations = input.reservations ?? [];
  return {
    id: input.location.id,
    tenantId,
    territoryId,
    location: locationView,
    currentActivity: [...currentActivity],
    resources: [...resources],
    experiences: [...experiences],
    reservations: [...reservations],
    ...(input.business ? { business: input.business } : {}),
    actions: buildLifePlaceActions({
      location: locationView,
      currentActivity,
      experiences,
      reservations,
      business: input.business,
      canCreateActivity: input.canCreateActivity,
    }),
    ...(input.community ? { community: input.community } : {}),
    ...(input.cover ? { cover: input.cover } : {}),
  };
}

export function lifePlaceNowLabel(
  context: Pick<LifePlaceContext, "currentActivity">,
): string | undefined {
  return context.currentActivity[0]?.title;
}

export function lifePlaceAvailabilityLabel(
  context: Pick<LifePlaceContext, "currentActivity" | "reservations">,
): string | undefined {
  const lead = context.currentActivity[0];
  if (lead?.capacity != null) {
    return `${lead.capacity.available} plazas disponibles`;
  }
  const reservation = context.reservations[0];
  if (reservation && reservation.available > 0) {
    return `${reservation.available} plazas disponibles`;
  }
  return undefined;
}
