/**
 * Recipient resolution + inbox ports (ADR-019 / Phase 2.2).
 *
 * Concepts only — no push/email/WhatsApp sending, no fake inbox data.
 */

import type { DomainId } from "../../domain/ids";
import type { Notification } from "./notification";
import type { NotificationEvent } from "./notification-events";
import type { DeliveryChannelKind } from "../communication/delivery-channels";

/**
 * Resolves NotificationEvent → recipient Person ids under Tenant Context.
 * Fail closed: unknown audience → empty list.
 */
export type NotificationRecipientResolver = {
  resolve(event: NotificationEvent): readonly DomainId[];
};

/**
 * Builds in-app Notification records from an event + resolved recipients.
 * Display title/body resolution may be injected by product layer later.
 */
export type NotificationFactory = {
  createFromEvent(
    event: NotificationEvent,
    recipientPersonIds: readonly DomainId[],
  ): Notification[];
};

/** Inbox query / mutation port for in-app delivery. */
export type NotificationInboxPort = {
  listForRecipient(input: {
    tenantId: DomainId;
    recipientPersonId: DomainId;
  }): Notification[];
  unreadCount(input: {
    tenantId: DomainId;
    recipientPersonId: DomainId;
  }): number;
  markRead(input: {
    tenantId: DomainId;
    recipientPersonId: DomainId;
    notificationId: DomainId;
  }): Notification | null;
  archive(input: {
    tenantId: DomainId;
    recipientPersonId: DomainId;
    notificationId: DomainId;
  }): Notification | null;
};

/**
 * Future delivery orchestration port.
 * Channels: in_app | push | email | sms | whatsapp
 * WhatsApp is a delivery adapter only — never the communication model.
 */
export type NotificationDeliveryPort = {
  enqueue(input: {
    notification: Notification;
    channels: readonly DeliveryChannelKind[];
  }): void;
};

/** Empty inbox — honest foundation until Platform service exists. */
export function createEmptyNotificationInboxPort(): NotificationInboxPort {
  return {
    listForRecipient() {
      return [];
    },
    unreadCount() {
      return 0;
    },
    markRead() {
      return null;
    },
    archive() {
      return null;
    },
  };
}

/** Fail-closed resolver — no invented recipients. */
export function createNoopNotificationRecipientResolver(): NotificationRecipientResolver {
  return {
    resolve(event) {
      if (event.recipientPersonIds?.length) {
        return [...event.recipientPersonIds];
      }
      if (
        event.recipientSelector?.kind === "explicit_persons" &&
        event.recipientSelector.personIds.length
      ) {
        return [...event.recipientSelector.personIds];
      }
      return [];
    },
  };
}

/** No-op delivery — prepares channel architecture without sending. */
export function createNoopNotificationDeliveryPort(): NotificationDeliveryPort {
  return {
    enqueue() {
      /* intentionally empty — no push/email/WhatsApp in this phase */
    },
  };
}
