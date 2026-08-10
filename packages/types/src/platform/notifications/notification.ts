/**
 * Platform Core Notification model (ADR-019 / Phase 2.2).
 *
 * Notifications = important events that require user attention.
 * Not chat. Not a social feed. Not WhatsApp.
 * Tenant-agnostic — no Panoramica names, demo users, or tenant routes.
 */

import type { DomainId } from "../../domain/ids";

export const NOTIFICATION_STATUSES = ["unread", "read", "archived"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_CATEGORIES = [
  "communication",
  "marketplace",
  "experience",
  "reservation",
  "official",
  "system",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/**
 * Deep-link context for in-app navigation.
 * Apps resolve href from context — Core does not store tenant route strings as law.
 */
export type NotificationContextRef = {
  contextType: string;
  contextId: DomainId;
  moduleId?: string;
};

/**
 * In-app Notification item (system-generated attention record).
 * title/body are resolved display strings for the inbox surface.
 */
export type Notification = {
  id: DomainId;
  tenantId: DomainId;
  recipientPersonId: DomainId;
  category: NotificationCategory;
  /** Catalog event that produced this notification. */
  eventType: string;
  title: string;
  body: string;
  status: NotificationStatus;
  context?: NotificationContextRef;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
};

export function isNotificationStatus(
  value: string,
): value is NotificationStatus {
  return (NOTIFICATION_STATUSES as readonly string[]).includes(value);
}

export function isNotificationCategory(
  value: string,
): value is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

/** Minimal lifecycle transitions. */
export function markNotificationRead(
  notification: Notification,
  readAt: string = new Date().toISOString(),
): Notification {
  if (notification.status === "archived") return notification;
  return {
    ...notification,
    status: "read",
    readAt: notification.readAt ?? readAt,
  };
}

export function markNotificationArchived(
  notification: Notification,
  archivedAt: string = new Date().toISOString(),
): Notification {
  return {
    ...notification,
    status: "archived",
    archivedAt,
    readAt: notification.readAt ?? archivedAt,
  };
}

export function isNotificationUnread(notification: Notification): boolean {
  return notification.status === "unread";
}
