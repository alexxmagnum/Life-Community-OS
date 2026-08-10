"use client";

import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  NotificationInboxItem,
} from "@life-community-os/ui";
import { isNotificationUnread } from "@life-community-os/types";
import { hrefForNotificationContext } from "@/lib/notification-href";
import { useNotifications } from "@/providers/NotificationProvider";

/**
 * Notifications inbox — Platform attention surface (ADR-019 / Phase 2.2).
 *
 * Empty by default (no fake activity). When items exist: why / what / next action.
 */
export function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markRead } = useNotifications();

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Notificaciones"
        subtitle="Lo que necesita tu atención."
        onBack={() => router.back()}
        onExit={() => router.push("/")}
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="No tienes notificaciones todavía"
          description="Aquí aparecerán avisos de reservas, experiencias, mensajes y novedades de tu comunidad cuando haya algo que requiera tu atención."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((item) => {
            const href = hrefForNotificationContext(item.context);
            return (
              <li key={item.id}>
                <NotificationInboxItem
                  title={item.title}
                  body={item.body}
                  unread={isNotificationUnread(item)}
                  onClick={() => {
                    markRead(item.id);
                    if (href) router.push(href);
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </MobileScreen>
  );
}
