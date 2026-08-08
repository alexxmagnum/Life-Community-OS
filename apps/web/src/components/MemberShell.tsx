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
import {
  listExplorerActivities,
  listVisibleOfficialEntities,
  officialEntityNavIcon,
  officialEntityNavLabel,
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
  if (pathname.startsWith("/services")) return "discover";
  if (pathname.startsWith("/near")) return "discover";
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
  const { theme, hasCapability, isFeatureEnabled, demoMember } = useTenant();
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

  const menuCategories = useMemo((): AppMenuCategory[] => {
    const go = (href: string) => () => router.push(href);
    const soon = (message: string) => () => {
      setToast(message);
      window.setTimeout(() => setToast(null), 2200);
    };
    const categories: AppMenuCategory[] = [];

    // 1. Comunidad — communication, participation, coexistence
    categories.push({
      id: "community",
      tone: "community",
      glyph: "🏡",
      label: "Comunidad",
      description: "Comunicación y participación vecinal",
      children: [
        {
          id: "c-news",
          label: "Actualidad",
          icon: "info",
          onSelect: go("/community?tab=conversaciones"),
        },
        {
          id: "c-proposals",
          label: "Propuestas",
          icon: "proposal",
          onSelect: go("/community?tab=propuestas"),
        },
        ...(isFeatureEnabled("decide")
          ? [
              {
                id: "c-participation",
                label: "Participación",
                icon: "help" as const,
                // Same surface as propuestas until a dedicated polls tab exists (Phase B).
                onSelect: go("/community?tab=propuestas"),
              },
            ]
          : []),
        ...(isFeatureEnabled("communityChannels")
          ? [
              {
                id: "c-spaces",
                label: "Espacios comunitarios",
                icon: "people" as const,
                onSelect: go("/community?tab=canales"),
              },
            ]
          : []),
        {
          id: "c-pets",
          label: "Mascotas",
          icon: "family",
          // Dedicated pets surface is Phase B — keep real Comunidad route (not a fake page).
          onSelect: go("/community?tab=conversaciones"),
        },
      ],
    });

    // 2. Actividades — permanent interests (tenant-ordered)
    if (isFeatureEnabled("activities") || isFeatureEnabled("experiences")) {
      categories.push({
        id: "activities",
        tone: "activities",
        glyph: "🎯",
        label: "Actividades",
        description: "Intereses permanentes de la comunidad",
        children: listExplorerActivities().map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          onSelect: go(item.href),
        })),
      });
    }

    // 3. Experiencias — temporary moments
    if (isFeatureEnabled("experiences")) {
      categories.push({
        id: "experiences",
        tone: "experiences",
        glyph: "✨",
        label: "Experiencias",
        description: "Momentos para crear y unirte",
        children: [
          {
            id: "exp-upcoming",
            label: "Próximas experiencias",
            icon: "calendar",
            onSelect: go("/experiences"),
          },
          ...(hasCapability(CAPABILITIES.experienceCreate)
            ? [
                {
                  id: "exp-create",
                  label: "Crear experiencia",
                  icon: "proposal" as const,
                  onSelect: go("/experiences/create"),
                },
              ]
            : []),
        ],
      });
    }

    // 4. Reservas — physical resources
    if (isFeatureEnabled("resources")) {
      categories.push({
        id: "reservations",
        tone: "reservations",
        glyph: "📅",
        label: "Reservas",
        description: "Qué puedes usar y cuándo está libre",
        children: [
          {
            id: "res-sports",
            label: "Instalaciones deportivas",
            icon: "sport",
            onSelect: go("/resources"),
          },
          {
            id: "res-common",
            label: "Espacios comunes",
            icon: "place",
            onSelect: go("/resources"),
          },
        ],
      });
    }

    // 5. Servicios — "I need something solved" (not a directory)
    {
      const serviceChildren: AppMenuCategory["children"] = [];
      if (isFeatureEnabled("services") || isFeatureEnabled("localLife")) {
        serviceChildren.push({
          id: "svc-pro",
          label: "Profesionales",
          icon: "briefcase",
          onSelect: go("/services/professionals"),
        });
      }
      if (isFeatureEnabled("services") || isFeatureEnabled("marketplace")) {
        serviceChildren.push({
          id: "svc-neighbour",
          label: "Ayuda entre vecinos",
          icon: "handshake",
          onSelect: go("/services/neighbour-help"),
        });
      }
      if (isFeatureEnabled("mobility")) {
        serviceChildren.push({
          id: "svc-mobility",
          label: "Movilidad",
          icon: "car",
          onSelect: go("/services/mobility"),
        });
      }
      if (
        isFeatureEnabled("marketplace") &&
        hasCapability(CAPABILITIES.marketplaceView)
      ) {
        serviceChildren.push({
          id: "svc-market",
          label: "Compra y venta",
          icon: "cart",
          onSelect: go("/marketplace"),
        });
      }
      if (isFeatureEnabled("recommendations")) {
        serviceChildren.push({
          id: "svc-reco",
          label: "Recomendaciones",
          icon: "culture",
          onSelect: go("/services/recommendations"),
        });
      }
      if (serviceChildren.length > 0) {
        categories.push({
          id: "services",
          tone: "exchange",
          glyph: "🛠",
          label: "Servicios",
          description: "Ayuda, profesionales y soluciones cercanas",
          children: serviceChildren,
        });
      }
    }

    // 6. Cerca de ti — "What exists around me?" (LocalEntity)
    if (
      (isFeatureEnabled("localLife") || isFeatureEnabled("localEntities")) &&
      hasCapability(CAPABILITIES.localView)
    ) {
      categories.push({
        id: "near",
        tone: "local",
        glyph: "📍",
        label: "Cerca de ti",
        description: "Lo que hay alrededor",
        children: [
          {
            id: "near-food",
            label: "Restaurantes",
            icon: "restaurant",
            onSelect: go("/near/restaurants"),
          },
          {
            id: "near-shops",
            label: "Comercios",
            icon: "shop",
            onSelect: go("/near/businesses"),
          },
          {
            id: "near-services",
            label: "Servicios",
            icon: "service",
            onSelect: go("/near/services"),
          },
          {
            id: "near-places",
            label: "Lugares",
            icon: "place",
            onSelect: go("/near/places"),
          },
        ],
      });
    }

    // 7. Oficial — only modules whose feature flags are on (no ghost destinations)
    if (
      isFeatureEnabled("officialChannels") ||
      isFeatureEnabled("municipalServices") ||
      isFeatureEnabled("securityModule")
    ) {
      const officialChildren = listVisibleOfficialEntities({
        officialChannels: isFeatureEnabled("officialChannels"),
        municipalServices: isFeatureEnabled("municipalServices"),
        securityModule: isFeatureEnabled("securityModule"),
      }).map((entity) => ({
        id: `o-${entity.slug}`,
        label: officialEntityNavLabel(entity),
        icon: officialEntityNavIcon(entity),
        onSelect: go(`/official/${entity.slug}`),
      }));

      if (officialChildren.length > 0) {
        categories.push({
          id: "official",
          tone: "official",
          glyph: "🏛",
          label: "Oficial",
          description: "Información de entidades responsables",
          children: officialChildren,
        });
      }
    }

    // 8. Mi perfil — debajo de Oficial (desplegable)
    {
      const profileChildren: AppMenuCategory["children"] = [
        { id: "p-identity", label: "Mi identidad", icon: "people", onSelect: go("/me") },
        { id: "p-residency", label: "Mi residencia", icon: "pin", onSelect: go("/me") },
        { id: "p-interests", label: "Mis intereses", icon: "games", onSelect: go("/me") },
        {
          id: "p-activity",
          label: "Mi actividad",
          icon: "calendar",
          onSelect: go(
            isFeatureEnabled("experiences") || isFeatureEnabled("calendar")
              ? "/calendar"
              : "/me",
          ),
        },
      ];
      if (isFeatureEnabled("resources")) {
        profileChildren.push({
          id: "p-reservations",
          label: "Mis reservas",
          icon: "sport",
          onSelect: go("/reservations"),
        });
      }
      profileChildren.push(
        {
          id: "p-saved",
          label: "Mis guardados",
          icon: "info",
          onSelect: go(
            isFeatureEnabled("experiences") ? "/experiences" : "/me",
          ),
        },
        {
          id: "p-settings",
          label: "Configuración",
          icon: "service",
          onSelect: go("/me"),
        },
      );
      categories.push({
        id: "profile",
        tone: "profile",
        glyph: "👤",
        label: "Mi perfil",
        description: "Tu identidad y tu relación con la comunidad",
        children: profileChildren,
      });
    }

    return categories;
  }, [hasCapability, isFeatureEnabled, router]);

  const createActions = useMemo(() => {
    const actions: CreateAction[] = [];

    if (
      isFeatureEnabled("experiences") &&
      hasCapability(CAPABILITIES.experienceCreate)
    ) {
      actions.push({
        id: "experience",
        title: "Crear experiencia",
        description: "Organiza un paseo, clase o encuentro",
        icon: "✦",
        onSelect: () => router.push("/experiences/create"),
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
