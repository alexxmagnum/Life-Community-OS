/**
 * Business Profile repository.
 *
 * Production: PostgreSQL business_profiles + locations (map SoT).
 * Development / tests: apps/web/.data/businesses when the fixture flag is on
 * or Postgres is not the data plane.
 *
 * Ownership is assigned from the session actor. Client owner ids are ignored.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createBusinessProfile,
  createLocation,
  validateBusinessProfile,
  type BusinessProfile,
  type BusinessProfileStatus,
  type CreateLocationInput,
  type Location,
  type LocationType,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import {
  getLocationServer,
  listLocationsServer,
  saveLocationServer,
  type LocationWriteScope,
} from "@/lib/location/server-location-repository";
import {
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";
import { locationVisibilityForStatus } from "./permissions";

export type BusinessWriteScope = LocationWriteScope;

const DATA_DIR = path.join(process.cwd(), ".data", "businesses");

function businessFixtureEnabled(): boolean {
  return isFilePersistenceAllowed() && process.env.LCOS_BUSINESS_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function readFileStore(tenantSlug: string): Promise<BusinessProfile[]> {
  if (!isFilePersistenceAllowed()) return [];
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as BusinessProfile[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => validateBusinessProfile(item).length === 0);
  } catch {
    return [];
  }
}

async function writeFileStore(
  tenantSlug: string,
  businesses: BusinessProfile[],
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    filePath(tenantSlug),
    JSON.stringify(businesses, null, 2),
    "utf8",
  );
}

type BusinessRow = {
  id: string;
  tenant_id: string;
  owner_person_id: string;
  location_id: string;
  name: string;
  category: string;
  description: string;
  contact: string | null;
  hours: string | null;
  image_url: string | null;
  status: BusinessProfileStatus;
  created_at: string;
  updated_at: string;
};

function rowToBusiness(row: BusinessRow, tenantSlug: string): BusinessProfile {
  return {
    id: row.id,
    tenantId: tenantSlug,
    ownerPersonId: row.owner_person_id,
    locationId: row.location_id,
    name: row.name,
    category: row.category,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.contact ? { contact: row.contact } : {}),
    ...(row.hours ? { hours: row.hours } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
  };
}

function businessToRow(
  business: BusinessProfile,
  tenantUuid: string,
): BusinessRow {
  return {
    id: business.id,
    tenant_id: tenantUuid,
    owner_person_id: business.ownerPersonId,
    location_id: business.locationId,
    name: business.name,
    category: business.category,
    description: business.description,
    contact: business.contact ?? null,
    hours: business.hours ?? null,
    image_url: business.imageUrl ?? null,
    status: business.status,
    created_at: business.createdAt,
    updated_at: business.updatedAt,
  };
}

async function listFromDatabase(
  tenantSlug: string,
  scope?: BusinessWriteScope,
): Promise<BusinessProfile[] | null> {
  if (!isDatabaseConfigured()) return null;
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return null;
  const client = await createDomainDatabaseClient(scope);
  if (!client) return null;
  const { data, error } = await client
    .from("business_profiles")
    .select("*")
    .eq("tenant_id", tenantUuid);
  if (error) {
    console.warn("[business] list failed", error.message);
    if (!isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError(error.message);
    }
    return null;
  }
  return (data as BusinessRow[]).map((row) => rowToBusiness(row, tenantSlug));
}

async function upsertDatabase(
  business: BusinessProfile,
  scope?: BusinessWriteScope,
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const tenantUuid = tenantSlugToUuid(business.tenantId);
  if (!tenantUuid) return false;
  const client = await createDomainDatabaseClient(scope);
  if (!client) return false;
  const { error } = await client
    .from("business_profiles")
    .upsert(businessToRow(business, tenantUuid));
  if (error) {
    console.warn("[business] upsert failed", error.message);
    return false;
  }
  return true;
}

async function loadBusinesses(
  tenantSlug: string,
  scope?: BusinessWriteScope,
): Promise<BusinessProfile[]> {
  if (businessFixtureEnabled()) {
    return readFileStore(tenantSlug);
  }
  const fromDb = await listFromDatabase(tenantSlug, scope);
  if (fromDb) return fromDb;
  if (!isFilePersistenceAllowed()) {
    if (isDatabaseConfigured()) return [];
    throw new PersistenceUnavailableError();
  }
  return readFileStore(tenantSlug);
}

async function persistBusiness(
  business: BusinessProfile,
  scope?: BusinessWriteScope,
): Promise<void> {
  const slug = resolveTenantPublicId(business.tenantId);
  if (businessFixtureEnabled()) {
    const existing = await readFileStore(slug);
    await writeFileStore(slug, [
      ...existing.filter((item) => item.id !== business.id),
      business,
    ]);
    return;
  }
  const wrote = await upsertDatabase(business, scope);
  if (wrote) return;
  const existing = await readFileStore(slug);
  await writeFileStore(slug, [
    ...existing.filter((item) => item.id !== business.id),
    business,
  ]);
}

export async function listBusinessesServer(
  tenantId: string,
  scope?: BusinessWriteScope,
): Promise<BusinessProfile[]> {
  return loadBusinesses(resolveTenantPublicId(tenantId), scope);
}

export async function getBusinessServer(
  tenantId: string,
  businessId: string,
  scope?: BusinessWriteScope,
): Promise<BusinessProfile | null> {
  const all = await listBusinessesServer(tenantId, scope);
  return all.find((item) => item.id === businessId) ?? null;
}

export async function getBusinessByLocationServer(
  tenantId: string,
  locationId: string,
  scope?: BusinessWriteScope,
): Promise<BusinessProfile | null> {
  const all = await listBusinessesServer(tenantId, scope);
  return all.find((item) => item.locationId === locationId) ?? null;
}

export type RegisterBusinessInput = {
  tenantId: string;
  ownerPersonId: string;
  name: string;
  category: string;
  description?: string;
  contact?: string;
  hours?: string;
  imageUrl?: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: LocationType;
  geocodeProvider?: string;
  geocodeSourceRef?: string;
  geocodeDisplayName?: string;
  areaLabel?: string;
  /** Ignored. Ownership is session-bound. */
  ownerPersonIdFromClient?: string | null;
  scope?: BusinessWriteScope;
};

export async function createRegisteredBusiness(
  input: RegisterBusinessInput,
): Promise<{ business: BusinessProfile; location: Location }> {
  void input.ownerPersonIdFromClient;
  const slug = resolveTenantPublicId(input.tenantId);
  const ownerPersonId = input.ownerPersonId.trim();
  if (!ownerPersonId) {
    throw new Error("owner_required");
  }

  const locationDraft: CreateLocationInput = {
    tenantId: slug,
    type: input.type ?? "business",
    name: input.name,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    category: input.category,
    visibility: "private",
    ownerId: ownerPersonId,
    createdBy: ownerPersonId,
    geocodeProvider: input.geocodeProvider,
    geocodeSourceRef: input.geocodeSourceRef,
    geocodeDisplayName: input.geocodeDisplayName,
    contact: input.contact,
    summary: input.description,
    hours: input.hours,
    imageUrl: input.imageUrl,
    areaLabel: input.areaLabel,
  };
  const location = await saveLocationServer(locationDraft, input.scope);

  const business = createBusinessProfile({
    tenantId: slug,
    ownerPersonId,
    locationId: location.id,
    name: input.name,
    category: input.category,
    description: input.description,
    contact: input.contact,
    hours: input.hours,
    imageUrl: input.imageUrl,
    status: "draft",
  });

  const linked = createLocation({
    ...location,
    businessId: business.id,
    ownerId: ownerPersonId,
    createdBy: ownerPersonId,
    visibility: "private",
  });
  await saveLocationServer(linked, input.scope);
  await persistBusiness(business, input.scope);
  return { business, location: linked };
}

async function syncLocationPresence(
  business: BusinessProfile,
  scope?: BusinessWriteScope,
): Promise<Location | null> {
  const existing = await getLocationServer(
    business.tenantId,
    business.locationId,
    scope,
  );
  if (!existing) return null;
  return saveLocationServer(
    {
      ...existing,
      name: business.name,
      category: business.category,
      summary: business.description,
      contact: business.contact,
      hours: business.hours,
      imageUrl: business.imageUrl,
      visibility: locationVisibilityForStatus(business.status),
      ownerId: existing.ownerId ?? business.ownerPersonId,
      createdBy: existing.createdBy ?? business.ownerPersonId,
      businessId: business.id,
    },
    scope,
  );
}

export async function updateBusinessProfile(input: {
  tenantId: string;
  businessId: string;
  patch: {
    name?: string;
    category?: string;
    description?: string;
    contact?: string;
    hours?: string;
    imageUrl?: string;
  };
  scope?: BusinessWriteScope;
}): Promise<BusinessProfile | null> {
  const existing = await getBusinessServer(
    input.tenantId,
    input.businessId,
    input.scope,
  );
  if (!existing) return null;
  const next = createBusinessProfile({
    ...existing,
    name: input.patch.name ?? existing.name,
    category: input.patch.category ?? existing.category,
    description: input.patch.description ?? existing.description,
    contact: input.patch.contact ?? existing.contact,
    hours: input.patch.hours ?? existing.hours,
    imageUrl: input.patch.imageUrl ?? existing.imageUrl,
    status: existing.status,
    ownerPersonId: existing.ownerPersonId,
    locationId: existing.locationId,
    id: existing.id,
    tenantId: existing.tenantId,
  });
  next.createdAt = existing.createdAt;
  next.updatedAt = new Date().toISOString();
  await persistBusiness(next, input.scope);
  await syncLocationPresence(next, input.scope);
  return next;
}

export async function setBusinessStatus(input: {
  tenantId: string;
  businessId: string;
  status: BusinessProfileStatus;
  scope?: BusinessWriteScope;
}): Promise<BusinessProfile | null> {
  const existing = await getBusinessServer(
    input.tenantId,
    input.businessId,
    input.scope,
  );
  if (!existing) return null;
  const next: BusinessProfile = {
    ...existing,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };
  await persistBusiness(next, input.scope);
  await syncLocationPresence(next, input.scope);
  return next;
}

export function publishedLocationsForTenant(
  locations: Location[],
  businesses: BusinessProfile[],
): Location[] {
  const published = new Set(
    businesses
      .filter((item) => item.status === "published")
      .map((item) => item.locationId),
  );
  return locations.filter((location) => {
    if (location.businessId) {
      return published.has(location.id) && location.visibility !== "private";
    }
    return location.visibility === "public" || location.visibility === "members";
  });
}

export async function replaceBusinessStoreForTests(
  tenantId: string,
  businesses: BusinessProfile[] = [],
): Promise<void> {
  if (!isFilePersistenceAllowed()) return;
  await writeFileStore(resolveTenantPublicId(tenantId), businesses);
}

export async function listLocationsForMapVisibility(
  tenantId: string,
  scope?: BusinessWriteScope,
): Promise<Location[]> {
  const slug = resolveTenantPublicId(tenantId);
  const [locations, businesses] = await Promise.all([
    listLocationsServer(slug, scope),
    listBusinessesServer(slug, scope),
  ]);
  return publishedLocationsForTenant(locations, businesses).filter(
    (item) => item.visibility === "public" || item.visibility === "members",
  );
}
