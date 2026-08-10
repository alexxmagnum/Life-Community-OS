/**
 * Communication event contracts (ADR-019 readiness / Phase 2.1).
 *
 * Domain actions may publish these events.
 * Notification delivery is Platform Core responsibility — not implemented here.
 * No tenant names. No fake unread UI.
 */

import type { DomainId } from "../../domain/ids";
import type { ConversationContextType } from "./conversation-context";

export const COMMUNICATION_EVENT_TYPES = [
  "conversation_created",
  "message_received",
  "context_updated",
] as const;

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
