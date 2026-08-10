"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Notification } from "@life-community-os/types";
import {
  createEmptyNotificationInboxPort,
  createNoopNotificationDeliveryPort,
  createNoopNotificationRecipientResolver,
  type NotificationDeliveryPort,
  type NotificationInboxPort,
  type NotificationRecipientResolver,
} from "@life-community-os/types";
import { useTenant } from "@/providers/TenantProvider";

/**
 * In-app Notification spine shell (ADR-019 / Phase 2.2).
 *
 * Uses Platform Core empty inbox port — never seeds fake notifications.
 * Ready to swap createEmptyNotificationInboxPort for a Platform API client.
 */

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  markRead: (notificationId: string) => void;
  archive: (notificationId: string) => void;
  inbox: NotificationInboxPort;
  resolver: NotificationRecipientResolver;
  delivery: NotificationDeliveryPort;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { demoMember, configuration } = useTenant();

  const inbox = useMemo(() => createEmptyNotificationInboxPort(), []);
  const resolver = useMemo(
    () => createNoopNotificationRecipientResolver(),
    [],
  );
  const delivery = useMemo(() => createNoopNotificationDeliveryPort(), []);

  const tenantId = configuration.tenantId;
  const recipientPersonId = demoMember.personId;

  const notifications = useMemo(
    () =>
      inbox.listForRecipient({
        tenantId,
        recipientPersonId,
      }),
    [inbox, recipientPersonId, tenantId],
  );

  const unreadCount = useMemo(
    () =>
      inbox.unreadCount({
        tenantId,
        recipientPersonId,
      }),
    [inbox, recipientPersonId, tenantId],
  );

  const markRead = useCallback(
    (notificationId: string) => {
      inbox.markRead({
        tenantId,
        recipientPersonId,
        notificationId,
      });
    },
    [inbox, recipientPersonId, tenantId],
  );

  const archive = useCallback(
    (notificationId: string) => {
      inbox.archive({
        tenantId,
        recipientPersonId,
        notificationId,
      });
    },
    [inbox, recipientPersonId, tenantId],
  );

  const value = useMemo(
    (): NotificationContextValue => ({
      notifications,
      unreadCount,
      markRead,
      archive,
      inbox,
      resolver,
      delivery,
    }),
    [
      archive,
      delivery,
      inbox,
      markRead,
      notifications,
      resolver,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
