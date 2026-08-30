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
import {
  emptyTerritoryExperienceContext,
  type TerritoryExperienceContext,
  type TerritorySwitcherContract,
} from "@life-community-os/types";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTenant } from "@/providers/TenantProvider";

type TerritoryValue = {
  context: TerritoryExperienceContext;
  switcher: TerritorySwitcherContract | null;
  ready: boolean;
  /** Prepared for a future TerritorySwitcher UI. Not rendered in this phase. */
  switchTerritory: (territoryId: string) => Promise<{ ok: true } | { error: string }>;
};

const TerritoryReactContext = createContext<TerritoryValue | null>(null);

export function TerritoryProvider({ children }: { children: ReactNode }) {
  const { tenantSlug } = useTenant();
  const { currentUser, sessionReady } = useCurrentUser();
  const [context, setContext] = useState<TerritoryExperienceContext>(() =>
    emptyTerritoryExperienceContext(tenantSlug),
  );
  const [switcher, setSwitcher] = useState<TerritorySwitcherContract | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/territories/current", {
      cache: "no-store",
      headers: {
        "x-tenant-slug": tenantSlug,
      },
    });
    if (!res.ok) {
      setContext(emptyTerritoryExperienceContext(tenantSlug));
      setSwitcher(null);
      return;
    }
    const data = (await res.json()) as {
      tenantId?: string;
      territoryId?: string | null;
      name?: string | null;
      slug?: string | null;
      locale?: string;
      timezone?: string;
      bounds?: TerritoryExperienceContext["bounds"];
      capabilities?: string[];
      switcher?: TerritorySwitcherContract;
    };
    setContext({
      tenantId: data.tenantId ?? tenantSlug,
      territoryId: data.territoryId ?? null,
      territoryName: data.name ?? null,
      slug: data.slug ?? null,
      locale: data.locale ?? "es",
      timezone: data.timezone ?? "UTC",
      ...(data.bounds ? { bounds: data.bounds } : {}),
      capabilities: data.capabilities,
    });
    setSwitcher(data.switcher ?? null);
  }, [tenantSlug]);

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) {
          setContext(emptyTerritoryExperienceContext(tenantSlug));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionReady, tenantSlug, currentUser.territoryId, refresh]);

  const switchTerritory = useCallback(
    async (territoryId: string) => {
      const res = await fetch("/api/territories/current", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({ territoryId }),
      });
      if (!res.ok) {
        let error = "territory_forbidden";
        try {
          const data = (await res.json()) as { error?: string };
          error = data.error ?? error;
        } catch {
          /* keep */
        }
        return { error };
      }
      await refresh();
      return { ok: true as const };
    },
    [tenantSlug, refresh],
  );

  const value = useMemo(
    () => ({ context, switcher, ready, switchTerritory }),
    [context, switcher, ready, switchTerritory],
  );

  return (
    <TerritoryReactContext.Provider value={value}>
      {children}
    </TerritoryReactContext.Provider>
  );
}

export function useTerritory() {
  const ctx = useContext(TerritoryReactContext);
  if (!ctx) {
    throw new Error("useTerritory must be used within TerritoryProvider");
  }
  return ctx;
}
