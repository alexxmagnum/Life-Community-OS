/**
 * Community Operations — daily territorial projection.
 * Does not persist DailyLifeEntity, CommunityTimelineEntity,
 * UniversalNotificationFeed, ResidentScore or HabitTracking.
 * Experience, Event, Reservation, Help, Business and Community remain SoT.
 */

import type { CommunityFeedItem } from "./community-feed";
import { partitionLivingCommunityFeed } from "./community-feed";
import type { CommunityCreationSource } from "./action-composer";
import type { CommunityPost } from "../domain/community-core";
import { projectStructuredAnnouncement } from "./announcement";
import { personalizeCommunityFeed } from "../personal/personalization";
import type { PersonalContext } from "../personal/personal-context";

export const COMMUNITY_OPERATION_ACTION_KINDS = [
  "join",
  "reserve",
  "ask_help",
  "view_place",
  "create_today",
  "create_here",
] as const;

export type CommunityOperationActionKind =
  (typeof COMMUNITY_OPERATION_ACTION_KINDS)[number];

export type CommunityOperationAction = {
  kind: CommunityOperationActionKind;
  label: string;
  href: string;
};

export type CommunityOperationsToday = {
  experiences: number;
  events: number;
  reservations: number;
  announcements: number;
  help: number;
  services: number;
};

export type CommunityOperationsContext = {
  tenantId: string;
  territoryId: string;
  today: CommunityOperationsToday;
  actions: CommunityOperationAction[];
};

export type TerritoryAnnouncement = {
  id: string;
  tenantId: string;
  territoryId: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy?: string;
  category?: import("./announcement").CommunityAnnouncementCategory;
  priority?: import("./announcement").CommunityAnnouncementPriority;
  audience?: import("./announcement").CommunityAnnouncementAudience;
  locationId?: string;
  startsAt?: string;
  endsAt?: string;
  requiresAcknowledgement?: boolean;
};

export type TerritoryDailyPulse = {
  tenantId: string;
  territoryId: string;
  now: CommunityFeedItem[];
  next: CommunityFeedItem[];
  important: TerritoryAnnouncement[];
  community: CommunityFeedItem[];
};

export const LIFE_PLACE_OPERATIONS_STATUSES = [
  "available",
  "activity_now",
  "upcoming",
  "reservation_open",
  "important_notice",
] as const;

export type LifePlaceOperationsStatus =
  (typeof LIFE_PLACE_OPERATIONS_STATUSES)[number];

export type LifePlaceOperations = {
  status: LifePlaceOperationsStatus;
  label: string;
};

export function emptyCommunityOperationsContext(input: {
  tenantId: string;
  territoryId: string;
}): CommunityOperationsContext {
  return {
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    today: {
      experiences: 0,
      events: 0,
      reservations: 0,
      announcements: 0,
      help: 0,
      services: 0,
    },
    actions: [],
  };
}

export function projectCommunityOperationsContext(input: {
  tenantId: string;
  territoryId: string;
  experiences?: number;
  events?: number;
  reservations?: number;
  announcements?: number;
  help?: number;
  services?: number;
  actions?: CommunityOperationAction[];
}): CommunityOperationsContext {
  const clamp = (value: number | undefined) =>
    typeof value === "number" && value > 0 ? Math.floor(value) : 0;
  return {
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    today: {
      experiences: clamp(input.experiences),
      events: clamp(input.events),
      reservations: clamp(input.reservations),
      announcements: clamp(input.announcements),
      help: clamp(input.help),
      services: clamp(input.services),
    },
    actions: input.actions ?? [],
  };
}

export function communityOperationActionLabel(
  kind: CommunityOperationActionKind,
): string {
  switch (kind) {
    case "join":
      return "Unirme";
    case "reserve":
      return "Reservar";
    case "ask_help":
      return "Pedir ayuda";
    case "view_place":
      return "Ver lugar";
    case "create_today":
      return "Crear para hoy";
    case "create_here":
      return "Crear en este lugar";
  }
}

export function announcementFromPost(
  post: Pick<
    CommunityPost,
    | "id"
    | "tenantId"
    | "territoryId"
    | "kind"
    | "title"
    | "body"
    | "createdAt"
    | "status"
    | "createdBy"
    | "announcementMeta"
  >,
): TerritoryAnnouncement | null {
  if (post.kind !== "announcement" || post.status !== "published") return null;
  return projectStructuredAnnouncement(post);
}

export function projectTerritoryDailyPulse(input: {
  tenantId: string;
  territoryId: string;
  items: readonly CommunityFeedItem[];
  announcements?: readonly TerritoryAnnouncement[];
}): TerritoryDailyPulse {
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  const scoped = input.items.filter(
    (item) => item.tenantId === tenantId && item.territoryId === territoryId,
  );
  const living = partitionLivingCommunityFeed(scoped);
  const important = (input.announcements ?? []).filter(
    (item) => item.tenantId === tenantId && item.territoryId === territoryId,
  );
  const community = scoped.filter(
    (item) => item.type === "community" || item.type === "business_activity",
  );
  return {
    tenantId,
    territoryId,
    now: living.now,
    next: living.upcoming,
    important,
    community,
  };
}

export function personalizeTerritoryDailyPulse(
  pulse: TerritoryDailyPulse,
  context: PersonalContext,
): TerritoryDailyPulse {
  const combined = [...pulse.now, ...pulse.next, ...pulse.community];
  const personalized = personalizeCommunityFeed({
    context,
    feed: combined,
  });
  const byId = new Map(personalized.items.map((item) => [item.id, item]));
  const reorder = (rows: CommunityFeedItem[]) => {
    const ranked = rows
      .map((item) => byId.get(item.id) ?? item)
      .sort((left, right) => {
        const leftIndex = personalized.items.findIndex((item) => item.id === left.id);
        const rightIndex = personalized.items.findIndex((item) => item.id === right.id);
        return leftIndex - rightIndex;
      });
    return ranked;
  };
  return {
    ...pulse,
    now: reorder(pulse.now),
    next: reorder(pulse.next),
    community: reorder(pulse.community),
    important: [...pulse.important],
  };
}

export function deriveLifePlaceOperations(input: {
  currentActivity?: readonly { title: string }[];
  experiences?: readonly { title: string }[];
  reservations?: readonly { available: number }[];
  importantNotice?: string;
}): LifePlaceOperations {
  const notice = input.importantNotice?.trim();
  if (notice) {
    return { status: "important_notice", label: notice };
  }
  const now = input.currentActivity?.[0]?.title?.trim();
  if (now) {
    return { status: "activity_now", label: now };
  }
  const next = input.experiences?.[0]?.title?.trim();
  if (next) {
    return { status: "upcoming", label: next };
  }
  if ((input.reservations?.[0]?.available ?? 0) > 0) {
    return { status: "reservation_open", label: "Reserva abierta" };
  }
  return { status: "available", label: "Disponible" };
}

export function composerTitleForSource(
  source?: CommunityCreationSource,
): string {
  if (source === "home") return "Crear para hoy";
  return "Crear experiencia";
}

export function isOpaqueDailyLifeEntity(name: string): boolean {
  return (
    name === "DailyLifeEntity" ||
    name === "CommunityTimelineEntity" ||
    name === "UniversalNotificationFeed" ||
    name === "ResidentScore" ||
    name === "HabitTracking" ||
    name === "SocialWall"
  );
}
