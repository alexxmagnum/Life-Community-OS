/**
 * Server-side Location repository.
 *
 * Priority:
 * 1. Supabase when service credentials are present and reachable
 * 2. Durable JSON file under apps/web/.data/locations (survives browser/device)
 *
 * Never use browser localStorage as SoT.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createLocation,
  validateLocation,
  type CreateLocationInput,
  type Location,
} from "@life-community-os/types";
import {
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";

const DATA_DIR = path.join(process.cwd(), ".data", "locations");

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readFileStore(tenantSlug: string): Promise<Location[]> {
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Location[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => validateLocation(item).length === 0);
  } catch {
    return [];
  }
}

async function writeFileStore(
  tenantSlug: string,
  locations: Location[],
): Promise<void> {
  await ensureDir();
  await fs.writeFile(
    filePath(tenantSlug),
    JSON.stringify(locations, null, 2),
    "utf8",
  );
}

function hasSupabaseServiceEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

type LocationRow = {
  id: string;
  tenant_id: string;
  type: Location["type"];
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  visibility: Location["visibility"];
  geocode_provider: string | null;
  geocode_source_ref: string | null;
  geocode_display_name: string | null;
  contact: string | null;
  summary: string | null;
  image_url: string | null;
  hours: string | null;
  area_label: string | null;
  created_at: string;
  updated_at: string;
};

function rowToLocation(row: LocationRow, tenantSlug: string): Location {
  return {
    id: row.id,
    tenantId: tenantSlug,
    type: row.type,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category,
    visibility: row.visibility,
    ...(row.geocode_provider
      ? { geocodeProvider: row.geocode_provider }
      : {}),
    ...(row.geocode_source_ref
      ? { geocodeSourceRef: row.geocode_source_ref }
      : {}),
    ...(row.geocode_display_name
      ? { geocodeDisplayName: row.geocode_display_name }
      : {}),
    ...(row.contact ? { contact: row.contact } : {}),
    ...(row.summary ? { summary: row.summary } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.hours ? { hours: row.hours } : {}),
    ...(row.area_label ? { areaLabel: row.area_label } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function locationToRow(location: Location, tenantUuid: string): LocationRow {
  return {
    id: location.id,
    tenant_id: tenantUuid,
    type: location.type,
    name: location.name,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    category: location.category,
    visibility: location.visibility,
    geocode_provider: location.geocodeProvider ?? null,
    geocode_source_ref: location.geocodeSourceRef ?? null,
    geocode_display_name: location.geocodeDisplayName ?? null,
    contact: location.contact ?? null,
    summary: location.summary ?? null,
    image_url: location.imageUrl ?? null,
    hours: location.hours ?? null,
    area_label: location.areaLabel ?? null,
    created_at: location.createdAt ?? new Date().toISOString(),
    updated_at: location.updatedAt ?? new Date().toISOString(),
  };
}

async function listFromSupabase(tenantSlug: string): Promise<Location[] | null> {
  if (!hasSupabaseServiceEnv()) return null;
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return null;
  try {
    const { createServiceDatabaseClient } = await import(
      "@life-community-os/database"
    );
    const client = createServiceDatabaseClient();
    const { data, error } = await client
      .from("locations")
      .select("*")
      .eq("tenant_id", tenantUuid);
    if (error) {
      console.warn("[locations] supabase list failed, using file store", error.message);
      return null;
    }
    return (data as LocationRow[]).map((row) => rowToLocation(row, tenantSlug));
  } catch (err) {
    console.warn("[locations] supabase unavailable", err);
    return null;
  }
}

async function upsertSupabase(location: Location): Promise<boolean> {
  if (!hasSupabaseServiceEnv()) return false;
  const tenantUuid = tenantSlugToUuid(location.tenantId);
  if (!tenantUuid) return false;
  try {
    const { createServiceDatabaseClient } = await import(
      "@life-community-os/database"
    );
    const client = createServiceDatabaseClient();
    const row = locationToRow(location, tenantUuid);
    const { error } = await client.from("locations").upsert(row);
    if (error) {
      console.warn("[locations] supabase upsert failed", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function deleteSupabase(
  tenantSlug: string,
  locationId: string,
): Promise<boolean> {
  if (!hasSupabaseServiceEnv()) return false;
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return false;
  try {
    const { createServiceDatabaseClient } = await import(
      "@life-community-os/database"
    );
    const client = createServiceDatabaseClient();
    const { error } = await client
      .from("locations")
      .delete()
      .eq("tenant_id", tenantUuid)
      .eq("id", locationId);
    if (error) {
      console.warn("[locations] supabase delete failed", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function listLocationsServer(
  tenantId: string,
): Promise<Location[]> {
  const slug = resolveTenantPublicId(tenantId);
  const fromDb = await listFromSupabase(slug);
  if (fromDb) return fromDb;
  return readFileStore(slug);
}

export async function getLocationServer(
  tenantId: string,
  locationId: string,
): Promise<Location | null> {
  const all = await listLocationsServer(tenantId);
  return all.find((item) => item.id === locationId) ?? null;
}

export async function saveLocationServer(
  input: CreateLocationInput,
): Promise<Location> {
  const location = createLocation({
    ...input,
    tenantId: resolveTenantPublicId(input.tenantId),
  });
  const slug = location.tenantId;
  const wroteDb = await upsertSupabase(location);
  const existing = await readFileStore(slug);
  const next = [
    ...existing.filter((item) => item.id !== location.id),
    location,
  ];
  await writeFileStore(slug, next);
  if (!wroteDb) {
    // File store is authoritative when DB is unavailable.
  }
  return location;
}

export async function removeLocationServer(
  tenantId: string,
  locationId: string,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  await deleteSupabase(slug, locationId);
  const existing = await readFileStore(slug);
  await writeFileStore(
    slug,
    existing.filter((item) => item.id !== locationId),
  );
}

export async function replaceLocationsServer(
  tenantId: string,
  locations: Location[],
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  await writeFileStore(slug, locations);
  for (const location of locations) {
    await upsertSupabase({ ...location, tenantId: slug });
  }
}
