/**
 * Location — reusable map-facing place entity (platform Core).
 *
 * Source of truth for “what appears on the map” for any tenant / business.
 * Distinct from Address (ADR-006 postal identity): Location carries name,
 * category, visibility, and resolved WGS84 coordinates for MapLibre.
 *
 * LifeMapObject is a projection of Location — never the reverse.
 * Tenant-neutral — no Panoramica catalogs or hardcoded places.
 */

import type { DomainId, IsoDateTimeString } from "./ids";

/** Product kinds that can be registered and shown on Life Map. */
export type LocationType =
  | "business"
  | "service"
  | "facility"
  | "event"
  | "community-place";

export const LOCATION_TYPES: readonly LocationType[] = [
  "business",
  "service",
  "facility",
  "event",
  "community-place",
] as const;

export type LocationVisibility = "public" | "members" | "private";

export const LOCATION_VISIBILITIES: readonly LocationVisibility[] = [
  "public",
  "members",
  "private",
] as const;

/**
 * Reusable Location aggregate — multi-tenant, geocoded, map-ready.
 */
export type Location = {
  id: DomainId;
  tenantId: DomainId;
  /** Geographic Territory this place belongs to. Additive — tenantId remains. */
  territoryId?: DomainId;
  type: LocationType;
  name: string;
  /** Free-text postal / place address used for geocoding. */
  address: string;
  latitude: number;
  longitude: number;
  /** Business / product category label (e.g. restaurant, padel). */
  category: string;
  visibility: LocationVisibility;
  /** Geocoder provider id that produced coordinates (e.g. nominatim). */
  geocodeProvider?: string;
  /** Opaque provider place id / osm id when known. */
  geocodeSourceRef?: string;
  /** Provider display name for confirmation UI. */
  geocodeDisplayName?: string;
  /**
   * Optional contact handle — phone, email, or URL.
   * When present, context cards may offer a contact action.
   */
  contact?: string;
  /** Short place story for fichas / discovery (optional product profile). */
  summary?: string;
  /** Hero / card image URL (optional product profile). */
  imageUrl?: string;
  /** Human hours line, e.g. "Lun–Dom 10:00–22:00". */
  hours?: string;
  /** Neighbourhood / area label for discovery ranking (not a security boundary). */
  areaLabel?: string;
  /** Person who owns this place when member-created. Absent for catalog fixtures. */
  ownerId?: DomainId;
  /** Person who first persisted this Location. */
  createdBy?: DomainId;
  /**
   * Optional Business Profile id when this Location is commercial presence.
   * Coordinates stay here — never on the Business Profile.
   */
  businessId?: DomainId;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

export type LocationIssueCode =
  | "missing_id"
  | "missing_tenant"
  | "missing_name"
  | "missing_address"
  | "invalid_coordinates"
  | "invalid_type"
  | "invalid_visibility"
  | "missing_category"
  | "territory_mismatch";

export type LocationIssue = {
  code: LocationIssueCode;
  message: string;
};

export function isLocationType(value: string): value is LocationType {
  return (LOCATION_TYPES as readonly string[]).includes(value);
}

export function isLocationVisibility(
  value: string,
): value is LocationVisibility {
  return (LOCATION_VISIBILITIES as readonly string[]).includes(value);
}

export function validateLocation(input: Location): LocationIssue[] {
  const issues: LocationIssue[] = [];

  if (!input.id?.trim()) {
    issues.push({ code: "missing_id", message: "id is required" });
  }
  if (!input.tenantId?.trim()) {
    issues.push({ code: "missing_tenant", message: "tenantId is required" });
  }
  if (!input.name?.trim()) {
    issues.push({ code: "missing_name", message: "name is required" });
  }
  if (!input.address?.trim()) {
    issues.push({ code: "missing_address", message: "address is required" });
  }
  if (!input.category?.trim()) {
    issues.push({
      code: "missing_category",
      message: "category is required",
    });
  }
  if (!isLocationType(input.type)) {
    issues.push({ code: "invalid_type", message: `Unknown type: ${input.type}` });
  }
  if (!isLocationVisibility(input.visibility)) {
    issues.push({
      code: "invalid_visibility",
      message: `Unknown visibility: ${input.visibility}`,
    });
  }
  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    issues.push({
      code: "invalid_coordinates",
      message: "latitude/longitude must be valid WGS84",
    });
  }

  return issues;
}

/**
 * Input for creating a Location after geocoding succeeds.
 * Coordinates come from AddressGeocoder — never invented in UI.
 */
export type CreateLocationInput = {
  tenantId: DomainId;
  type: LocationType;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  visibility?: LocationVisibility;
  geocodeProvider?: string;
  geocodeSourceRef?: string;
  geocodeDisplayName?: string;
  contact?: string;
  summary?: string;
  imageUrl?: string;
  hours?: string;
  areaLabel?: string;
  ownerId?: DomainId;
  createdBy?: DomainId;
  businessId?: DomainId;
  territoryId?: DomainId;
  id?: DomainId;
};

export function createLocation(input: CreateLocationInput): Location {
  const now = new Date().toISOString();
  const contact = input.contact?.trim();
  const summary = input.summary?.trim();
  const imageUrl = input.imageUrl?.trim();
  const hours = input.hours?.trim();
  const areaLabel = input.areaLabel?.trim();
  const location: Location = {
    id: input.id?.trim() || `loc-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    type: input.type,
    name: input.name.trim(),
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    category: input.category.trim(),
    visibility: input.visibility ?? "public",
    geocodeProvider: input.geocodeProvider,
    geocodeSourceRef: input.geocodeSourceRef,
    geocodeDisplayName: input.geocodeDisplayName,
    ...(contact ? { contact } : {}),
    ...(summary ? { summary } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(hours ? { hours } : {}),
    ...(areaLabel ? { areaLabel } : {}),
    ...(input.ownerId?.trim() ? { ownerId: input.ownerId.trim() } : {}),
    ...(input.createdBy?.trim() ? { createdBy: input.createdBy.trim() } : {}),
    ...(input.businessId?.trim() ? { businessId: input.businessId.trim() } : {}),
    ...(input.territoryId?.trim()
      ? { territoryId: input.territoryId.trim() }
      : {}),
    createdAt: now,
    updatedAt: now,
  };
  const issues = validateLocation(location);
  if (issues.length > 0) {
    throw new Error(
      `Invalid Location: ${issues.map((i) => i.code).join(", ")}`,
    );
  }
  return location;
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
