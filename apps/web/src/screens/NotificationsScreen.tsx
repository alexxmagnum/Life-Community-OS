"use client";

import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";

/**
 * Notifications inbox — Platform Core attention surface (ADR-019).
 * Entry: header bell. Backend delivery is future; UI stays present.
 *
 * When items exist they should show: title, context, time, unread, deep link.
 * Until then: honest empty state (never fake counts or toast-only stubs).
 */
export function NotificationsScreen() {
  const router = useRouter();
  /** Future: load from NotificationProvider / Platform Core API. */
  const notifications: Array<{
    id: string;
    title: string;
    body: string;
    href?: string;
    read: boolean;
    createdAt: string;
  }> = [];

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
          {notifications.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (item.href) router.push(item.href);
                }}
                className="flex w-full flex-col rounded-[14px] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)]"
              >
                <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                  {item.title}
                </span>
                <span className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                  {item.body}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </MobileScreen>
  );
}
