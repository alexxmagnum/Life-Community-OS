/**
 * Property — residential unit (ADR-007), tenant-owned in product runtime.
 *
 * Geographic presence is Location (coordinates, address, territory).
 * People are not columns here — use PropertyPersonRelationship (ADR-008).
 * A dwelling is not a Business Profile.
 */

import type { DomainId, IsoDateTimeString } from "./ids";

export type HousingPropertyType =
  | "villa"
  | "apartment"
  | "townhouse"
  | "plot"
  | "other";

export const HOUSING_PROPERTY_TYPES: readonly HousingPropertyType[] = [
  "villa",
  "apartment",
  "townhouse",
  "plot",
  "other",
] as const;

export type HousingPropertyStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived";

export const HOUSING_PROPERTY_STATUSES: readonly HousingPropertyStatus[] = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;

/** How the dwelling is offered to the community. Private is never a public listing. */
export type HousingAvailability = "private" | "rent" | "sale";

export const HOUSING_AVAILABILITIES: readonly HousingAvailability[] = [
  "private",
  "rent",
  "sale",
] as const;

/**
 * Real-estate unit.
 * ADR-007 fields remain (`addressId`, `unitLabel`, `name`).
 * Product runtime adds tenant, Location, createdBy, type, status, privacy-safe copy.
 */
export type Property = {
  id: DomainId;
  /** Postal Address when known (ADR-006). Optional when Location carries the place. */
  addressId?: DomainId;
  tenantId?: DomainId;
  locationId?: DomainId;
  createdBy?: DomainId;
  title?: string;
  description?: string;
  images?: string[];
  propertyType?: HousingPropertyType;
  status?: HousingPropertyStatus;
  availability?: HousingAvailability;
  bedrooms?: number;
  bathrooms?: number;
  builtAreaM2?: number;
  areaLabel?: string;
  unitLabel?: string;
  name?: string;
  /**
   * Optional future links to Community Core — ids only, no duplicated groups/events.
   */
  communityGroupId?: DomainId;
  communityResourceId?: DomainId;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

/** Public projection — never includes owner, residents, or createdBy. */
export type PropertyPublicView = {
  id: DomainId;
  tenantId: DomainId;
  locationId?: DomainId;
  title: string;
  description: string;
  images: string[];
  propertyType: HousingPropertyType;
  status: HousingPropertyStatus;
  availability: HousingAvailability;
  bedrooms?: number;
  bathrooms?: number;
  builtAreaM2?: number;
  areaLabel?: string;
  unitLabel?: string;
  name?: string;
  /** Present only when the viewer has a membership on this property. */
  viewerRole?: string;
};

export function isHousingPropertyType(
  value: string,
): value is HousingPropertyType {
  return (HOUSING_PROPERTY_TYPES as readonly string[]).includes(value);
}

export function isHousingPropertyStatus(
  value: string,
): value is HousingPropertyStatus {
  return (HOUSING_PROPERTY_STATUSES as readonly string[]).includes(value);
}

export function isHousingAvailability(
  value: string,
): value is HousingAvailability {
  return (HOUSING_AVAILABILITIES as readonly string[]).includes(value);
}

export function housingPropertyTypeLabel(type: HousingPropertyType): string {
  switch (type) {
    case "villa":
      return "Villa";
    case "apartment":
      return "Piso";
    case "townhouse":
      return "Adosado";
    case "plot":
      return "Parcela";
    case "other":
      return "Otra";
  }
}

export function housingPropertyStatusLabel(
  status: HousingPropertyStatus,
): string {
  switch (status) {
    case "draft":
      return "Borrador";
    case "active":
      return "Activa";
    case "inactive":
      return "Inactiva";
    case "archived":
      return "Archivada";
  }
}

export function housingAvailabilityLabel(
  availability: HousingAvailability,
): string {
  switch (availability) {
    case "private":
      return "Uso privado";
    case "rent":
      return "En alquiler";
    case "sale":
      return "En venta";
  }
}

export type CreatePropertyInput = {
  tenantId: DomainId;
  createdBy: DomainId;
  title: string;
  description: string;
  propertyType: HousingPropertyType;
  locationId?: DomainId;
  addressId?: DomainId;
  images?: string[];
  status?: HousingPropertyStatus;
  availability?: HousingAvailability;
  bedrooms?: number;
  bathrooms?: number;
  builtAreaM2?: number;
  areaLabel?: string;
  unitLabel?: string;
  name?: string;
  id?: DomainId;
};

export function createPropertyRecord(input: CreatePropertyInput): Property {
  const now = new Date().toISOString();
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) {
    throw new Error("Invalid Property: missing_fields");
  }
  if (!isHousingPropertyType(input.propertyType)) {
    throw new Error("Invalid Property: invalid_type");
  }
  const status = input.status ?? "active";
  if (!isHousingPropertyStatus(status)) {
    throw new Error("Invalid Property: invalid_status");
  }
  const availability = input.availability ?? "private";
  if (!isHousingAvailability(availability)) {
    throw new Error("Invalid Property: invalid_availability");
  }
  const images = (input.images ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    id: input.id?.trim() || cryptoRandomId(),
    tenantId: input.tenantId.trim(),
    createdBy: input.createdBy.trim(),
    title,
    description,
    images,
    propertyType: input.propertyType,
    status,
    availability,
    name: input.name?.trim() || title,
    createdAt: now,
    updatedAt: now,
    ...(input.locationId?.trim() ? { locationId: input.locationId.trim() } : {}),
    ...(input.addressId?.trim() ? { addressId: input.addressId.trim() } : {}),
    ...(input.areaLabel?.trim() ? { areaLabel: input.areaLabel.trim() } : {}),
    ...(input.unitLabel?.trim() ? { unitLabel: input.unitLabel.trim() } : {}),
    ...(typeof input.bedrooms === "number" && Number.isFinite(input.bedrooms)
      ? { bedrooms: input.bedrooms }
      : {}),
    ...(typeof input.bathrooms === "number" && Number.isFinite(input.bathrooms)
      ? { bathrooms: input.bathrooms }
      : {}),
    ...(typeof input.builtAreaM2 === "number" &&
    Number.isFinite(input.builtAreaM2)
      ? { builtAreaM2: input.builtAreaM2 }
      : {}),
  };
}

export function toPropertyPublicView(
  property: Property,
  viewerRole?: string,
): PropertyPublicView | null {
  const tenantId = property.tenantId?.trim();
  const title = property.title?.trim() || property.name?.trim();
  const type = property.propertyType;
  const status = property.status ?? "active";
  const availability = property.availability ?? "private";
  if (!tenantId || !title || !type || !isHousingPropertyType(type)) {
    return null;
  }
  return {
    id: property.id,
    tenantId,
    title,
    description: property.description?.trim() || "",
    images: property.images ?? [],
    propertyType: type,
    status,
    availability,
    ...(property.locationId ? { locationId: property.locationId } : {}),
    ...(property.bedrooms != null ? { bedrooms: property.bedrooms } : {}),
    ...(property.bathrooms != null ? { bathrooms: property.bathrooms } : {}),
    ...(property.builtAreaM2 != null
      ? { builtAreaM2: property.builtAreaM2 }
      : {}),
    ...(property.areaLabel ? { areaLabel: property.areaLabel } : {}),
    ...(property.unitLabel ? { unitLabel: property.unitLabel } : {}),
    ...(property.name ? { name: property.name } : {}),
    ...(viewerRole ? { viewerRole } : {}),
  };
}

/** Public catalog: active dwellings offered for rent or sale. */
export function isPropertyPubliclyListed(property: Property): boolean {
  return (
    property.status === "active" &&
    (property.availability === "rent" || property.availability === "sale")
  );
}

function cryptoRandomId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
