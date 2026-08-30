/**
 * Marketplace listing repository.
 *
 * Production: PostgreSQL marketplace_listings.
 * Tests / dev fixture: apps/web/.data/marketplace when LCOS_MARKETPLACE_FIXTURE=1.
 * Owner is assigned from the session actor. Client owner ids are ignored.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createMarketplaceListingRecord,
  type MarketplaceListing,
  type MarketplaceListingStatus,
  type MarketplaceListingType,
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
import {
  asTerritoryUuid,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

export type MarketplaceWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

const DATA_DIR = path.join(process.cwd(), ".data", "marketplace");

function fixtureEnabled(): boolean {
  return process.env.LCOS_MARKETPLACE_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function readFileStore(tenantSlug: string): Promise<MarketplaceListing[]> {
  if (!isFilePersistenceAllowed()) return [];
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as MarketplaceListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFileStore(
  tenantSlug: string,
  listings: MarketplaceListing[],
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(listings, null, 2));
}

type ListingRow = {
  id: string;
  tenant_id: string;
  owner_person_id: string;
  created_by: string;
  type: MarketplaceListingType;
  category: string;
  title: string;
  description: string;
  images: unknown;
  price: number | string | null;
  status: MarketplaceListingStatus;
  location_id: string | null;
  territory_id: string | null;
  author_display_name: string;
  created_at: string;
  updated_at: string;
};

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function rowToListing(row: ListingRow, tenantSlug: string): MarketplaceListing {
  const priceRaw = row.price;
  const price =
    typeof priceRaw === "number"
      ? priceRaw
      : typeof priceRaw === "string" && priceRaw.trim()
        ? Number(priceRaw)
        : null;
  return {
    id: row.id,
    tenantId: tenantSlug,
    ownerPersonId: row.owner_person_id,
    createdBy: row.created_by,
    type: row.type,
    category: row.category,
    title: row.title,
    description: row.description,
    images: parseImages(row.images),
    price: price !== null && Number.isFinite(price) ? price : null,
    status: row.status,
    authorDisplayName: row.author_display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.location_id ? { locationId: row.location_id } : {}),
    ...(row.territory_id ? { territoryId: row.territory_id } : {}),
  };
}

async function loadListings(
  tenantSlug: string,
  scope?: MarketplaceWriteScope,
): Promise<MarketplaceListing[]> {
  if (fixtureEnabled() && isFilePersistenceAllowed()) return readFileStore(tenantSlug);
  if (!isDatabaseConfigured()) {
    if (!isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError();
    }
    return readFileStore(tenantSlug);
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return [];
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    return [];
  }
  const { data, error } = await client
    .from("marketplace_listings")
    .select("*")
    .eq("tenant_id", tenantUuid);
  if (error) {
    console.warn("[marketplace] list failed", error.message);
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    throw new PersistenceUnavailableError(error.message);
  }
  return (data as ListingRow[]).map((row) => rowToListing(row, tenantSlug));
}

async function persistListing(
  listing: MarketplaceListing,
  scope?: MarketplaceWriteScope,
): Promise<void> {
  const slug = resolveTenantPublicId(listing.tenantId);
  if (fixtureEnabled() && isFilePersistenceAllowed()) {
    const existing = await readFileStore(slug);
    await writeFileStore(slug, [
      ...existing.filter((item) => item.id !== listing.id),
      listing,
    ]);
    return;
  }
  if (isDatabaseConfigured()) {
    const tenantUuid = tenantSlugToUuid(slug);
    const client = tenantUuid
      ? await createDomainDatabaseClient(scope)
      : null;
    if (client && tenantUuid) {
      const { error } = await client.from("marketplace_listings").upsert({
        id: listing.id,
        tenant_id: tenantUuid,
        owner_person_id: listing.ownerPersonId,
        created_by: listing.createdBy,
        type: listing.type,
        category: listing.category,
        title: listing.title,
        description: listing.description,
        images: listing.images,
        price: listing.price,
        status: listing.status,
        location_id: listing.locationId ?? null,
        territory_id: asTerritoryUuid(listing.territoryId),
        author_display_name: listing.authorDisplayName,
        created_at: listing.createdAt,
        updated_at: listing.updatedAt,
      });
      if (!error) return;
      console.warn("[marketplace] upsert failed", error.message);
    }
  }
  const existing = await readFileStore(slug);
  await writeFileStore(slug, [
    ...existing.filter((item) => item.id !== listing.id),
    listing,
  ]);
}

export async function listMarketplaceListingsServer(
  tenantId: string,
  scope?: MarketplaceWriteScope,
): Promise<MarketplaceListing[]> {
  return loadListings(resolveTenantPublicId(tenantId), scope);
}

export async function getMarketplaceListingServer(
  tenantId: string,
  listingId: string,
  scope?: MarketplaceWriteScope,
): Promise<MarketplaceListing | null> {
  const all = await listMarketplaceListingsServer(tenantId, scope);
  return all.find((item) => item.id === listingId) ?? null;
}

export async function createMarketplaceListingServer(input: {
  tenantId: string;
  ownerPersonId: string;
  type: MarketplaceListingType;
  category?: string;
  title: string;
  description: string;
  images?: string[];
  price?: number | null;
  locationId?: string;
  territoryId?: string;
  authorDisplayName?: string;
  ownerPersonIdFromClient?: string | null;
  scope?: MarketplaceWriteScope;
}): Promise<MarketplaceListing> {
  void input.ownerPersonIdFromClient;
  const listing = createMarketplaceListingRecord({
    tenantId: resolveTenantPublicId(input.tenantId),
    ownerPersonId: input.ownerPersonId,
    createdBy: input.ownerPersonId,
    type: input.type,
    category: input.category ?? "general",
    title: input.title,
    description: input.description,
    images: input.images,
    price: input.price,
    locationId: input.locationId,
    authorDisplayName: input.authorDisplayName,
    status: "published",
    territoryId: resolveStampTerritoryId({
      tenantId: input.tenantId,
      explicit: input.territoryId,
    }),
  });
  await persistListing(listing, input.scope);
  return listing;
}

export async function updateMarketplaceListingServer(input: {
  tenantId: string;
  listingId: string;
  patch: {
    title?: string;
    description?: string;
    category?: string;
    images?: string[];
    price?: number | null;
    type?: MarketplaceListingType;
    status?: MarketplaceListingStatus;
    locationId?: string;
  };
  scope?: MarketplaceWriteScope;
}): Promise<MarketplaceListing | null> {
  const existing = await getMarketplaceListingServer(
    input.tenantId,
    input.listingId,
    input.scope,
  );
  if (!existing) return null;
  const next = createMarketplaceListingRecord({
    ...existing,
    title: input.patch.title ?? existing.title,
    description: input.patch.description ?? existing.description,
    category: input.patch.category ?? existing.category,
    images: input.patch.images ?? existing.images,
    price:
      input.patch.price === undefined ? existing.price : input.patch.price,
    type: input.patch.type ?? existing.type,
    status: input.patch.status ?? existing.status,
    locationId: input.patch.locationId ?? existing.locationId,
    ownerPersonId: existing.ownerPersonId,
    createdBy: existing.createdBy,
    id: existing.id,
    tenantId: existing.tenantId,
    authorDisplayName: existing.authorDisplayName,
    territoryId: existing.territoryId,
  });
  next.createdAt = existing.createdAt;
  next.updatedAt = new Date().toISOString();
  await persistListing(next, input.scope);
  return next;
}

export async function replaceMarketplaceStoreForTests(
  tenantId: string,
  listings: MarketplaceListing[] = [],
): Promise<void> {
  if (!isFilePersistenceAllowed()) return;
  await writeFileStore(resolveTenantPublicId(tenantId), listings);
}
