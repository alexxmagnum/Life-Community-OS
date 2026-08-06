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
import {
  CAPABILITIES,
  capabilitiesForRole,
  lifePanoramicaFeatures,
  lifePanoramicaTheme,
  type CapabilityKey,
  type DemoRole,
  type TenantFeatureFlags,
} from "@life-community-os/tenant-life-panoramica";
import type { TenantBrandTokens } from "@life-community-os/design-tokens";

type TenantContextValue = {
  theme: TenantBrandTokens;
  features: TenantFeatureFlags;
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  hasCapability: (key: CapabilityKey | string) => boolean;
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean;
};

const TenantReactContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const theme = lifePanoramicaTheme;
  const features = lifePanoramicaFeatures;
  const [role, setRole] = useState<DemoRole>("member");

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

  const value = useMemo(
    () => ({
      theme,
      features,
      role,
      setRole,
      hasCapability,
      isFeatureEnabled,
    }),
    [theme, features, role, hasCapability, isFeatureEnabled],
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
