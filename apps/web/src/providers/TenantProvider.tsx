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
import type { TenantConfiguration } from "@life-community-os/types";
import { isTenantModuleEnabled } from "@life-community-os/types";
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
  /**
   * @deprecated Demo capability matrix — replaced by membership AuthZ when
   * LCOS_AUTH_REQUIRED=true and Supabase Auth is wired.
   */
  role: DemoRole;
  setRole: (role: DemoRole) => void;
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

export function TenantProvider({
  children,
  tenantSlug: tenantSlugProp,
}: {
  children: ReactNode;
  tenantSlug?: string;
}) {
  const tenantSlug = resolveActiveTenantSlug(tenantSlugProp);
  const pack = requireTenantPack(tenantSlug);
  const theme = pack.theme;
  const features = pack.features;
  const configuration = useMemo(() => pack.resolveConfiguration(), [pack]);
  const [role, setRole] = useState<DemoRole>("member");
  const [demoPersonId, setDemoPersonId] = useState<string>(DEMO_PERSON_MARTA);

  const themeMode: TenantThemeMode = theme.defaultMode ?? "day";

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
