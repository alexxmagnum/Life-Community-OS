"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  AppMenuSheet,
  CommunityAppHeader,
  CreatePostSheet,
  CreateSheet,
  type AppMenuCategory,
  type CreateAction,
  type NavItem,
  type NavItemId,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.2 3.5 10.4a1 1 0 0 0-.3.7V20a1.2 1.2 0 0 0 1.2 1.2h5.1V15.2h5V21.2h5.1A1.2 1.2 0 0 0 20.8 20v-8.9a1 1 0 0 0-.3-.7L12 3.2Z" />
    </svg>
  );
}

function IconCommunity() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.5 19c.8-2.8 2.9-4 5.5-4s4.7 1.2 5.5 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M14 15.2c1.4-.5 2.9-.3 4.2.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDiscover() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m14.5 9.5-1.2 4.3-4.3 1.2 1.2-4.3 4.3-1.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMarket() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7h13l-1.4 8.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.7L6 4H3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5 19.5c1.2-3 3.5-4.5 7-4.5s5.8 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildNav(flags: {
  marketplace: boolean;
  showCreate: boolean;
}): NavItem[] {
  const items: NavItem[] = [
    { id: "home", label: "Inicio", href: "/", icon: <IconHome /> },
    {
      id: "community",
      label: "Comunidad",
      href: "/community",
      icon: <IconCommunity />,
    },
  ];
  if (flags.showCreate) {
    items.push({ id: "create", label: "Crear", href: "#create", icon: "+" });
  }
  items.push({
    id: "discover",
    label: "Descubrir",
    href: "/discover",
    icon: <IconDiscover />,
  });
  if (flags.marketplace) {
    items.push({
      id: "marketplace",
      label: "Mercado",
      href: "/marketplace",
      icon: <IconMarket />,
    });
  }
  items.push({ id: "me", label: "Perfil", href: "/me", icon: <IconProfile /> });
  return items;
}

function activeFromPath(pathname: string): NavItemId {
  if (pathname.startsWith("/marketplace")) return "marketplace";
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/resources")) return "discover";
  if (pathname.startsWith("/experiences")) return "discover";
  if (pathname.startsWith("/calendar")) return "me";
  if (pathname.startsWith("/reservations")) return "me";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/me")) return "me";
  return "home";
}

export function MemberShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, hasCapability, isFeatureEnabled } = useTenant();
  const { createPublication } = useCommunityInteractions();
  const [createOpen, setCreateOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const brandName = theme.logoText;

  const menuCategories = useMemo((): AppMenuCategory[] => {
    const go = (href: string) => () => router.push(href);

    return [
      {
        id: "community",
        tone: "community",
        label: "Comunidad",
        description: "La vida de nuestros vecinos",
        children: [
          { id: "c-info", label: "Información general", icon: "info", onSelect: go("/community") },
          { id: "c-zone", label: "Mi zona", icon: "pin", onSelect: go("/community") },
          { id: "c-neighbours", label: "Vecinos", icon: "people", onSelect: go("/community") },
          { id: "c-families", label: "Familias", icon: "family", onSelect: go("/community") },
          { id: "c-help", label: "Ayuda entre vecinos", icon: "help", onSelect: go("/community") },
          { id: "c-proposals", label: "Propuestas comunitarias", icon: "proposal", onSelect: go("/community") },
        ],
      },
      {
        id: "activities",
        tone: "activities",
        label: "Actividades",
        description: "Deportes, clases y experiencias",
        children: [
          { id: "a-padel", label: "Pádel", icon: "padel", onSelect: go("/resources") },
          { id: "a-tennis", label: "Tenis", icon: "tennis", onSelect: go("/resources") },
          { id: "a-golf", label: "Golf", icon: "golf", onSelect: go("/discover") },
          { id: "a-hike", label: "Senderismo", icon: "hike", onSelect: go("/discover") },
          { id: "a-class", label: "Clases y talleres", icon: "class", onSelect: go("/discover") },
          { id: "a-games", label: "Juegos y vida social", icon: "games", onSelect: go("/discover") },
          { id: "a-events", label: "Eventos y torneos", icon: "trophy", onSelect: go("/discover") },
        ],
      },
      {
        id: "exchange",
        tone: "exchange",
        label: "Intercambio",
        description: "Compra, vende y comparte",
        children: [
          {
            id: "e-market",
            label: "Compra y venta",
            icon: "cart",
            onSelect: go(
              isFeatureEnabled("marketplace") ? "/marketplace" : "/discover",
            ),
          },
          { id: "e-services", label: "Servicios entre vecinos", icon: "handshake", onSelect: go("/discover") },
          { id: "e-pro", label: "Profesionales", icon: "briefcase", onSelect: go("/discover") },
          { id: "e-car", label: "Compartir coche", icon: "car", onSelect: go("/discover") },
        ],
      },
      {
        id: "local",
        tone: "local",
        label: "Vida local",
        description: "Todo lo que necesitas cerca",
        children: [
          { id: "l-food", label: "Restaurantes y bares", icon: "restaurant", onSelect: go("/discover") },
          { id: "l-shops", label: "Comercios", icon: "shop", onSelect: go("/discover") },
          { id: "l-pharma", label: "Farmacia y salud", icon: "pharmacy", onSelect: go("/discover") },
          { id: "l-near", label: "Servicios cercanos", icon: "service", onSelect: go("/discover") },
          { id: "l-places", label: "Lugares de interés", icon: "place", onSelect: go("/discover") },
        ],
      },
      {
        id: "events",
        tone: "events",
        label: "Eventos",
        description: "Lo que ocurre en Panorámica",
        children: [
          { id: "ev-next", label: "Próximos eventos", icon: "calendar", onSelect: go("/discover") },
          { id: "ev-kids", label: "Eventos infantiles", icon: "child", onSelect: go("/discover") },
          { id: "ev-sport", label: "Eventos deportivos", icon: "sport", onSelect: go("/discover") },
          { id: "ev-culture", label: "Eventos culturales", icon: "culture", onSelect: go("/calendar") },
          { id: "ev-party", label: "Fiestas y celebraciones", icon: "party", onSelect: go("/discover") },
        ],
      },
      {
        id: "official",
        tone: "official",
        label: "Oficial",
        description: "Canales oficiales y servicios",
        children: [
          { id: "o-admin", label: "Administración Panorámica", icon: "admin", onSelect: go("/community") },
          { id: "o-city", label: "Ayuntamiento", icon: "city", onSelect: go("/community") },
          { id: "o-security", label: "Seguridad", icon: "security", onSelect: go("/community") },
          { id: "o-works", label: "Mantenimiento y obras", icon: "works", onSelect: go("/community") },
          { id: "o-public", label: "Servicios públicos", icon: "public", onSelect: go("/community") },
        ],
      },
    ];
  }, [isFeatureEnabled, router]);

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
        title: "Compartir en la comunidad",
        description: "Aviso útil para tus vecinos",
        icon: "✎",
        onSelect: () => setPostOpen(true),
      });
    }

    if (
      isFeatureEnabled("marketplace") &&
      hasCapability(CAPABILITIES.marketplaceCreate)
    ) {
      actions.push({
        id: "marketplace",
        title: "Publicar en el mercado",
        description: "Vende, regala o pide entre vecinos",
        icon: "⇄",
        onSelect: () => {
          showToast("El anuncio llega pronto — mira el mercado");
          router.push("/marketplace");
        },
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
        icon: "◌",
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
      isFeatureEnabled("localLife") &&
      hasCapability(CAPABILITIES.recommendationCreate)
    ) {
      actions.push({
        id: "tip",
        title: "Recomendar algo",
        description: "Un consejo local de confianza",
        icon: "★",
        onSelect: () =>
          showToast("El compositor de recomendaciones llega pronto"),
      });
    }

    if (
      isFeatureEnabled("groups") &&
      hasCapability(CAPABILITIES.groupCreate)
    ) {
      actions.push({
        id: "group",
        title: "Crear un grupo",
        description: "Paseos, deporte, familias…",
        icon: "◎",
        onSelect: () => showToast("El compositor de grupos llega pronto"),
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

  const navItems = useMemo(
    () =>
      buildNav({
        marketplace: isFeatureEnabled("marketplace"),
        showCreate: createActions.length > 0,
      }),
    [createActions.length, isFeatureEnabled],
  );

  useEffect(() => {
    const openCreate = () => setCreateOpen(true);
    window.addEventListener("lcos:open-create", openCreate);
    return () => window.removeEventListener("lcos:open-create", openCreate);
  }, []);

  useEffect(() => {
    for (const item of navItems) {
      if (item.id === "create") continue;
      router.prefetch(item.href);
    }
  }, [navItems, router]);

  return (
    <>
      <AppShell
        brandName={brandName}
        items={navItems}
        activeId={activeFromPath(pathname)}
        onNavigate={(item) => {
          if (item.id === "create") {
            setCreateOpen(true);
            return;
          }
          router.push(item.href);
        }}
        onCreate={() => setCreateOpen(true)}
        showCreateFab={false}
        header={
          <CommunityAppHeader
            brandName={brandName}
            onBrandClick={() => router.push("/")}
            onMenuOpen={() => setMenuOpen(true)}
            notificationCount={3}
            onNotifications={() =>
              showToast("Las notificaciones llegan pronto")
            }
          />
        }
      >
        {children}
      </AppShell>
      <AppMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        brandName={brandName}
        categories={menuCategories}
        searchPlaceholder={`Buscar en ${brandName}`}
        profileLabel="Mi perfil"
        onProfileSelect={() => router.push("/me")}
      />
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
