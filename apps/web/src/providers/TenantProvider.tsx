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
import { isDemoIdentityEnabled } from "@life-community-os/auth";
import { tenantThemeToCssVars } from "@life-community-os/design-tokens";
import type { TenantThemeMode } from "@life-community-os/design-tokens";
import {
  isTenantModuleEnabled,
  type MembershipRole,
  type TenantConfiguration,
} from "@life-community-os/types";
import {
  DEMO_PERSON_MARTA,
  getDemoMemberByPersonId,
  listDemoMembers,
  type CapabilityKey,
  type DemoMemberProfile,
  type DemoRole,
  type TenantFeatureFlags,
} from "@life-community-os/tenant-life-panoramica";
import {
  CAPABILITIES,
  canAccessMunicipalityModule,
  canAccessSecurityModule,
  canAccessLifeMapModule,
} from "@life-community-os/tenant-life-panoramica";
import {
  requireTenantPack,
  resolveActiveTenantSlug,
} from "@/lib/tenant/registry";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

type RoleSource = "membership" | "demo" | "guest";

type TenantContextValue = {
  tenantSlug: string;
  theme: ReturnType<typeof requireTenantPack>["theme"];
  themeMode: TenantThemeMode;
  features: TenantFeatureFlags;
  configuration: TenantConfiguration;
  role: DemoRole;
  /**
   * Demo-only. No-op when a real membership session is active or in production.
   */
  setRole: (role: DemoRole) => void;
  roleSource: RoleSource;
  personId: string | null;
  authenticated: boolean;
  hasMembership: boolean;
  demoPersonId: string;
  setDemoPersonId: (personId: string) => void;
  demoMember: DemoMemberProfile;
  demoMembers: DemoMemberProfile[];
  hasCapability: (key: CapabilityKey | string) => boolean;
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean;
  isModuleEnabled: (moduleId: string) => boolean;
};

const TenantReactContext = createContext<TenantContextValue | null>(null);

const GUEST_VIEWER: DemoMemberProfile = {
  personId: "",
  displayName: "Invitado",
  fullName: "Invitado",
  membershipLabel: "Sin membresía",
  areaLabel: "",
  interests: [],
  avatarUrl: "",
  residencyStatusLabel: "Sin sesión",
  residencyStatusKind: "pending",
  narrativeKey: "marta",
};

function roleLabel(role: MembershipRole | null, brand: string): string {
  if (role === "administrator") return `Administrador · ${brand}`;
  if (role === "moderator") return `Moderador · ${brand}`;
  if (role === "group_manager") return `Gestor de grupo · ${brand}`;
  if (role === "member") return `Miembro · ${brand}`;
  return `Invitado · ${brand}`;
}

export function resolveTenantConfiguration(
  slugHint?: string | null,
): TenantConfiguration {
  const slug = resolveActiveTenantSlug(slugHint);
  return requireTenantPack(slug).resolveConfiguration();
}

function readTenantHintFromBrowser(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith("lcos-tenant-slug="));
  if (!match) return null;
  return decodeURIComponent(match.slice("lcos-tenant-slug=".length));
}

export function TenantProvider({
  children,
  tenantSlug: tenantSlugProp,
}: {
  children: ReactNode;
  tenantSlug?: string;
}) {
  const { currentUser } = useCurrentUser();
  const demoEnabled = isDemoIdentityEnabled();
  const [tenantSlug, setTenantSlug] = useState(() =>
    resolveActiveTenantSlug(tenantSlugProp),
  );
  const pack = requireTenantPack(tenantSlug);
  const theme = pack.theme;
  const features = pack.features;
  const configuration = useMemo(() => pack.resolveConfiguration(), [pack]);
  const [demoRole, setDemoRole] = useState<DemoRole>("member");
  const [demoPersonId, setDemoPersonIdState] = useState<string>(
    DEMO_PERSON_MARTA,
  );

  const themeMode: TenantThemeMode = theme.defaultMode ?? "day";

  useEffect(() => {
    const fromMembership = currentUser.hasMembership
      ? currentUser.tenantId
      : null;
    const hint =
      fromMembership || tenantSlugProp || readTenantHintFromBrowser();
    const next = resolveActiveTenantSlug(hint);
    setTenantSlug(next);
  }, [currentUser.hasMembership, currentUser.tenantId, tenantSlugProp]);

  useEffect(() => {
    const vars = tenantThemeToCssVars(theme, themeMode);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
    root.dataset.themeMode = themeMode;
    root.dataset.tenantSlug = tenantSlug;
    root.style.colorScheme = themeMode === "night" ? "dark" : "light";
  }, [theme, themeMode, tenantSlug]);

  const roleSource: RoleSource = currentUser.hasMembership
    ? "membership"
    : demoEnabled
      ? "demo"
      : "guest";

  const role: DemoRole =
    currentUser.hasMembership && currentUser.role
      ? currentUser.role
      : demoRole;

  const setRole = useCallback(
    (next: DemoRole) => {
      if (roleSource !== "demo") return;
      if (!demoEnabled) return;
      setDemoRole(next);
    },
    [demoEnabled, roleSource],
  );

  const setDemoPersonId = useCallback(
    (personId: string) => {
      if (!demoEnabled || currentUser.hasMembership) return;
      setDemoPersonIdState(personId);
    },
    [currentUser.hasMembership, demoEnabled],
  );

  const caps = useMemo(
    () => pack.capabilitiesForRole(role),
    [pack, role],
  );

  const hasCapability = useCallback(
    (key: CapabilityKey | string) => {
      if (currentUser.hasMembership && currentUser.permissions.length > 0) {
        return currentUser.permissions.includes(key);
      }
      return caps.has(key as CapabilityKey);
    },
    [caps, currentUser.hasMembership, currentUser.permissions],
  );

  const isFeatureEnabled = useCallback(
    (key: keyof TenantFeatureFlags) => Boolean(features[key]),
    [features],
  );

  const isModuleEnabled = useCallback(
    (moduleId: string) => isTenantModuleEnabled(configuration, moduleId),
    [configuration],
  );

  const demoMembers = useMemo(
    () => (demoEnabled ? listDemoMembers() : []),
    [demoEnabled],
  );

  const demoMember = useMemo((): DemoMemberProfile => {
    if (currentUser.hasMembership && currentUser.personId) {
      const brand = configuration.branding.name?.trim() || "Comunidad";
      const name =
        currentUser.displayName?.trim() ||
        currentUser.email?.split("@")[0] ||
        "Vecino";
      return {
        personId: currentUser.personId,
        displayName: name,
        fullName: name,
        membershipLabel: roleLabel(currentUser.role, brand),
        areaLabel: theme.identity?.defaultAreaName || brand,
        interests: [],
        avatarUrl: "",
        residencyStatusLabel: "Miembro de la comunidad",
        residencyStatusKind: "verified",
        narrativeKey: "marta",
      };
    }
    if (demoEnabled && tenantSlug === "life-panoramica") {
      return (
        getDemoMemberByPersonId(demoPersonId) ??
        getDemoMemberByPersonId(DEMO_PERSON_MARTA)!
      );
    }
    return {
      ...GUEST_VIEWER,
      areaLabel: configuration.branding.name ?? "",
      membershipLabel: `Invitado · ${configuration.branding.name ?? "Comunidad"}`,
    };
  }, [
    configuration.branding.name,
    currentUser.displayName,
    currentUser.email,
    currentUser.hasMembership,
    currentUser.personId,
    currentUser.role,
    demoEnabled,
    demoPersonId,
    tenantSlug,
    theme.identity?.defaultAreaName,
  ]);

  const value = useMemo(
    () => ({
      tenantSlug,
      theme,
      themeMode,
      features,
      configuration,
      role,
      setRole,
      roleSource,
      personId: currentUser.personId,
      authenticated: currentUser.authenticated,
      hasMembership: currentUser.hasMembership,
      demoPersonId: demoMember.personId,
      setDemoPersonId,
      demoMember,
      demoMembers,
      hasCapability,
      isFeatureEnabled,
      isModuleEnabled,
    }),
    [
      tenantSlug,
      theme,
      themeMode,
      features,
      configuration,
      role,
      setRole,
      roleSource,
      currentUser.personId,
      currentUser.authenticated,
      currentUser.hasMembership,
      demoMember,
      setDemoPersonId,
      demoMembers,
      hasCapability,
      isFeatureEnabled,
      isModuleEnabled,
    ],
  );

  return (
    <TenantReactContext.Provider value={value}>
      {children}
    </TenantReactContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantReactContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}

export {
  CAPABILITIES,
  canAccessMunicipalityModule,
  canAccessSecurityModule,
  canAccessLifeMapModule,
};

export type { MembershipRole };
