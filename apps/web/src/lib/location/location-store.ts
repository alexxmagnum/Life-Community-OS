/**
 * Multi-tenant Location repository (demo persistence).
 *
 * Location is the map SoT. Storage is keyed by tenantId — never hardcodes
 * a community. Swap for Supabase later without changing map projection.
 */

import {
  createLocation,
  type CreateLocationInput,
  type Location,
} from "@life-community-os/types";

const STORAGE_PREFIX = "lcos.locations.v1:";

type Listener = () => void;

const memoryByTenant = new Map<string, Location[]>();
const listeners = new Set<Listener>();

function storageKey(tenantId: string): string {
  return `${STORAGE_PREFIX}${tenantId}`;
}

function readStorage(tenantId: string): Location[] {
  if (typeof window === "undefined") {
    return memoryByTenant.get(tenantId) ?? [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey(tenantId));
    if (!raw) return memoryByTenant.get(tenantId) ?? [];
    const parsed = JSON.parse(raw) as Location[];
    if (!Array.isArray(parsed)) return [];
    memoryByTenant.set(tenantId, parsed);
    return parsed;
  } catch {
    return memoryByTenant.get(tenantId) ?? [];
  }
}

function writeStorage(tenantId: string, locations: Location[]): void {
  memoryByTenant.set(tenantId, locations);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(tenantId), JSON.stringify(locations));
  } catch {
    // Quota / private mode — keep memory only.
  }
  for (const listener of listeners) listener();
}

export function subscribeLocations(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listLocations(tenantId: string): Location[] {
  if (!tenantId.trim()) return [];
  return [...readStorage(tenantId.trim())];
}

export function getLocation(
  tenantId: string,
  locationId: string,
): Location | null {
  return (
    listLocations(tenantId).find((item) => item.id === locationId) ?? null
  );
}

export function saveLocation(input: CreateLocationInput): Location {
  const location = createLocation(input);
  const tenantId = location.tenantId;
  const existing = listLocations(tenantId);
  const next = [
    ...existing.filter((item) => item.id !== location.id),
    location,
  ];
  writeStorage(tenantId, next);
  return location;
}

export function removeLocation(tenantId: string, locationId: string): void {
  const next = listLocations(tenantId).filter((item) => item.id !== locationId);
  writeStorage(tenantId.trim(), next);
}

export function clearLocations(tenantId: string): void {
  writeStorage(tenantId.trim(), []);
}

/** Visible map locations for a tenant (public + members for demo). */
export function listVisibleMapLocations(tenantId: string): Location[] {
  return listLocations(tenantId).filter(
    (item) => item.visibility === "public" || item.visibility === "members",
  );
}
