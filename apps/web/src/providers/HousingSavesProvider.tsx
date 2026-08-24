"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTenant } from "@/providers/TenantProvider";

type HousingSavesContextValue = {
  savedIds: readonly string[];
  isSaved: (listingId: string) => boolean;
  toggleSave: (listingId: string) => void;
};

const HousingSavesContext = createContext<HousingSavesContextValue | null>(
  null,
);

export function HousingSavesProvider({ children }: { children: ReactNode }) {
  useTenant();
  const [savedIds, setSavedIds] = useState<string[]>([]);

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
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      savedIds,
      isSaved,
      toggleSave,
    }),
    [savedIds, isSaved, toggleSave],
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
