/**
 * Server-side Location repository.
 *
 * Production: PostgreSQL `locations` (tenant_id + ownership).
 * Development fixture: apps/web/.data/locations when DB is not the data plane.
 * Never localStorage. LocalEntity is a view — not stored here.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createLocation,
  optionalTerritoryField,
  validateLocation,
  type CreateLocationInput,
  type Location,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import {
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";
import { resolveOptionalTerritoryId } from "@/lib/tenant/resolve-territory";

export type LocationWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

const DATA_DIR = path.join(process.cwd(), ".data", "locations");

function uuidOrNull(value?: string | null): string | null {
  if (!value?.trim()) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

function locationFixtureEnabled(): boolean {
  return (
    process.env.LCOS_LOCATION_FIXTURE === "1" ||
    process.env.LCOS_BUSINESS_FIXTURE === "1"
  );
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function readFileStore(tenantSlug: string): Promise<Location[]> {
  if (!isFilePersistenceAllowed()) return [];
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
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    filePath(tenantSlug),
    JSON.stringify(locations, null, 2),
    "utf8",
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
  owner_id: string | null;
  created_by: string | null;
  business_id: string | null;
  territory_id: string | null;
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
    ...(row.owner_id ? { ownerId: row.owner_id } : {}),
    ...(row.created_by ? { createdBy: row.created_by } : {}),
    ...(row.business_id ? { businessId: row.business_id } : {}),
    ...(row.territory_id ? { territoryId: row.territory_id } : {}),
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
    owner_id: location.ownerId ?? null,
    created_by: location.createdBy ?? null,
    business_id: location.businessId ?? null,
    territory_id: uuidOrNull(location.territoryId),
    created_at: location.createdAt ?? new Date().toISOString(),
    updated_at: location.updatedAt ?? new Date().toISOString(),
  };
}

async function listFromDatabase(
  tenantSlug: string,
  scope?: LocationWriteScope,
): Promise<Location[] | null> {
  if (!isDatabaseConfigured()) return null;
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return null;
  const client = await createDomainDatabaseClient(scope);
  if (!client) return null;
  const { data, error } = await client
    .from("locations")
    .select("*")
    .eq("tenant_id", tenantUuid);
  if (error) {
    console.warn("[locations] list failed", error.message);
    if (!isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError(error.message);
    }
    return null;
  }
  return (data as LocationRow[]).map((row) => rowToLocation(row, tenantSlug));
}

async function upsertDatabase(
  location: Location,
  scope?: LocationWriteScope,
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const tenantUuid = tenantSlugToUuid(location.tenantId);
  if (!tenantUuid) return false;
  const client = await createDomainDatabaseClient(scope);
  if (!client) return false;
  const row = locationToRow(location, tenantUuid);
  const { error } = await client.from("locations").upsert(row);
  if (error) {
    console.warn("[locations] upsert failed", error.message);
    return false;
  }
  return true;
}

async function deleteDatabase(
  tenantSlug: string,
  locationId: string,
  scope?: LocationWriteScope,
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return false;
  const client = await createDomainDatabaseClient(scope);
  if (!client) return false;
  const { error } = await client
    .from("locations")
    .delete()
    .eq("tenant_id", tenantUuid)
    .eq("id", locationId);
  if (error) {
    console.warn("[locations] delete failed", error.message);
    return false;
  }
  return true;
}

export async function listLocationsServer(
  tenantId: string,
  scope?: LocationWriteScope,
): Promise<Location[]> {
  const slug = resolveTenantPublicId(tenantId);
  if (locationFixtureEnabled() && isFilePersistenceAllowed()) {
    return readFileStore(slug);
  }
  const fromDb = await listFromDatabase(slug, scope);
  if (fromDb) return fromDb;
  if (!isFilePersistenceAllowed()) {
    if (isDatabaseConfigured()) return [];
    throw new PersistenceUnavailableError();
  }
  return readFileStore(slug);
}

export async function getLocationServer(
  tenantId: string,
  locationId: string,
  scope?: LocationWriteScope,
): Promise<Location | null> {
  const all = await listLocationsServer(tenantId, scope);
  return all.find((item) => item.id === locationId) ?? null;
}

export async function saveLocationServer(
  input: CreateLocationInput,
  scope?: LocationWriteScope,
): Promise<Location> {
  const ownerId = input.ownerId?.trim() || scope?.personId?.trim() || undefined;
  const createdBy =
    input.createdBy?.trim() || scope?.personId?.trim() || undefined;
  const slug = resolveTenantPublicId(input.tenantId);
  const location = createLocation({
    ...input,
    tenantId: slug,
    ownerId,
    createdBy,
    // Location may exist without Territory — never invent from Tenant alone.
    ...optionalTerritoryField(
      resolveOptionalTerritoryId({
        explicit: input.territoryId,
      }),
    ),
  });
  if (!locationFixtureEnabled()) {
    const wroteDb = await upsertDatabase(location, scope);
    if (wroteDb) return location;
  }
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError("Location write requires Postgres");
  }
  const existing = await readFileStore(slug);
  const next = [
    ...existing.filter((item) => item.id !== location.id),
    location,
  ];
  await writeFileStore(slug, next);
  return location;
}

export async function removeLocationServer(
  tenantId: string,
  locationId: string,
  scope?: LocationWriteScope,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  if (!locationFixtureEnabled()) {
    const deleted = await deleteDatabase(slug, locationId, scope);
    if (deleted) return;
  }
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError("Location delete requires Postgres");
  }
  const existing = await readFileStore(slug);
  await writeFileStore(
    slug,
    existing.filter((item) => item.id !== locationId),
  );
}

export async function replaceLocationsServer(
  tenantId: string,
  locations: Location[],
  scope?: LocationWriteScope,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  for (const location of locations) {
    const wrote = await upsertDatabase({ ...location, tenantId: slug }, scope);
    if (!wrote && !isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError();
    }
  }
  if (!isDatabaseConfigured() && isFilePersistenceAllowed()) {
    await writeFileStore(slug, locations);
  }
}

export async function replaceLocationsForTests(
  tenantId: string,
  locations: Location[] = [],
): Promise<void> {
  if (!isFilePersistenceAllowed()) return;
  await writeFileStore(resolveTenantPublicId(tenantId), locations);
}
