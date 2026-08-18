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
import { tenantThemeToCssVars } from "@life-community-os/design-tokens";
import type { TenantThemeMode } from "@life-community-os/design-tokens";
import {
  coerceMembershipRole,
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

type TenantContextValue = {
  tenantSlug: string;
  theme: ReturnType<typeof requireTenantPack>["theme"];
  themeMode: TenantThemeMode;
  features: TenantFeatureFlags;
  configuration: TenantConfiguration;
  /** Capability role — sourced from membership when authenticated. */
  role: DemoRole;
  /**
   * Demo-only. No-op when a real membership session is active.
   * @deprecated Prefer membership AuthZ from /api/auth/session
   */
  setRole: (role: DemoRole) => void;
  roleSource: "membership" | "demo";
  personId: string | null;
  authenticated: boolean;
  demoPersonId: string;
  setDemoPersonId: (personId: string) => void;
  demoMember: DemoMemberProfile;
  demoMembers: DemoMemberProfile[];
  hasCapability: (key: CapabilityKey | string) => boolean;
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean;
  isModuleEnabled: (moduleId: string) => boolean;
};

const TenantReactContext = createContext<TenantContextValue | null>(null);

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
  const [tenantSlug, setTenantSlug] = useState(() =>
    resolveActiveTenantSlug(tenantSlugProp),
  );
  const pack = requireTenantPack(tenantSlug);
  const theme = pack.theme;
  const features = pack.features;
  const configuration = useMemo(() => pack.resolveConfiguration(), [pack]);
  const [role, setRoleState] = useState<DemoRole>("member");
  const [roleSource, setRoleSource] = useState<"membership" | "demo">("demo");
  const [personId, setPersonId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [demoPersonId, setDemoPersonId] = useState<string>(DEMO_PERSON_MARTA);

  const themeMode: TenantThemeMode = theme.defaultMode ?? "day";

  useEffect(() => {
    const hint = tenantSlugProp || readTenantHintFromBrowser();
    const next = resolveActiveTenantSlug(hint);
    setTenantSlug(next);
  }, [tenantSlugProp]);

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          cache: "no-store",
          headers: { "x-tenant-slug": tenantSlug },
        });
        const data = (await res.json()) as {
          authenticated?: boolean;
          role?: string | null;
          personId?: string | null;
          tenantSlug?: string;
        };
        if (cancelled) return;
        if (data.tenantSlug && data.tenantSlug !== tenantSlug) {
          setTenantSlug(resolveActiveTenantSlug(data.tenantSlug));
        }
        if (data.authenticated && data.role) {
          setRoleState(coerceMembershipRole(data.role) as DemoRole);
          setRoleSource("membership");
          setPersonId(data.personId ?? null);
          setAuthenticated(true);
        } else {
          setRoleSource("demo");
          setPersonId(null);
          setAuthenticated(false);
        }
      } catch {
        if (!cancelled) {
          setRoleSource("demo");
          setAuthenticated(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const setRole = useCallback(
    (next: DemoRole) => {
      if (roleSource === "membership") return;
      const demoRolesEnabled =
        process.env.NEXT_PUBLIC_LCOS_DEMO_ROLES === "1" ||
        process.env.NEXT_PUBLIC_LCOS_DEMO_ROLES === "true" ||
        process.env.NODE_ENV === "development";
      if (!demoRolesEnabled) return;
      setRoleState(next);
    },
    [roleSource],
  );

  const caps = useMemo(
    () => pack.capabilitiesForRole(role),
    [pack, role],
  );

  const hasCapability = useCallback(
    (key: CapabilityKey | string) => caps.has(key as CapabilityKey),
    [caps],
  );

  const isFeatureEnabled = useCallback(
    (key: keyof TenantFeatureFlags) => Boolean(features[key]),
    [features],
  );

  const isModuleEnabled = useCallback(
    (moduleId: string) => isTenantModuleEnabled(configuration, moduleId),
    [configuration],
  );

  const demoMembers = useMemo(() => listDemoMembers(), []);
  const demoMember = useMemo(() => {
    return (
      getDemoMemberByPersonId(demoPersonId) ??
      getDemoMemberByPersonId(DEMO_PERSON_MARTA)!
    );
  }, [demoPersonId]);

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
      personId,
      authenticated,
      demoPersonId,
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
      personId,
      authenticated,
      demoPersonId,
      demoMember,
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
