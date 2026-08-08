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
import type { TenantBrandTokens } from "@life-community-os/design-tokens";
import type { TenantConfiguration } from "@life-community-os/types";
import { isTenantModuleEnabled } from "@life-community-os/types";
import {
  CAPABILITIES,
  canAccessMunicipalityModule,
  canAccessSecurityModule,
  capabilitiesForRole,
  DEMO_PERSON_MARTA,
  getDemoMemberByPersonId,
  lifePanoramicaFeatures,
  lifePanoramicaTheme,
  listDemoMembers,
  resolveLifePanoramicaTenantConfiguration,
  type CapabilityKey,
  type DemoMemberProfile,
  type DemoRole,
  type TenantFeatureFlags,
} from "@life-community-os/tenant-life-panoramica";

type TenantContextValue = {
  theme: TenantBrandTokens;
  features: TenantFeatureFlags;
  /**
   * Declarative tenant configuration (D.0.2).
   * Source today: tenant pack adapter. Future: runtime configuration.
   */
  configuration: TenantConfiguration;
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  /** Active demo Person for residency / access validation (ADR-037/038). */
  demoPersonId: string;
  setDemoPersonId: (personId: string) => void;
  demoMember: DemoMemberProfile;
  demoMembers: DemoMemberProfile[];
  hasCapability: (key: CapabilityKey | string) => boolean;
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean;
  /** Module availability — not a permission check. */
  isModuleEnabled: (moduleId: string) => boolean;
};

const TenantReactContext = createContext<TenantContextValue | null>(null);

/**
 * Resolve TenantConfiguration for the active tenant.
 * D.0.2: always from Life Panoramica pack adapter.
 * Future: switch source to runtime configuration without changing callers.
 */
export function resolveTenantConfiguration(): TenantConfiguration {
  return resolveLifePanoramicaTenantConfiguration();
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const theme = lifePanoramicaTheme;
  const features = lifePanoramicaFeatures;
  const configuration = useMemo(() => resolveTenantConfiguration(), []);
  const [role, setRole] = useState<DemoRole>("member");
  const [demoPersonId, setDemoPersonId] = useState<string>(DEMO_PERSON_MARTA);

  useEffect(() => {
    const vars = tenantThemeToCssVars(theme);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, [theme]);

  const caps = useMemo(() => capabilitiesForRole(role), [role]);

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
      theme,
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
      theme,
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
};
