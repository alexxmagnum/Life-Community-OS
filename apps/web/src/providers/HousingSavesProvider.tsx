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

function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string" && id.trim())
      : [];
  } catch {
    return [];
  }
}

function writeSavedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
  pushDurableState(DURABLE_KEY, ids);
}

export function HousingSavesProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const remote = await hydrateDurableState<string[]>(DURABLE_KEY);
      if (cancelled) return;
      if (Array.isArray(remote)) {
        setSavedIds(remote);
        window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(remote));
      } else {
        setSavedIds(readSavedIds());
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSaved = useCallback(
    (listingId: string) => savedIds.includes(listingId),
    [savedIds],
  );

  const toggleSave = useCallback((listingId: string) => {
    const id = listingId.trim();
    if (!id) return;
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [id, ...prev];
      writeSavedIds(next);
      return next;
    });
  }, []);

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
