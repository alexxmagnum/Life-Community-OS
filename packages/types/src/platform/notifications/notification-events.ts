/**
 * Platform notification event catalog + producer contract (ADR-019 / Phase 2.2).
 *
 * Domain action → Domain/Notification event → Resolver → Notification → Delivery.
 * Do not invent fake producers here — contracts only.
 */

import type { DomainId } from "../../domain/ids";
import type { NotificationCategory } from "./notification";

/**
 * Initial generic event catalog.
 * Communication events from Phase 2.1 are included for a single spine.
 */
export const NOTIFICATION_EVENT_TYPES = [
  // Communication
  "conversation_created",
  "message_received",
  "context_updated",
  // Marketplace
  "listing_interest_created",
  // Experience
  "experience_updated",
  "experience_reminder",
  "experience_joined",
  "experience_invited",
  "event_joined",
  "group_member_added",
  "help_response",
  // Reservation
  "reservation_created",
  "reservation_cancelled",
  // Official
  "announcement_published",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export const NOTIFICATION_EVENT_CATEGORY: Record<
  NotificationEventType,
  NotificationCategory
> = {
  conversation_created: "communication",
  message_received: "communication",
  context_updated: "communication",
  listing_interest_created: "marketplace",
  experience_updated: "experience",
  experience_reminder: "experience",
  experience_joined: "experience",
  experience_invited: "experience",
  event_joined: "experience",
  group_member_added: "communication",
  help_response: "communication",
  reservation_created: "reservation",
  reservation_cancelled: "reservation",
  announcement_published: "official",
};

/**
 * Recipient addressing — Core resolves under Tenant Context.
 * Never invent recipients outside the tenant.
 */
export type NotificationRecipientSelector =
  | { kind: "explicit_persons"; personIds: readonly DomainId[] }
  | { kind: "conversation_participants"; conversationId: DomainId }
  | {
      kind: "context_audience";
      contextType: string;
      contextId: DomainId;
    };

/**
 * Producer event published by a domain/microapp after an authorized action.
 */
export type NotificationEvent = {
  id: DomainId;
  type: NotificationEventType;
  tenantId: DomainId;
  actorPersonId?: DomainId;
  /** Prefer selector; explicit list may also be provided. */
  recipientSelector?: NotificationRecipientSelector;
  recipientPersonIds?: readonly DomainId[];
  contextType?: string;
  contextId?: DomainId;
  moduleId?: string;
  /** Opaque domain payload references — not cross-tenant blobs. */
  payload?: Readonly<Record<string, string | number | boolean | null>>;
  createdAt: string;
};

export function isNotificationEventType(
  value: string,
): value is NotificationEventType {
  return (NOTIFICATION_EVENT_TYPES as readonly string[]).includes(value);
}

export function categoryForNotificationEvent(
  type: NotificationEventType,
): NotificationCategory {
  return NOTIFICATION_EVENT_CATEGORY[type];
}
