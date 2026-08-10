/**
 * Platform Core Notifications spine (ADR-019 / Phase 2.2).
 *
 * Domain action → event → resolve recipients → Notification → delivery channels.
 */

export type {
  NotificationStatus,
  NotificationCategory,
  NotificationContextRef,
  Notification,
} from "./notification";
export {
  NOTIFICATION_STATUSES,
  NOTIFICATION_CATEGORIES,
  isNotificationStatus,
  isNotificationCategory,
  markNotificationRead,
  markNotificationArchived,
  isNotificationUnread,
} from "./notification";

export type {
  NotificationEventType,
  NotificationRecipientSelector,
  NotificationEvent,
} from "./notification-events";
export {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_EVENT_CATEGORY,
  isNotificationEventType,
  categoryForNotificationEvent,
} from "./notification-events";

export type {
  NotificationRecipientResolver,
  NotificationFactory,
  NotificationInboxPort,
  NotificationDeliveryPort,
} from "./notification-ports";
export {
  createEmptyNotificationInboxPort,
  createNoopNotificationRecipientResolver,
  createNoopNotificationDeliveryPort,
} from "./notification-ports";
