"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  CreatePostSheet,
  CreateSheet,
  type CreateAction,
  type NavItem,
  type NavItemId,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";

const navItems: NavItem[] = [
  { id: "home", label: "Inicio", href: "/", icon: "⌂" },
  { id: "discover", label: "Descubrir", href: "/discover", icon: "◎" },
  { id: "calendar", label: "Agenda", href: "/calendar", icon: "▦" },
  { id: "community", label: "Comunidad", href: "/community", icon: "◌" },
  { id: "me", label: "Yo", href: "/me", icon: "☺" },
];

function activeFromPath(pathname: string): NavItemId {
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/resources")) return "discover";
  if (pathname.startsWith("/reservations")) return "me";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/me")) return "me";
  if (pathname.startsWith("/experiences")) return "discover";
  return "home";
}

export function MemberShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, hasCapability, isFeatureEnabled } = useTenant();
  const { createPublication } = useCommunityInteractions();
  const [createOpen, setCreateOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const createActions = useMemo(() => {
    const actions: CreateAction[] = [];

    if (
      isFeatureEnabled("experiences") &&
      hasCapability(CAPABILITIES.experienceCreate)
    ) {
      actions.push({
        id: "experience",
        title: "Crear actividad",
        description: "Organiza un paseo, clase o encuentro",
        icon: "✦",
        onSelect: () => showToast("El compositor de actividades llega pronto"),
      });
    }

    if (
      isFeatureEnabled("feed") &&
      hasCapability(CAPABILITIES.contentCreate)
    ) {
      actions.push({
        id: "post",
        title: "Compartir una actualización",
        description: "Publica para tus vecinos",
        icon: "✎",
        onSelect: () => setPostOpen(true),
      });
    }

    if (
      isFeatureEnabled("incidents") &&
      hasCapability(CAPABILITIES.incidentCreate)
    ) {
      actions.push({
        id: "report",
        title: "Avisar de un problema",
        description: "Haz una foto y cuéntanos",
        icon: "📷",
        onSelect: () => router.push("/report"),
      });
    }

    if (
      isFeatureEnabled("decide") &&
      hasCapability(CAPABILITIES.proposalCreate)
    ) {
      actions.push({
        id: "proposal",
        title: "Abrir una propuesta",
        description: "Pide a la comunidad que decida",
        icon: "◈",
        onSelect: () => showToast("El compositor de propuestas llega pronto"),
      });
    }

    if (
      isFeatureEnabled("resources") &&
      hasCapability(CAPABILITIES.resourceReserve)
    ) {
      actions.push({
        id: "reserve",
        title: "Reservar un espacio",
        description: "Pistas, salas y zonas compartidas",
        icon: "▣",
        onSelect: () => router.push("/resources"),
      });
    }

    if (
      isFeatureEnabled("recommendations") &&
      hasCapability(CAPABILITIES.recommendationCreate)
    ) {
      actions.push({
        id: "tip",
        title: "Recomendar algo",
        description: "Un consejo local para vecinos",
        icon: "★",
        onSelect: () => showToast("El compositor de recomendaciones llega pronto"),
      });
    }

    if (
      isFeatureEnabled("feed") &&
      hasCapability(CAPABILITIES.announcementPublishOfficial)
    ) {
      actions.push({
        id: "official",
        title: "Aviso oficial",
        description: "Comunicado de la comunidad",
        icon: "⚑",
        onSelect: () => showToast("La publicación oficial llega pronto"),
      });
    }

    return actions;
  }, [hasCapability, isFeatureEnabled, router]);

  return (
    <>
      <AppShell
        brandName={theme.logoText}
        items={navItems}
        activeId={activeFromPath(pathname)}
        onNavigate={(item) => router.push(item.href)}
        onCreate={() => setCreateOpen(true)}
        showCreateFab={createActions.length > 0}
      >
        {children}
      </AppShell>
      <CreateSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        actions={createActions}
      />
      <CreatePostSheet
        open={postOpen}
        onClose={() => setPostOpen(false)}
        onSubmit={(input) => {
          const created = createPublication(input);
          if (created) {
            showToast("Publicado en Comunidad");
            router.push(`/community/content/${created.id}`);
          }
        }}
      />
      {toast ? (
        <div
          className="fixed bottom-28 left-1/2 z-[60] max-w-sm -translate-x-1/2 rounded-[var(--radius-md)] bg-[var(--color-text-primary)] px-4 py-3 text-center text-[15px] text-[var(--color-text-inverse)] shadow-[var(--shadow-elev-2)] md:bottom-10"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
