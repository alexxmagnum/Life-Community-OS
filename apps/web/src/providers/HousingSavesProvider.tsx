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
  hydrateDurableState,
  pushDurableState,
} from "@/lib/durable/client";
import { useTenant } from "@/providers/TenantProvider";

const SAVED_STORAGE_KEY = "lcos:housing-saves";
const DURABLE_KEY = "housing-saves";

type HousingSavesContextValue = {
  savedIds: readonly string[];
  isSaved: (listingId: string) => boolean;
  toggleSave: (listingId: string) => void;
};

const HousingSavesContext = createContext<HousingSavesContextValue | null>(
  null,
);

function readSavedIds(tenantSlug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(
      `${SAVED_STORAGE_KEY}:${tenantSlug}`,
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string" && id.trim())
      : [];
  } catch {
    return [];
  }
}

function writeSavedIds(ids: string[], tenantSlug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${SAVED_STORAGE_KEY}:${tenantSlug}`,
    JSON.stringify(ids),
  );
  pushDurableState(DURABLE_KEY, ids, tenantSlug);
}

export function HousingSavesProvider({ children }: { children: ReactNode }) {
  const { tenantSlug } = useTenant();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void (async () => {
      const remote = await hydrateDurableState<string[]>(DURABLE_KEY, tenantSlug);
      if (cancelled) return;
      if (Array.isArray(remote)) {
        setSavedIds(remote);
        window.localStorage.setItem(
          `${SAVED_STORAGE_KEY}:${tenantSlug}`,
          JSON.stringify(remote),
        );
      } else {
        setSavedIds(readSavedIds(tenantSlug));
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const isSaved = useCallback(
    (listingId: string) => savedIds.includes(listingId),
    [savedIds],
  );

  const toggleSave = useCallback(
    (listingId: string) => {
      const id = listingId.trim();
      if (!id) return;
      setSavedIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        writeSavedIds(next, tenantSlug);
        return next;
      });
    },
    [tenantSlug],
  );

  const value = useMemo(
    () => ({
      savedIds: ready ? savedIds : [],
      isSaved,
      toggleSave,
    }),
    [ready, savedIds, isSaved, toggleSave],
  );

  return (
    <HousingSavesContext.Provider value={value}>
      {children}
    </HousingSavesContext.Provider>
  );
}

export function useHousingSaves() {
  const ctx = useContext(HousingSavesContext);
  if (!ctx) {
    throw new Error("useHousingSaves must be used within HousingSavesProvider");
  }
  return ctx;
}
