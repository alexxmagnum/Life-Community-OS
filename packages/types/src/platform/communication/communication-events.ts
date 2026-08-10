/**
 * Communication event contracts (ADR-019 readiness / Phase 2.1 + 2.2).
 *
 * Subset of the Platform Notification event catalog focused on Conversation.
 * Prefer NOTIFICATION_EVENT_TYPES for the full attention spine.
 * Notification delivery is Platform Core — not implemented as producers here.
 */

import type { DomainId } from "../../domain/ids";
import type { ConversationContextType } from "./conversation-context";
import {
  NOTIFICATION_EVENT_TYPES,
  type NotificationEventType,
} from "../notifications/notification-events";

/** @deprecated Prefer NotificationEventType — kept for Conversation-focused imports. */
export const COMMUNICATION_EVENT_TYPES = [
  "conversation_created",
  "message_received",
  "context_updated",
] as const satisfies readonly NotificationEventType[];

export type CommunicationEventType = (typeof COMMUNICATION_EVENT_TYPES)[number];

export type CommunicationEvent = {
  type: CommunicationEventType;
  tenantId: DomainId;
  conversationId: DomainId;
  contextType: ConversationContextType;
  contextId: DomainId;
  /** Person who triggered the event when known. */
  actorPersonId?: DomainId;
  occurredAt: string;
  /** Optional Message id for message_received. */
  messageId?: DomainId;
};

export type CommunicationEventPublisher = {
  publish(event: CommunicationEvent): void;
};

/** Fail-safe publisher for environments without Notification delivery yet. */
export function createNoopCommunicationEventPublisher(): CommunicationEventPublisher {
  return {
    publish() {
      /* intentionally empty — ready for NotificationProvider wiring */
    },
  };
}

export function isCommunicationEventType(
  value: string,
): value is CommunicationEventType {
  return (COMMUNICATION_EVENT_TYPES as readonly string[]).includes(value);
}

/** Assert communication events remain inside the notification catalog. */
export function assertCommunicationEventsInNotificationCatalog(): boolean {
  return COMMUNICATION_EVENT_TYPES.every((t) =>
    (NOTIFICATION_EVENT_TYPES as readonly string[]).includes(t),
  );
}
