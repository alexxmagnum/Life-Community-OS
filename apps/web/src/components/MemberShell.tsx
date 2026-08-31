"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  AppMenuSheet,
  CommunityAppHeader,
  CreatePostSheet,
  EmptyState,
  type AppMenuCategory,
  type CreateAction,
  type NavItem,
  type NavItemId,
} from "@life-community-os/ui";
import {
  bindProjectedNavigation,
  CommunityActionRegistry,
  communityCreationRoute,
  projectPlatformNavigation,
  sanitizeCommunityCreationContext,
  type CommunityCreationContext,
} from "@life-community-os/types";
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

function buildNav(flags: {
  services: boolean;
  showMap: boolean;
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
  const [postOpen, setPostOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  /**
   * Contribution entry (+) — domain create actions only.
   * Register / onboarding / reserve / report stay on their own screens.
   */
  const createActions = useMemo((): CreateAction[] => {
    if (!currentUser.hasMembership) return [];
    return CommunityActionRegistry.list({
      hasMembership: currentUser.hasMembership,
      capabilities: currentUser.permissions,
      productCapabilities,
      territoryId: activeTerritory.territoryId,
    }).map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      icon: action.icon,
      onSelect: () =>
        router.push(communityCreationRoute(action, composeContext)),
    }));
  }, [
    activeTerritory.territoryId,
    composeContext,
    currentUser.hasMembership,
    currentUser.permissions,
    productCapabilities,
    router,
  ]);

  const createActionCount = createActions.length;

  const navItems = useMemo(
    () =>
      buildNav({
        services: isModuleEnabled("services"),
        showMap:
          isModuleEnabled("lifeMap") &&
          isFeatureEnabled("lifeMap") &&
          isProductCapabilityEnabled("lifeMap"),
      }),
    [isModuleEnabled, isFeatureEnabled, isProductCapabilityEnabled],
  );

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
        onCreate={() => openComposer({ source: inferCreationSource(pathname) })}
        showCreateFab={createActionCount > 0}
        createFabLabel="Crear en comunidad"
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
        !currentUser.hasMembership &&
        pathname !== "/me" ? (
          <EmptyState
            title="No perteneces a esta comunidad"
            description="Tu cuenta está autenticada, pero no tiene membresía aquí. Entra en Perfil para unirte o pide acceso a un administrador."
            actionLabel="Ir a perfil"
            onAction={() => router.push("/me")}
          />
        ) : (
          children
        )}
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
        actions={createActions}
        locationName={composeContext.locationName}
      />
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
