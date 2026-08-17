"use client";

/**
 * React hook — subscribe to multi-tenant Location store.
 */

import { useCallback, useEffect, useState } from "react";
import type { Location } from "@life-community-os/types";
import {
  listLocations,
  listVisibleMapLocations,
  subscribeLocations,
} from "./location-store";
import { ensureExampleIkonLocation } from "./example-ikon";

export function useTenantLocations(tenantId: string): {
  locations: Location[];
  allLocations: Location[];
  refresh: () => void;
  seedReady: boolean;
  seedError: string | null;
} {
  const [locations, setLocations] = useState<Location[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [seedReady, setSeedReady] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const sync = useCallback(() => {
    const id = tenantId.trim();
    setLocations(listVisibleMapLocations(id));
    setAllLocations(listLocations(id));
  }, [tenantId]);

  useEffect(() => {
    sync();
    return subscribeLocations(sync);
  }, [sync]);

  useEffect(() => {
    let cancelled = false;
    setSeedReady(false);
    setSeedError(null);
    void (async () => {
      const result = await ensureExampleIkonLocation(tenantId);
      if (cancelled) return;
      if (result.error) setSeedError(result.error);
      setSeedReady(true);
      sync();
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, sync]);

  return {
    locations,
    allLocations,
    refresh: sync,
    seedReady,
    seedError,
  };
}
