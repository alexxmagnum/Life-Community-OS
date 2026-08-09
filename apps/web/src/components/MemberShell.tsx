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
  type CreateActionSection,
  type NavItem,
  type NavItemId,
} from "@life-community-os/ui";
import {
  bindProjectedNavigation,
  projectMemberNavigation,
} from "@life-community-os/tenant-life-panoramica";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";
import { BrandSplash } from "@/components/BrandSplash";

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

function IconServices() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.7 6.3a4.5 4.5 0 0 0-6.2 6.2L4 17l3 3 4.5-4.5a4.5 4.5 0 0 0 6.2-6.2l-2.4 2.4-2.6-.6-.6-2.6 2.4-2.4Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  services: boolean;
  showCreate: boolean;
}): NavItem[] {
  /** High-frequency destinations — Comunidad opens Community Hub (/community). */
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
  if (flags.services) {
    items.push({
      id: "services",
      label: "Servicios",
      href: "/services",
      icon: <IconServices />,
    });
  }
  items.push({ id: "me", label: "Perfil", href: "/me", icon: <IconProfile /> });
  return items;
}

function activeFromPath(pathname: string): NavItemId {
  if (pathname.startsWith("/services")) return "services";
  if (pathname.startsWith("/marketplace")) return "services";
  if (pathname.startsWith("/resources")) return "services";
  if (pathname.startsWith("/calendar")) return "me";
  if (pathname.startsWith("/reservations")) return "me";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/me")) return "me";
  return "home";
}

export function MemberShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    theme,
    hasCapability,
    isFeatureEnabled,
    isModuleEnabled,
    configuration,
    demoMember,
  } = useTenant();
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
  const brandLogoUrl = theme.imagery.logo;

  /** Hamburger menu — configuration-driven (D.0.3 Navigation Projector). */
  const menuCategories = useMemo((): AppMenuCategory[] => {
    const projected = projectMemberNavigation({
      configuration,
      hasCapability,
      isFeatureEnabled,
    });
    return bindProjectedNavigation(projected, {
      onNavigate: (href) => router.push(href),
      onSignOut: () => {
        setToast("Sesión demo — Cerrar sesión llega con autenticación");
        window.setTimeout(() => setToast(null), 2200);
      },
    }) as AppMenuCategory[];
  }, [configuration, hasCapability, isFeatureEnabled, router]);

  /** Contribution entry (+) — ordered by community value, not admin tools. */
  const createSections = useMemo((): CreateActionSection[] => {
    const life: CreateAction[] = [];
    const share: CreateAction[] = [];
    const practical: CreateAction[] = [];

    if (
      isModuleEnabled("experiences") &&
      hasCapability(CAPABILITIES.experienceCreate)
    ) {
      life.push({
        id: "experience",
        title: "Crear experiencia",
        description: "Organiza un paseo, clase o encuentro",
        icon: "✨",
        onSelect: () => router.push("/experiences/create"),
      });
    }

    if (
      isModuleEnabled("community") &&
      isFeatureEnabled("groups") &&
      hasCapability(CAPABILITIES.groupCreate)
    ) {
      life.push({
        id: "group",
        title: "Crear un grupo",
        description: "Intereses, deporte o vecinos con algo en común",
        icon: "👥",
        onSelect: () => showToast("El compositor de grupos llega pronto"),
      });
    }

    if (
      isModuleEnabled("community.proposals") &&
      isFeatureEnabled("decide") &&
      hasCapability(CAPABILITIES.proposalCreate)
    ) {
      life.push({
        id: "proposal",
        title: "Abrir una propuesta",
        description: "Pide a la comunidad que decida",
        icon: "💡",
        onSelect: () => showToast("El compositor de propuestas llega pronto"),
      });
    }

    if (
      isFeatureEnabled("feed") &&
      hasCapability(CAPABILITIES.contentCreate)
    ) {
      share.push({
        id: "post",
        title: "Compartir en la comunidad",
        description: "Información útil para tus vecinos",
        icon: "📢",
        onSelect: () => setPostOpen(true),
      });
    }

    if (
      isFeatureEnabled("recommendations") &&
      isFeatureEnabled("localLife") &&
      hasCapability(CAPABILITIES.recommendationCreate)
    ) {
      share.push({
        id: "tip",
        title: "Recomendar algo",
        description: "Sitios, profesionales o consejos de confianza",
        icon: "⭐",
        onSelect: () =>
          showToast("El compositor de recomendaciones llega pronto"),
      });
    }

    if (
      isModuleEnabled("services") &&
      (isFeatureEnabled("services") || isFeatureEnabled("marketplace"))
    ) {
      share.push({
        id: "neighbour-help",
        title: "Pedir u ofrecer ayuda",
        description: "Una mano entre vecinos",
        icon: "🤝",
        onSelect: () => router.push("/services/neighbour-help"),
      });
    }

    if (
      isModuleEnabled("services") &&
      (isFeatureEnabled("services") || isFeatureEnabled("localLife"))
    ) {
      share.push({
        id: "offer-service",
        title: "Ofrecer un servicio",
        description: "Publica tu oficio o servicio de confianza",
        icon: "💼",
        onSelect: () => {
          showToast("El alta de profesionales llega pronto");
          router.push("/services/professionals");
        },
      });
    }

    if (isModuleEnabled("services") && isFeatureEnabled("work")) {
      share.push({
        id: "work-post",
        title: "Publicar en Trabajo",
        description: "Busco trabajo u ofrezco un trabajo cerca",
        icon: "💼",
        onSelect: () => router.push("/services/work/create"),
      });
    }

    if (
      isModuleEnabled("marketplace") &&
      hasCapability(CAPABILITIES.marketplaceCreate)
    ) {
      practical.push({
        id: "marketplace",
        title: "Compra y venta",
        description: "Vende, regala o pide entre vecinos",
        icon: "🛒",
        onSelect: () => router.push("/marketplace"),
      });
    }

    if (
      isModuleEnabled("reservations") &&
      hasCapability(CAPABILITIES.resourceReserve)
    ) {
      practical.push({
        id: "reserve",
        title: "Reservar un espacio",
        description: "Pistas, salas y zonas compartidas",
        icon: "📅",
        onSelect: () => router.push("/resources"),
      });
    }

    if (
      isFeatureEnabled("incidents") &&
      hasCapability(CAPABILITIES.incidentCreate)
    ) {
      practical.push({
        id: "report",
        title: "Avisar de un problema",
        description: "Haz una foto y cuéntanos",
        icon: "⚠️",
        onSelect: () => router.push("/report"),
      });
    }

    if (
      isFeatureEnabled("feed") &&
      hasCapability(CAPABILITIES.announcementPublishOfficial)
    ) {
      practical.push({
        id: "official",
        title: "Aviso oficial",
        description: "Comunicado de la administración",
        icon: "⚑",
        onSelect: () => showToast("La publicación oficial llega pronto"),
      });
    }

    const sections: CreateActionSection[] = [];
    if (life.length) {
      sections.push({
        id: "life",
        title: "Crear vida de comunidad",
        actions: life,
      });
    }
    if (share.length) {
      sections.push({ id: "share", title: "Compartir valor", actions: share });
    }
    if (practical.length) {
      sections.push({
        id: "practical",
        title: "Acciones prácticas",
        actions: practical,
      });
    }
    return sections;
  }, [hasCapability, isFeatureEnabled, isModuleEnabled, router]);

  const createActionCount = createSections.reduce(
    (n, s) => n + s.actions.length,
    0,
  );

  const navItems = useMemo(
    () =>
      buildNav({
        services: isModuleEnabled("services"),
        showCreate: createActionCount > 0,
      }),
    [createActionCount, isModuleEnabled],
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
      <BrandSplash />
      <AppShell
        brandName={brandName}
        brandLogoUrl={brandLogoUrl}
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
            brandLogoUrl={brandLogoUrl}
            onBrandClick={() => router.push("/")}
            onMenuOpen={() => setMenuOpen(true)}
            menuLabel="Explorar comunidad"
            notificationCount={3}
            onNotifications={() =>
              showToast("Las notificaciones llegan pronto")
            }
            profileImageUrl={demoMember.avatarUrl}
            profileName={demoMember.displayName}
            profileLabel="Mi perfil"
            onProfileClick={() => router.push("/me")}
          />
        }
      >
        {children}
      </AppShell>
      <AppMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        brandName={brandName}
        brandLogoUrl={brandLogoUrl}
        categories={menuCategories}
        searchPlaceholder={`Buscar en ${brandName}`}
      />
      <CreateSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        sections={createSections}
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
