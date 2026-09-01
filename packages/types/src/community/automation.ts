/**
 * Community Automation — proactive territorial assistance.
 * Projection only. Never stores habits, hidden behaviour or autonomous agents.
 */

import type { CommunityFeedItem } from "./community-feed";
import { deriveLifePlaceOperations } from "./operations";
import type { LifePlaceContext } from "../platform/life-place";
import type { PersonalContext, PersonalPrivacy } from "../personal/personal-context";
import type { TerritoryAnnouncement } from "./operations";

export const COMMUNITY_AUTOMATION_PROVIDER_IDS = ["rules", "ai"] as const;

export type CommunityAutomationProviderId =
  (typeof COMMUNITY_AUTOMATION_PROVIDER_IDS)[number];

export const COMMUNITY_AUTOMATION_TRIGGER_KINDS = [
  "experience_upcoming",
  "reservation_upcoming",
  "availability_change",
  "territory_notice",
  "event_update",
  "place_operational",
] as const;

export type CommunityAutomationTriggerKind =
  (typeof COMMUNITY_AUTOMATION_TRIGGER_KINDS)[number];

export type CommunityAutomationTrigger = {
  id: string;
  kind: CommunityAutomationTriggerKind;
  sourceType: "experience" | "reservation" | "announcement" | "place" | "event";
  sourceId: string;
  title: string;
  body: string;
  reason: string;
  href?: string;
  startsAt?: string;
};

export type CommunityAutomationPreview = {
  id: string;
  triggerId: string;
  title: string;
  body: string;
  explanation: string;
  notificationKind:
    | "automation_reminder"
    | "automation_hint"
    | "community_update";
  requiresConfirmation: true;
  href?: string;
  entityType?: string;
  entityId?: string;
};

export type CommunityOperationalHint = {
  id: string;
  title: string;
  body: string;
  reason: string;
};

export type CommunityAutomationPermissions = {
  canReceive: boolean;
  canConfirm: boolean;
  canViewAdminHints: boolean;
};

export type CommunityAutomationContext = {
  tenantId: string;
  territoryId: string;
  triggers: CommunityAutomationTrigger[];
  suggestions: CommunityAutomationPreview[];
  permissions: CommunityAutomationPermissions;
  privacy: PersonalPrivacy;
  enabled: boolean;
  providerId: CommunityAutomationProviderId;
  adminHints?: CommunityOperationalHint[];
};

export type ReservationAutomationRow = {
  id: string;
  tenantId: string;
  territoryId?: string;
  createdBy?: string;
  date: string;
  start: string;
  resourceName?: string;
  status: string;
};

export type ExperienceAutomationRow = {
  id: string;
  tenantId: string;
  territoryId: string;
  title: string;
  startsAt: string;
  status: string;
  capacity?: number;
  participantCount?: number;
};

export type CommunityAutomationInput = {
  context: PersonalContext;
  reservations?: readonly ReservationAutomationRow[];
  experiences?: readonly ExperienceAutomationRow[];
  announcements?: readonly TerritoryAnnouncement[];
  feed?: readonly CommunityFeedItem[];
  place?: LifePlaceContext;
  favoriteLocationIds?: readonly string[];
  now?: number;
  isCommunityAdmin?: boolean;
  pendingEvents?: number;
  openHelpRequests?: number;
};

export type AutomationProvider = {
  id: CommunityAutomationProviderId;
  resolveTriggers(input: CommunityAutomationInput): CommunityAutomationTrigger[];
};

export type TriggerResolver = AutomationProvider;

export type NotificationPlanner = {
  id: CommunityAutomationProviderId;
  plan(
    triggers: readonly CommunityAutomationTrigger[],
  ): CommunityAutomationPreview[];
};

const MS_DAY = 86_400_000;
const MS_HOUR = 3_600_000;

function automationEnabled(context: PersonalContext): boolean {
  return context.privacy.receiveRecommendations !== false;
}

function reservationDateTime(row: ReservationAutomationRow): number {
  return Date.parse(`${row.date}T${row.start}:00.000Z`);
}

function isUpcomingReservation(
  row: ReservationAutomationRow,
  now: number,
  withinMs: number,
): boolean {
  const at = reservationDateTime(row);
  if (Number.isNaN(at)) return false;
  return at > now && at - now <= withinMs;
}

function isUpcomingExperience(
  row: ExperienceAutomationRow,
  now: number,
  withinMs: number,
): boolean {
  const at = Date.parse(row.startsAt);
  if (Number.isNaN(at)) return false;
  return at > now && at - now <= withinMs;
}

export function resolveReminders(
  input: CommunityAutomationInput,
): CommunityAutomationTrigger[] {
  if (!automationEnabled(input.context)) return [];
  const now = input.now ?? Date.now();
  const triggers: CommunityAutomationTrigger[] = [];
  for (const reservation of input.reservations ?? []) {
    if (!isUpcomingReservation(reservation, now, MS_DAY * 2)) continue;
    const label = reservation.resourceName?.trim() || "tu reserva";
    const when =
      isUpcomingReservation(reservation, now, MS_DAY)
        ? "mañana"
        : "pronto";
    triggers.push({
      id: `reminder:reservation:${reservation.id}`,
      kind: "reservation_upcoming",
      sourceType: "reservation",
      sourceId: reservation.id,
      title: `Tu reserva ${when}`,
      body: `Tienes ${label} el ${reservation.date} a las ${reservation.start}.`,
      reason: "Porque tienes una reserva confirmada en tu territorio",
      href: `/reservations`,
      startsAt: `${reservation.date}T${reservation.start}:00.000Z`,
    });
  }
  for (const experience of input.experiences ?? []) {
    if (experience.status !== "published") continue;
    if (!isUpcomingExperience(experience, now, MS_DAY * 2)) continue;
    triggers.push({
      id: `reminder:experience:${experience.id}`,
      kind: "experience_upcoming",
      sourceType: "experience",
      sourceId: experience.id,
      title: "Actividad próxima",
      body: `${experience.title} empieza pronto en tu comunidad.`,
      reason: "Porque hay una actividad programada cerca de ti",
      href: `/experiences/${experience.id}`,
      startsAt: experience.startsAt,
    });
  }
  return triggers;
}

export function resolveCommunitySuggestions(
  input: CommunityAutomationInput,
): CommunityAutomationTrigger[] {
  if (!automationEnabled(input.context)) return [];
  const triggers: CommunityAutomationTrigger[] = [];
  const favorites = new Set(input.favoriteLocationIds ?? []);
  for (const item of input.feed ?? []) {
    const available = item.capacity?.available;
    if (typeof available !== "number" || available <= 0) continue;
    const isFavorite =
      Boolean(item.locationId && favorites.has(item.locationId)) ||
      Boolean(
        item.experienceId &&
          (input.favoriteLocationIds ?? []).includes(item.experienceId),
      );
    if (!isFavorite && available > 3) continue;
    triggers.push({
      id: `availability:${item.id}`,
      kind: "availability_change",
      sourceType: "event",
      sourceId: item.id,
      title: "Nueva plaza disponible",
      body: `${item.title} tiene plazas libres.`,
      reason: isFavorite
        ? "Porque sigues esta actividad o lugar"
        : "Porque hay disponibilidad en tu territorio",
      href: item.metadata?.href,
      startsAt: item.startsAt,
    });
  }
  return triggers.slice(0, 4);
}

export function resolveOperationalHints(
  input: CommunityAutomationInput,
): CommunityOperationalHint[] {
  if (!automationEnabled(input.context)) return [];
  const hints: CommunityOperationalHint[] = [];
  for (const announcement of input.announcements ?? []) {
    hints.push({
      id: `territory:${announcement.id}`,
      title: announcement.title,
      body: announcement.body,
      reason: "Aviso territorial de tu comunidad",
    });
  }
  if (input.place) {
    const operations = deriveLifePlaceOperations({
      currentActivity: input.place.currentActivity,
      experiences: input.place.experiences,
      reservations: input.place.reservations,
      importantNotice: input.place.operations?.label,
    });
    if (operations.status === "important_notice") {
      hints.push({
        id: `place:notice:${input.place.id}`,
        title: operations.label,
        body: `Actualización en ${input.place.location.name}.`,
        reason: `Porque estás viendo ${input.place.location.name}`,
      });
    } else if (operations.status === "reservation_open") {
      hints.push({
        id: `place:reservation:${input.place.id}`,
        title: "Reserva disponible",
        body: `Hay disponibilidad en ${input.place.location.name}.`,
        reason: "Porque hay reserva abierta en este lugar",
      });
    } else if (operations.status === "upcoming") {
      hints.push({
        id: `place:upcoming:${input.place.id}`,
        title: operations.label,
        body: `Actividad próxima en ${input.place.location.name}.`,
        reason: "Porque hay vida programada en este lugar",
      });
    }
  }
  return hints.slice(0, 5);
}

export function resolveAdminOperationalHints(input: {
  pendingEvents?: number;
  openHelpRequests?: number;
  pendingReview?: number;
}): CommunityOperationalHint[] {
  const hints: CommunityOperationalHint[] = [];
  if ((input.pendingEvents ?? 0) > 0) {
    hints.push({
      id: "admin:events-pending",
      title: "Hay eventos pendientes",
      body: "Revisa actividades que necesitan atención territorial.",
      reason: "Ayuda operativa para el administrador comunitario",
    });
  }
  if ((input.openHelpRequests ?? 0) > 0) {
    hints.push({
      id: "admin:help-open",
      title: "Hay solicitudes abiertas",
      body: "Vecinos esperan respuesta en peticiones de ayuda.",
      reason: "Ayuda operativa para el administrador comunitario",
    });
  }
  if ((input.pendingReview ?? 0) > 0) {
    hints.push({
      id: "admin:review-needed",
      title: "Una actividad necesita revisión",
      body: "Hay contenido comunitario pendiente de moderación.",
      reason: "Ayuda operativa para el administrador comunitario",
    });
  }
  return hints;
}

export function resolveTriggers(
  input: CommunityAutomationInput,
): CommunityAutomationTrigger[] {
  const reminders = resolveReminders(input);
  const suggestions = resolveCommunitySuggestions(input);
  const placeTriggers: CommunityAutomationTrigger[] = [];
  for (const hint of resolveOperationalHints(input)) {
    if (!hint.id.startsWith("place:")) continue;
    placeTriggers.push({
      id: hint.id,
      kind: "place_operational",
      sourceType: "place",
      sourceId: input.place?.id ?? hint.id,
      title: hint.title,
      body: hint.body,
      reason: hint.reason,
    });
  }
  const seen = new Set<string>();
  return [...reminders, ...suggestions, ...placeTriggers].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export function createAutomationPreview(
  trigger: CommunityAutomationTrigger,
): CommunityAutomationPreview {
  const notificationKind: CommunityAutomationPreview["notificationKind"] =
    trigger.kind === "reservation_upcoming" ||
    trigger.kind === "experience_upcoming"
      ? "automation_reminder"
      : trigger.kind === "place_operational" ||
          trigger.kind === "availability_change"
        ? "automation_hint"
        : "community_update";
  return {
    id: `preview:${trigger.id}`,
    triggerId: trigger.id,
    title: trigger.title,
    body: trigger.body,
    explanation: trigger.reason,
    notificationKind,
    requiresConfirmation: true,
    href: trigger.href,
    entityType: trigger.sourceType,
    entityId: trigger.sourceId,
  };
}

export function planAutomationNotifications(
  triggers: readonly CommunityAutomationTrigger[],
): CommunityAutomationPreview[] {
  return triggers.map(createAutomationPreview);
}

export function projectCommunityAutomationContext(input: {
  tenantId: string;
  territoryId: string;
  context: PersonalContext;
  triggers: readonly CommunityAutomationTrigger[];
  adminHints?: readonly CommunityOperationalHint[];
  isCommunityAdmin?: boolean;
  providerId?: CommunityAutomationProviderId;
}): CommunityAutomationContext {
  const enabled = automationEnabled(input.context);
  const suggestions = enabled
    ? planAutomationNotifications(input.triggers)
    : [];
  return {
    tenantId: input.tenantId,
    territoryId: input.territoryId,
    triggers: [...input.triggers],
    suggestions,
    permissions: {
      canReceive: enabled,
      canConfirm: enabled && input.context.personId !== "anonymous",
      canViewAdminHints: Boolean(input.isCommunityAdmin),
    },
    privacy: { ...input.context.privacy },
    enabled,
    providerId: input.providerId ?? "rules",
    ...(input.isCommunityAdmin && input.adminHints?.length
      ? { adminHints: [...input.adminHints] }
      : {}),
  };
}

export const RuleBasedAutomationProvider: AutomationProvider = {
  id: "rules",
  resolveTriggers,
};

export const RuleBasedNotificationPlanner: NotificationPlanner = {
  id: "rules",
  plan: planAutomationNotifications,
};

export function automationRespectsTerritory(
  context: CommunityAutomationContext,
  tenantId: string,
  territoryId: string,
): boolean {
  return context.tenantId === tenantId && context.territoryId === territoryId;
}

export function automationRequiresConfirmation(
  preview: CommunityAutomationPreview,
): boolean {
  return preview.requiresConfirmation === true;
}

export function automationDoesNotAutoExecute(
  preview: CommunityAutomationPreview,
): boolean {
  return preview.requiresConfirmation === true;
}

export function isOpaqueCommunityAutomationEntity(name: string): boolean {
  return [
    "GlobalAutomationEntity",
    "UniversalWorkflowEntity",
    "AutonomousCommunityAgent",
    "AIActionExecutor",
    "BehaviorAutomationProfile",
    "EngagementAutomationScore",
    "ResidentHabitEngine",
    "CrossTenantAutomationSystem",
    "UserPredictionEntity",
  ].includes(name);
}

export function operationalHintsFromPlace(
  place: LifePlaceContext,
  context: PersonalContext,
): CommunityOperationalHint[] {
  return resolveOperationalHints({ context, place });
}
