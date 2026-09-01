"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  AppMenuSheet,
  CommunityAppHeader,
  CreatePostSheet,
  type AppMenuCategory,
  type CreateAction,
  type NavItem,
  type NavItemId,
} from "@life-community-os/ui";
import {
  bindProjectedNavigation,
  CommunityActionRegistry,
  communityCreationRoute,
  composerSuggestionReason,
  personalizeComposerActions,
  projectPlatformNavigation,
  sanitizeCommunityCreationContext,
  type CommunityCreationContext,
  type PersonalContext,
} from "@life-community-os/types";
import { resolveMembershipAccessScope } from "@/lib/membership/membership-experience-scope";
import { requireTenantPack } from "@/lib/tenant/registry";
import { useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTerritory } from "@/providers/TerritoryProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";
import { BrandSplash } from "@/components/BrandSplash";
import { ActionComposer } from "@/components/community/ActionComposer";
import {
  ACTION_COMPOSER_EVENT,
  inferCreationSource,
  type ActionComposerDetail,
} from "@/lib/community/action-composer-client";
import { COMPOSER_GLYPH_BY_ACTION } from "@/lib/community/composer-glyphs";
import { fetchPersonalContext } from "@/lib/personal/personal-client";
import { useNotifications } from "@/providers/NotificationProvider";

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

function IconMap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5 9 4.5Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path
        d="M9 4.5v13M15 6.5v13"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDiscover() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m16.5 16.5 4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M11 8.5v5M8.5 11h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildNav(flags: {
  services: boolean;
  showMap: boolean;
  showDiscover: boolean;
}): NavItem[] {
  /** Magic Plus is the FAB — destinations only. */
  const items: NavItem[] = [
    { id: "home", label: "Inicio", href: "/", icon: <IconHome /> },
  ];
  if (flags.showMap) {
    items.push({
      id: "map",
      label: "Mapa",
      href: "/map",
      icon: <IconMap />,
    });
  }
  if (flags.showDiscover) {
    items.push({
      id: "discover",
      label: "Descubrir",
      href: "/discover",
      icon: <IconDiscover />,
    });
  }
  items.push({
    id: "community",
    label: "Comunidad",
    href: "/community",
    icon: <IconCommunity />,
  });
  if (!flags.showMap && flags.services) {
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
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/locations")) return "map";
  if (pathname.startsWith("/business")) return "map";
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
    tenantSlug,
    theme,
    themeMode,
    hasCapability,
    isFeatureEnabled,
    isModuleEnabled,
    isProductCapabilityEnabled,
    configuration,
    productCapabilities,
  } = useTenant();
  const { currentUser, sessionReady } = useCurrentUser();
  const { context: activeTerritory } = useTerritory();
  const { unreadCount } = useNotifications();
  const { createPublication } = useCommunityInteractions();
  const [createOpen, setCreateOpen] = useState(false);
  const [composeContext, setComposeContext] = useState<CommunityCreationContext>(
    {},
  );
  const [personalContext, setPersonalContext] = useState<PersonalContext | null>(
    null,
  );
  const [postOpen, setPostOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [magicPlusPreviewOpen, setMagicPlusPreviewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const brandName = theme.logoText;
  const wordmarkPrimary = theme.identity?.wordmarkPrimary ?? theme.logoText;
  const territoryDisplayName =
    activeTerritory.territoryName?.trim() ||
    theme.identity?.wordmarkSecondary;
  const wordmarkSecondary = territoryDisplayName;
  const isHome = pathname === "/";

  /** The most severe live advisory rides inside the floating tab bar. */
  const [navAlert, setNavAlert] = useState<{
    title: string;
    context: string;
    icon: string;
    href: string;
  } | null>(null);

  const pack = requireTenantPack(tenantSlug);

  useEffect(() => {
    setNavAlert(pack.getNavAlert?.(Date.now()) ?? null);
  }, [pack]);

  useEffect(() => {
    if (!currentUser.hasMembership || !activeTerritory.territoryId) {
      setPersonalContext(null);
      return;
    }
    let cancelled = false;
    void fetchPersonalContext({
      tenantId: configuration.tenantId,
      territoryId: activeTerritory.territoryId,
    }).then((data) => {
      if (!cancelled) setPersonalContext(data.context);
    });
    return () => {
      cancelled = true;
    };
  }, [
    currentUser.hasMembership,
    configuration.tenantId,
    activeTerritory.territoryId,
  ]);
  /**
   * Night chrome needs a light mark. Prefer logoLight; fall back to logo
   * (the Panorámica icon is transparent and reads on dark surfaces).
   */
  const brandLogoUrl =
    (themeMode === "night"
      ? theme.imagery.logoLight ?? theme.imagery.logo
      : theme.imagery.logo) || undefined;

  /** Hamburger menu — hide actions that cannot complete a real flow yet. */
  const menuCategories = useMemo((): AppMenuCategory[] => {
    const navInput = {
      configuration,
      hasCapability,
      isFeatureEnabled,
      isProductCapabilityEnabled,
    };
    const projected =
      pack.projectNavigation?.(navInput) ??
      projectPlatformNavigation(navInput);
    const bound = bindProjectedNavigation(projected, {
      onNavigate: (href) => router.push(href),
      onSignOut: () => undefined,
    }) as AppMenuCategory[];
    return bound
      .map((category) => ({
        ...category,
        children: category.children.filter((leaf) => leaf.id !== "p-sign-out"),
      }))
      .filter((category) => category.children.length > 0);
  }, [
    configuration,
    hasCapability,
    isFeatureEnabled,
    isProductCapabilityEnabled,
    pack,
    router,
  ]);

  const accessScope = useMemo(
    () =>
      resolveMembershipAccessScope({
        authenticated: currentUser.authenticated,
        hasMembership: currentUser.hasMembership,
        membershipStatus: currentUser.membershipStatus,
        role: currentUser.role,
      }),
    [
      currentUser.authenticated,
      currentUser.hasMembership,
      currentUser.membershipStatus,
      currentUser.role,
    ],
  );

  /**
   * Magic Plus — experience creation engine for active members.
   * Pending users see a join preview; visitors never see the FAB.
   */
  const magicPlusMode = useMemo(() => {
    if (currentUser.hasMembership) return "active" as const;
    if (
      accessScope.scope === "pending" ||
      accessScope.scope === "registered"
    ) {
      return "preview" as const;
    }
    return "hidden" as const;
  }, [accessScope.scope, currentUser.hasMembership]);

  const canShowMagicPlusFab = magicPlusMode !== "hidden";

  /**
   * Contribution entry (+) — domain create actions only.
   * Register / onboarding / reserve / report stay on their own screens.
   */
  const createActions = useMemo((): CreateAction[] => {
    if (!currentUser.hasMembership) return [];
    const listed = CommunityActionRegistry.list({
      hasMembership: currentUser.hasMembership,
      capabilities: currentUser.permissions,
      productCapabilities,
      territoryId:
        activeTerritory.territoryId ?? currentUser.territoryId ?? undefined,
    });
    const ordered = personalContext
      ? personalizeComposerActions(listed, personalContext)
      : listed;
    return ordered.map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      hint: personalContext
        ? composerSuggestionReason(action, personalContext)
        : undefined,
      icon: COMPOSER_GLYPH_BY_ACTION[action.id] ? (
        <img
          src={COMPOSER_GLYPH_BY_ACTION[action.id]}
          alt=""
          className="h-10 w-10 object-contain"
        />
      ) : (
        action.icon
      ),
      onSelect: () =>
        router.push(communityCreationRoute(action, composeContext)),
    }));
  }, [
    activeTerritory.territoryId,
    composeContext,
    personalContext,
    currentUser.hasMembership,
    currentUser.permissions,
    currentUser.territoryId,
    productCapabilities,
    router,
  ]);

  const navItems = useMemo(
    () =>
      buildNav({
        services: isModuleEnabled("services"),
        showMap:
          isModuleEnabled("lifeMap") &&
          isFeatureEnabled("lifeMap") &&
          isProductCapabilityEnabled("lifeMap"),
        showDiscover:
          isFeatureEnabled("localLife") || isFeatureEnabled("experiences"),
      }),
    [isModuleEnabled, isFeatureEnabled, isProductCapabilityEnabled],
  );

  const magicPlusEmptyActions = useMemo((): CreateAction[] => {
    if (magicPlusMode !== "active" || createActions.length > 0) return [];
    return [
      {
        id: "discover_experiences",
        title: "Explorar experiencias",
        description: "Mira qué está pasando cerca y únete",
        icon: "🧭",
        onSelect: () => router.push("/discover"),
      },
      {
        id: "create_experience",
        title: "Crear plan o actividad",
        description: "Organiza un encuentro en el territorio",
        icon: "✨",
        onSelect: () => router.push("/experiences/create"),
      },
    ];
  }, [createActions.length, magicPlusMode, router]);

  const openComposer = useCallback(
    (detail?: ActionComposerDetail) => {
      setComposeContext(
        sanitizeCommunityCreationContext({
          source: detail?.source ?? inferCreationSource(pathname),
          locationId: detail?.locationId,
          locationName: detail?.locationName,
        }),
      );
      setCreateOpen(true);
    },
    [pathname],
  );

  useEffect(() => {
    const openCreate = (event: Event) => {
      const detail = (event as CustomEvent<ActionComposerDetail>).detail;
      openComposer(detail);
    };
    const openPost = () => setPostOpen(true);
    window.addEventListener(ACTION_COMPOSER_EVENT, openCreate);
    window.addEventListener("lcos:open-post", openPost);
    return () => {
      window.removeEventListener(ACTION_COMPOSER_EVENT, openCreate);
      window.removeEventListener("lcos:open-post", openPost);
    };
  }, [openComposer]);

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
        flushTop={isHome}
        onNavigate={(item) => {
          router.push(item.href);
        }}
        onCreate={
          canShowMagicPlusFab
            ? () => {
                if (magicPlusMode === "preview") {
                  setMagicPlusPreviewOpen(true);
                  return;
                }
                openComposer({ source: inferCreationSource(pathname) });
              }
            : undefined
        }
        showCreateFab={canShowMagicPlusFab}
        createFabLabel={
          magicPlusMode === "preview"
            ? "Crear experiencias"
            : "Crear experiencia"
        }
        navNotice={
          navAlert ? (
            <button
              type="button"
              onClick={() => {
                // Soft-nav must not carry a hash — App Router RSC prefetch fails on it.
                const href = (navAlert.href.split("#")[0] || "/community").trim();
                router.push(href);
              }}
              className="flex w-full items-center gap-2 text-left"
            >
              <span className="text-[13px] leading-none" aria-hidden>
                {navAlert.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[9.5px] font-semibold leading-3 text-[var(--color-text-primary)]">
                  {navAlert.title}
                </span>
                <span className="block truncate text-[8.5px] leading-3 text-[var(--color-text-tertiary)]">
                  {navAlert.context}
                </span>
              </span>
            </button>
          ) : null
        }
        header={
          <CommunityAppHeader
            brandName={wordmarkPrimary}
            brandSubName={wordmarkSecondary}
            transparent
            heroOverlay
            brandLogoUrl={brandLogoUrl}
            weatherTemperature={theme.identity?.weatherTemperature}
            weatherCondition={theme.identity?.weatherCondition}
            placeLabel={
              activeTerritory.territoryName || theme.identity?.municipalityName
            }
            onBrandClick={() => router.push("/")}
            onMenuOpen={() => setMenuOpen(true)}
            menuLabel="Explorar comunidad"
            notificationCount={unreadCount}
            onNotifications={() => router.push("/notifications")}
            notificationsLabel="Notificaciones"
            profileImageUrl={undefined}
            profileName={
              currentUser.displayName || currentUser.email?.split("@")[0] || "Mi perfil"
            }
            profileLabel="Mi perfil"
            onProfileClick={() => router.push("/me")}
          />
        }
      >
        {sessionReady &&
        currentUser.authenticated &&
        accessScope.scope === "registered" &&
        pathname !== "/me" ? (
          <div className="mx-4 mb-4 rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-3 text-[14px] text-[var(--color-text-secondary)]">
            Aún no perteneces a esta comunidad.{" "}
            <button
              type="button"
              className="font-semibold text-[var(--color-action-primary)]"
              onClick={() => router.push("/me")}
            >
              Unirme a comunidad
            </button>
          </div>
        ) : null}
        {sessionReady &&
        currentUser.authenticated &&
        accessScope.scope === "pending" &&
        pathname !== "/me" ? (
          <div className="mx-4 mb-4 rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-3 text-[14px] text-[var(--color-text-secondary)]">
            Tu solicitud está pendiente de aprobación. Mientras tanto puedes
            explorar el territorio.
          </div>
        ) : null}
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
      <ActionComposer
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setComposeContext({});
        }}
        actions={
          createActions.length > 0 ? createActions : magicPlusEmptyActions
        }
        locationName={composeContext.locationName}
        source={composeContext.source}
        title="Crear experiencia"
        subtitle="Organiza planes, actividades y encuentros en el territorio"
        emptyMessage="Descubre qué puedes crear en tu comunidad"
      />
      {magicPlusPreviewOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center">
          <button
            type="button"
            className="ui-fade ui-backdrop absolute inset-0"
            aria-label="Cerrar"
            onClick={() => setMagicPlusPreviewOpen(false)}
          />
          <div className="relative z-10 m-4 w-full max-w-md rounded-[20px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-elev-2)]">
            <h2 className="font-[family-name:var(--font-display)] text-[22px] font-semibold text-[var(--color-text-primary)]">
              Únete para crear experiencias
            </h2>
            <p className="mt-2 text-[14px] leading-snug text-[var(--color-text-secondary)]">
              Magic Plus es el motor para organizar planes, actividades y
              encuentros. Completa tu membresía para empezar a crear.
            </p>
            <button
              type="button"
              className="ui-press mt-4 min-h-[44px] w-full rounded-full bg-[var(--color-action-primary)] px-4 text-[14px] font-semibold text-white"
              onClick={() => {
                setMagicPlusPreviewOpen(false);
                router.push("/me");
              }}
            >
              Unirme a la comunidad
            </button>
          </div>
        </div>
      ) : null}
      <CreatePostSheet
        open={postOpen}
        onClose={() => setPostOpen(false)}
        onSubmit={async (input) => {
          const created = await createPublication(input);
          if (created) {
            showToast("Publicado. Ya puedes verlo en Comunidad.");
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
