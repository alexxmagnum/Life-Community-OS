"use client";

/** Runtime domain data is loaded by each persisted domain API. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  const [catalogs, setCatalogs] = useState<Catalogs>(empty);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setCatalogs(empty);
    setReady(true);
  }, []);

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
