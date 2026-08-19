/**
 * Housing Property repository.
 *
 * Production: PostgreSQL properties + property_person_relationships.
 * Tests / dev fixture: apps/web/.data/housing when LCOS_HOUSING_FIXTURE=1.
 * Owner membership is assigned from the session actor. Client owner ids are ignored.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createPropertyMembershipRecord,
  createPropertyRecord,
  type HousingAvailability,
  type HousingPropertyStatus,
  type HousingPropertyType,
  type Property,
  type PropertyMembership,
  type PropertyPersonRelationshipType,
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
  getLocationServer,
  saveLocationServer,
  type LocationWriteScope,
} from "@/lib/location/server-location-repository";
import type { Location } from "@life-community-os/types";

export type HousingWriteScope = LocationWriteScope;

type HousingStore = {
  properties: Property[];
  memberships: PropertyMembership[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "housing");

function fixtureEnabled(): boolean {
  return process.env.LCOS_HOUSING_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

function emptyStore(): HousingStore {
  return { properties: [], memberships: [] };
}

async function readFileStore(tenantSlug: string): Promise<HousingStore> {
  if (!isFilePersistenceAllowed()) return emptyStore();
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<HousingStore>;
    return {
      properties: Array.isArray(parsed.properties) ? parsed.properties : [],
      memberships: Array.isArray(parsed.memberships) ? parsed.memberships : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(
  tenantSlug: string,
  store: HousingStore,
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2));
}

type PropertyRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  address_id: string | null;
  created_by: string | null;
  title: string | null;
  description: string;
  images: unknown;
  property_type: string;
  status: string;
  availability: string;
  bedrooms: number | null;
  bathrooms: number | null;
  built_area_m2: number | string | null;
  area_label: string | null;
  unit_label: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
};

type MembershipRow = {
  id: string;
  tenant_id: string | null;
  property_id: string;
  person_id: string;
  relationship_type: string;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function rowToProperty(row: PropertyRow, tenantSlug: string): Property {
  const built =
    typeof row.built_area_m2 === "number"
      ? row.built_area_m2
      : typeof row.built_area_m2 === "string" && row.built_area_m2.trim()
        ? Number(row.built_area_m2)
        : undefined;
  return {
    id: row.id,
    tenantId: tenantSlug,
    createdBy: row.created_by ?? undefined,
    title: row.title ?? row.name ?? "",
    description: row.description,
    images: parseImages(row.images),
    propertyType: row.property_type as HousingPropertyType,
    status: row.status as HousingPropertyStatus,
    availability: row.availability as HousingAvailability,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.location_id ? { locationId: row.location_id } : {}),
    ...(row.address_id ? { addressId: row.address_id } : {}),
    ...(row.name ? { name: row.name } : {}),
    ...(row.area_label ? { areaLabel: row.area_label } : {}),
    ...(row.unit_label ? { unitLabel: row.unit_label } : {}),
    ...(row.bedrooms != null ? { bedrooms: row.bedrooms } : {}),
    ...(row.bathrooms != null ? { bathrooms: row.bathrooms } : {}),
    ...(built != null && Number.isFinite(built) ? { builtAreaM2: built } : {}),
  };
}

function rowToMembership(
  row: MembershipRow,
  tenantSlug: string,
): PropertyMembership {
  return {
    id: row.id,
    propertyId: row.property_id,
    personId: row.person_id,
    relationshipType: row.relationship_type as PropertyPersonRelationshipType,
    status: row.status as PropertyMembership["status"],
    tenantId: tenantSlug,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadStore(
  tenantSlug: string,
  scope?: HousingWriteScope,
): Promise<HousingStore> {
  if (fixtureEnabled()) return readFileStore(tenantSlug);
  if (!isDatabaseConfigured()) {
    if (!isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError();
    }
    return readFileStore(tenantSlug);
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return emptyStore();
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    return emptyStore();
  }
  const [props, members] = await Promise.all([
    client.from("properties").select("*").eq("tenant_id", tenantUuid),
    client
      .from("property_person_relationships")
      .select("*")
      .eq("tenant_id", tenantUuid),
  ]);
  if (props.error) {
    console.warn("[housing] list properties failed", props.error.message);
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    throw new PersistenceUnavailableError(props.error.message);
  }
  if (members.error) {
    console.warn("[housing] list memberships failed", members.error.message);
  }
  return {
    properties: ((props.data ?? []) as PropertyRow[]).map((row) =>
      rowToProperty(row, tenantSlug),
    ),
    memberships: ((members.data ?? []) as MembershipRow[]).map((row) =>
      rowToMembership(row, tenantSlug),
    ),
  };
}

async function persistStore(
  tenantSlug: string,
  store: HousingStore,
  scope?: HousingWriteScope,
): Promise<void> {
  if (fixtureEnabled()) {
    await writeFileStore(tenantSlug, store);
    return;
  }
  if (isDatabaseConfigured()) {
    const tenantUuid = tenantSlugToUuid(tenantSlug);
    const client = tenantUuid
      ? await createDomainDatabaseClient(scope)
      : null;
    if (client && tenantUuid) {
      const propertyRows = store.properties.map((item) => ({
        id: item.id,
        tenant_id: tenantUuid,
        location_id: item.locationId ?? null,
        address_id: item.addressId ?? null,
        created_by: item.createdBy ?? null,
        title: item.title ?? null,
        description: item.description ?? "",
        images: item.images ?? [],
        property_type: item.propertyType ?? "other",
        status: item.status ?? "active",
        availability: item.availability ?? "private",
        bedrooms: item.bedrooms ?? null,
        bathrooms: item.bathrooms ?? null,
        built_area_m2: item.builtAreaM2 ?? null,
        area_label: item.areaLabel ?? null,
        unit_label: item.unitLabel ?? null,
        name: item.name ?? item.title ?? null,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }));
      const memberRows = store.memberships.map((item) => ({
        id: item.id,
        tenant_id: tenantUuid,
        property_id: item.propertyId,
        person_id: item.personId,
        relationship_type: item.relationshipType,
        status: item.status,
        created_by: item.createdBy ?? null,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }));
      const propErr =
        propertyRows.length > 0
          ? await client.from("properties").upsert(propertyRows)
          : { error: null };
      const memErr =
        memberRows.length > 0
          ? await client
              .from("property_person_relationships")
              .upsert(memberRows)
          : { error: null };
      if (!propErr.error && !memErr.error) return;
      console.warn(
        "[housing] upsert failed",
        propErr.error?.message ?? memErr.error?.message,
      );
    }
  }
  await writeFileStore(tenantSlug, store);
}

function locationVisibilityFor(property: Property): "private" | "members" {
  if (
    property.status === "active" &&
    (property.availability === "rent" || property.availability === "sale")
  ) {
    return "members";
  }
  return "private";
}

export async function listHousingStore(
  tenantId: string,
  scope?: HousingWriteScope,
): Promise<HousingStore> {
  return loadStore(resolveTenantPublicId(tenantId), scope);
}

export async function listPropertiesServer(
  tenantId: string,
  scope?: HousingWriteScope,
): Promise<Property[]> {
  const store = await listHousingStore(tenantId, scope);
  return store.properties;
}

export async function listMembershipsServer(
  tenantId: string,
  scope?: HousingWriteScope,
): Promise<PropertyMembership[]> {
  const store = await listHousingStore(tenantId, scope);
  return store.memberships;
}

export async function getPropertyServer(
  tenantId: string,
  propertyId: string,
  scope?: HousingWriteScope,
): Promise<{ property: Property; memberships: PropertyMembership[] } | null> {
  const store = await listHousingStore(tenantId, scope);
  const property = store.properties.find((item) => item.id === propertyId);
  if (!property) return null;
  return {
    property,
    memberships: store.memberships.filter((item) => item.propertyId === propertyId),
  };
}

export async function createRegisteredProperty(input: {
  tenantId: string;
  createdBy: string;
  title: string;
  description: string;
  propertyType: HousingPropertyType;
  address: string;
  latitude: number;
  longitude: number;
  availability?: HousingAvailability;
  status?: HousingPropertyStatus;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  builtAreaM2?: number;
  areaLabel?: string;
  unitLabel?: string;
  geocodeProvider?: string;
  geocodeSourceRef?: string;
  geocodeDisplayName?: string;
  ownerPersonIdFromClient?: string | null;
  scope?: HousingWriteScope;
}): Promise<{ property: Property; location: Location; ownerMembership: PropertyMembership }> {
  void input.ownerPersonIdFromClient;
  const slug = resolveTenantPublicId(input.tenantId);
  const createdBy = input.createdBy.trim();
  if (!createdBy) {
    throw new Error("owner_required");
  }

  const location = await saveLocationServer(
    {
      tenantId: slug,
      type: "community-place",
      name: input.title,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.propertyType,
      visibility: "private",
      ownerId: createdBy,
      createdBy,
      summary: input.description,
      areaLabel: input.areaLabel,
      imageUrl: input.images?.[0],
      geocodeProvider: input.geocodeProvider,
      geocodeSourceRef: input.geocodeSourceRef,
      geocodeDisplayName: input.geocodeDisplayName,
    },
    input.scope,
  );

  const property = createPropertyRecord({
    tenantId: slug,
    createdBy,
    title: input.title,
    description: input.description,
    propertyType: input.propertyType,
    locationId: location.id,
    images: input.images,
    availability: input.availability ?? "private",
    status: input.status ?? "active",
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    builtAreaM2: input.builtAreaM2,
    areaLabel: input.areaLabel,
    unitLabel: input.unitLabel,
  });

  const ownerMembership = createPropertyMembershipRecord({
    tenantId: slug,
    propertyId: property.id,
    personId: createdBy,
    relationshipType: "owner",
    createdBy,
    status: "active",
  });

  const store = await loadStore(slug, input.scope);
  store.properties = [
    ...store.properties.filter((item) => item.id !== property.id),
    property,
  ];
  store.memberships = [
    ...store.memberships.filter((item) => item.id !== ownerMembership.id),
    ownerMembership,
  ];
  await persistStore(slug, store, input.scope);

  const linked = await saveLocationServer(
    {
      ...location,
      visibility: locationVisibilityFor(property),
      ownerId: createdBy,
      createdBy,
    },
    input.scope,
  );

  return { property, location: linked, ownerMembership };
}

export async function updatePropertyServer(input: {
  tenantId: string;
  propertyId: string;
  patch: {
    title?: string;
    description?: string;
    propertyType?: HousingPropertyType;
    status?: HousingPropertyStatus;
    availability?: HousingAvailability;
    images?: string[];
    bedrooms?: number;
    bathrooms?: number;
    builtAreaM2?: number;
    areaLabel?: string;
    unitLabel?: string;
  };
  scope?: HousingWriteScope;
}): Promise<Property | null> {
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const existing = store.properties.find((item) => item.id === input.propertyId);
  if (!existing) return null;
  const next = createPropertyRecord({
    id: existing.id,
    tenantId: existing.tenantId ?? slug,
    createdBy: existing.createdBy ?? "",
    title: input.patch.title ?? existing.title ?? "",
    description: input.patch.description ?? existing.description ?? "",
    propertyType: input.patch.propertyType ?? existing.propertyType ?? "other",
    locationId: existing.locationId,
    addressId: existing.addressId,
    images: input.patch.images ?? existing.images,
    status: input.patch.status ?? existing.status,
    availability: input.patch.availability ?? existing.availability,
    bedrooms: input.patch.bedrooms ?? existing.bedrooms,
    bathrooms: input.patch.bathrooms ?? existing.bathrooms,
    builtAreaM2: input.patch.builtAreaM2 ?? existing.builtAreaM2,
    areaLabel: input.patch.areaLabel ?? existing.areaLabel,
    unitLabel: input.patch.unitLabel ?? existing.unitLabel,
    name: existing.name,
  });
  next.createdAt = existing.createdAt;
  next.updatedAt = new Date().toISOString();
  store.properties = store.properties.map((item) =>
    item.id === next.id ? next : item,
  );
  await persistStore(slug, store, input.scope);
  if (next.locationId) {
    const existingLoc = await getLocationServer(
      slug,
      next.locationId,
      input.scope,
    );
    if (existingLoc) {
      await saveLocationServer(
        {
          ...existingLoc,
          name: next.title ?? existingLoc.name,
          summary: next.description,
          areaLabel: next.areaLabel ?? existingLoc.areaLabel,
          imageUrl: next.images?.[0] ?? existingLoc.imageUrl,
          visibility: locationVisibilityFor(next),
          ownerId: next.createdBy ?? existingLoc.ownerId,
          createdBy: next.createdBy ?? existingLoc.createdBy,
        },
        input.scope,
      );
    }
  }
  return next;
}

export async function addPropertyMemberServer(input: {
  tenantId: string;
  propertyId: string;
  personId: string;
  relationshipType: PropertyPersonRelationshipType;
  createdBy: string;
  scope?: HousingWriteScope;
}): Promise<PropertyMembership | null> {
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const property = store.properties.find((item) => item.id === input.propertyId);
  if (!property) return null;
  const existing = store.memberships.find(
    (item) =>
      item.propertyId === input.propertyId &&
      item.personId === input.personId.trim() &&
      item.status === "active",
  );
  if (existing) return existing;
  const membership = createPropertyMembershipRecord({
    tenantId: slug,
    propertyId: input.propertyId,
    personId: input.personId,
    relationshipType: input.relationshipType,
    createdBy: input.createdBy,
    status: "active",
  });
  store.memberships = [...store.memberships, membership];
  await persistStore(slug, store, input.scope);
  return membership;
}

export async function replaceHousingStoreForTests(
  tenantId: string,
  store: HousingStore = emptyStore(),
): Promise<void> {
  if (!isFilePersistenceAllowed()) return;
  await writeFileStore(resolveTenantPublicId(tenantId), store);
}
