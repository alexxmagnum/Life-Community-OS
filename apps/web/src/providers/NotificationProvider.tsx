"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
import type { CommunityNotificationRecord } from "@life-community-os/types";
import { useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { fetchCommunityNotifications } from "@/lib/community/community-client";

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

function toInboxItem(
  item: CommunityNotificationRecord,
): Notification {
  return {
    id: item.id,
    tenantId: item.tenantId,
    recipientPersonId: item.recipientPersonId,
    category:
      item.kind === "official_alert"
        ? "official"
        : item.kind === "event_created" ||
            item.kind === "experience_published" ||
            item.kind === "experience_joined" ||
            item.kind === "experience_invited" ||
            item.kind === "event_joined"
          ? "experience"
          : "communication",
    eventType: item.kind,
    title: item.title,
    body: item.body,
    status: item.readAt ? "read" : "unread",
    createdAt: item.createdAt,
    readAt: item.readAt,
    context: item.entityId
      ? {
          contextType: item.entityType ?? "post",
          contextId: item.entityId,
        }
      : undefined,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { tenantSlug, hasMembership } = useTenant();
  const { currentUser } = useCurrentUser();
  const [records, setRecords] = useState<CommunityNotificationRecord[]>([]);

  const inbox = useMemo(() => createEmptyNotificationInboxPort(), []);
  const resolver = useMemo(
    () => createNoopNotificationRecipientResolver(),
    [],
  );
  const delivery = useMemo(() => createNoopNotificationDeliveryPort(), []);

  useEffect(() => {
    let cancelled = false;
    if (!hasMembership || !currentUser.personId) {
      setRecords([]);
      return;
    }
    void (async () => {
      const data = await fetchCommunityNotifications(tenantSlug);
      if (cancelled) return;
      setRecords((data.notifications as CommunityNotificationRecord[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasMembership, currentUser.personId, tenantSlug]);

  const notifications = useMemo(
    () => records.map(toInboxItem),
    [records],
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.status === "unread").length,
    [notifications],
  );

  const markRead = useCallback((notificationId: string) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
    );
    void fetch("/api/community/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
      },
      body: JSON.stringify({ notificationId }),
    });
  }, [tenantSlug]);

  const archive = useCallback((notificationId: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== notificationId));
  }, []);

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
