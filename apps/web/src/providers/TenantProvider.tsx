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
import {
  CAPABILITIES,
  capabilitiesForRole,
  DEMO_PERSON_MARTA,
  getDemoMemberByPersonId,
  lifePanoramicaFeatures,
  lifePanoramicaTheme,
  listDemoMembers,
  type CapabilityKey,
  type DemoMemberProfile,
  type DemoRole,
  type TenantFeatureFlags,
} from "@life-community-os/tenant-life-panoramica";

type TenantContextValue = {
  theme: TenantBrandTokens;
  features: TenantFeatureFlags;
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  /** Active demo Person for residency / access validation (ADR-037/038). */
  demoPersonId: string;
  setDemoPersonId: (personId: string) => void;
  demoMember: DemoMemberProfile;
  demoMembers: DemoMemberProfile[];
  hasCapability: (key: CapabilityKey | string) => boolean;
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean;
};

const TenantReactContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const theme = lifePanoramicaTheme;
  const features = lifePanoramicaFeatures;
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
      role,
      setRole,
      demoPersonId,
      setDemoPersonId,
      demoMember,
      demoMembers,
      hasCapability,
      isFeatureEnabled,
    }),
    [
      theme,
      features,
      role,
      demoPersonId,
      demoMember,
      demoMembers,
      hasCapability,
      isFeatureEnabled,
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

export { CAPABILITIES };
