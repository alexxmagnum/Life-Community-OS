"use client";

/**
 * Tenant catalog cache — hydrates community/experiences/marketplace/resources
 * from /api/catalog (pack seed → durable store).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTenant } from "@/providers/TenantProvider";

type Catalogs = {
  community: unknown[];
  experiences: unknown[];
  marketplace: unknown[];
  resources: unknown[];
};

type CatalogContextValue = {
  ready: boolean;
  catalogs: Catalogs;
  refresh: () => Promise<void>;
};

const empty: Catalogs = {
  community: [],
  experiences: [],
  marketplace: [],
  resources: [],
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { tenantSlug } = useTenant();
  const [catalogs, setCatalogs] = useState<Catalogs>(empty);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(
      `/api/catalog?tenantId=${encodeURIComponent(tenantSlug)}&domain=all`,
      {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      },
    );
    if (!res.ok) {
      setReady(true);
      return;
    }
    const data = (await res.json()) as { catalogs?: Catalogs };
    if (data.catalogs) {
      setCatalogs({
        community: data.catalogs.community ?? [],
        experiences: data.catalogs.experiences ?? [],
        marketplace: data.catalogs.marketplace ?? [],
        resources: data.catalogs.resources ?? [],
      });
    }
    setReady(true);
  }, [tenantSlug]);

  useEffect(() => {
    setReady(false);
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ ready, catalogs, refresh }),
    [ready, catalogs, refresh],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useTenantCatalogs() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useTenantCatalogs must be used within CatalogProvider");
  }
  return ctx;
}

export function useCatalogDomain<T>(
  domain: keyof Catalogs,
): { items: T[]; ready: boolean } {
  const { catalogs, ready } = useTenantCatalogs();
  return { items: catalogs[domain] as T[], ready };
}
