"use client";

/**
 * React hook — hydrate Location SoT from server API and subscribe to cache.
 */

import { useCallback, useEffect, useState } from "react";
import type { Location } from "@life-community-os/types";
import {
  hydrateLocations,
  listLocations,
  listVisibleMapLocations,
  subscribeLocations,
} from "./location-store";
import { ensureExampleIkonLocation } from "./example-ikon";
import { ensureCatalogLocations } from "./seed-catalog-locations";

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
      await hydrateLocations(tenantId);
      if (cancelled) return;
      sync();
      const catalog = await ensureCatalogLocations(tenantId);
      if (cancelled) return;
      if (catalog.error) setSeedError(catalog.error);
      const result = await ensureExampleIkonLocation(tenantId);
      if (cancelled) return;
      if (result.error) setSeedError(result.error);
      await hydrateLocations(tenantId);
      if (cancelled) return;
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
