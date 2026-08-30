/**
 * Client Location repository — cache + server API.
 *
 * Source of truth is the server (file store and/or Supabase).
 * localStorage is only a short-lived offline cache, never the product SoT.
 */

import {
  createLocation,
  type CreateLocationInput,
  type Location,
} from "@life-community-os/types";

const CACHE_PREFIX = "lcos.locations.cache.v2:";

type Listener = () => void;

const memoryByTenant = new Map<string, Location[]>();
const listeners = new Set<Listener>();
const inflightHydrate = new Map<string, Promise<void>>();

function cacheKey(tenantId: string): string {
  return `${CACHE_PREFIX}${tenantId}`;
}

function notify(): void {
  for (const listener of listeners) listener();
}

function readCache(tenantId: string): Location[] {
  if (typeof window === "undefined") {
    return memoryByTenant.get(tenantId) ?? [];
  }
  try {
    const raw = window.localStorage.getItem(cacheKey(tenantId));
    if (!raw) return memoryByTenant.get(tenantId) ?? [];
    const parsed = JSON.parse(raw) as Location[];
    if (!Array.isArray(parsed)) return [];
    memoryByTenant.set(tenantId, parsed);
    return parsed;
  } catch {
    return memoryByTenant.get(tenantId) ?? [];
  }
}

function writeCache(tenantId: string, locations: Location[]): void {
  memoryByTenant.set(tenantId, locations);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        cacheKey(tenantId),
        JSON.stringify(locations),
      );
    } catch {
      // ignore quota
    }
  }
  notify();
}

export function subscribeLocations(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listLocations(tenantId: string): Location[] {
  if (!tenantId.trim()) return [];
  return [...(memoryByTenant.get(tenantId.trim()) ?? readCache(tenantId.trim()))];
}

export function getLocation(
  tenantId: string,
  locationId: string,
): Location | null {
  return (
    listLocations(tenantId).find((item) => item.id === locationId) ?? null
  );
}

export function listVisibleMapLocations(tenantId: string): Location[] {
  return listLocations(tenantId).filter(
    (item) => item.visibility === "public" || item.visibility === "members",
  );
}

export async function hydrateLocations(
  tenantId: string,
  territoryId?: string | null,
): Promise<Location[]> {
  const id = tenantId.trim();
  if (!id) return [];
  const existing = inflightHydrate.get(id);
  if (existing) {
    await existing;
    return listLocations(id);
  }
  const task = (async () => {
    try {
      const params = new URLSearchParams({ tenantId: id });
      if (territoryId?.trim()) params.set("territoryId", territoryId.trim());
      const res = await fetch(`/api/locations?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { locations?: Location[] };
      if (Array.isArray(data.locations)) {
        writeCache(id, data.locations);
      }
    } catch {
      // keep cache
    } finally {
      inflightHydrate.delete(id);
    }
  })();
  inflightHydrate.set(id, task);
  await task;
  return listLocations(id);
}

export async function saveLocation(
  input: CreateLocationInput,
): Promise<Location> {
  const optimistic = createLocation(input);
  const tenantId = optimistic.tenantId;
  const existing = listLocations(tenantId);
  writeCache(tenantId, [
    ...existing.filter((item) => item.id !== optimistic.id),
    optimistic,
  ]);

  try {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(optimistic),
    });
    if (res.ok) {
      const data = (await res.json()) as { location: Location };
      const next = [
        ...listLocations(tenantId).filter((item) => item.id !== data.location.id),
        data.location,
      ];
      writeCache(tenantId, next);
      return data.location;
    }
  } catch {
    // optimistic retained
  }
  return optimistic;
}

export async function removeLocation(
  tenantId: string,
  locationId: string,
): Promise<void> {
  const id = tenantId.trim();
  writeCache(
    id,
    listLocations(id).filter((item) => item.id !== locationId),
  );
  try {
    await fetch(
      `/api/locations/${encodeURIComponent(locationId)}?tenantId=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch {
    // cache already updated
  }
}

export async function clearLocations(tenantId: string): Promise<void> {
  const id = tenantId.trim();
  const current = listLocations(id);
  writeCache(id, []);
  await Promise.all(
    current.map((item) => removeLocation(id, item.id).catch(() => undefined)),
  );
}
