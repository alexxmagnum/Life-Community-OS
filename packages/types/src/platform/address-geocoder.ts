/**
 * AddressGeocoder — platform capability contract (no HTTP / SDK).
 *
 * Turns a human address into WGS84 coordinates for Location persistence.
 * Concrete providers (Nominatim, Google, …) live outside packages/types.
 */

export type AddressGeocodeProviderId =
  | "nominatim"
  | "google"
  | "mapbox"
  | "null"
  | (string & {});

export type AddressGeocodeQuery = {
  /** Free-text address or place name. */
  address: string;
  /** ISO country code or country name — improves provider routing. */
  country?: string;
  /** Optional language preference (e.g. "es", "en"). */
  language?: string;
  /** Soft limit for search results (default provider-specific). */
  limit?: number;
};

export type AddressGeocodeBoundingBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type AddressGeocodeResult = {
  latitude: number;
  longitude: number;
  /** Human-readable confirmation label from the provider. */
  displayName: string;
  provider: AddressGeocodeProviderId;
  /** Opaque provider id (e.g. Nominatim place_id / osm_id). */
  sourceRef?: string;
  boundingBox?: AddressGeocodeBoundingBox;
  /** Optional structured fragments when the provider supplies them. */
  locality?: string;
  postalCode?: string;
  countryCode?: string;
};

export type AddressGeocoder = {
  readonly providerId: AddressGeocodeProviderId;
  /**
   * Resolve the best match for an address.
   * Returns null when nothing is found (never invents coordinates).
   */
  geocode(query: AddressGeocodeQuery): Promise<AddressGeocodeResult | null>;
  /** Optional multi-result search for confirmation pickers. */
  search?(query: AddressGeocodeQuery): Promise<readonly AddressGeocodeResult[]>;
};

export type AddressGeocodeConfig = {
  /**
   * Active provider id. Adapters register by id;
   * factory picks the configured one (fail-closed to null).
   */
  provider: AddressGeocodeProviderId;
  /** Optional Nominatim / custom endpoint base URL. */
  endpoint?: string;
  /** Optional Google / Mapbox API key — never logged by Core. */
  apiKey?: string;
  /** User-Agent for polite OSM Nominatim usage. */
  userAgent?: string;
};

export function validateAddressGeocodeQuery(
  query: AddressGeocodeQuery,
): string[] {
  const errors: string[] = [];
  if (!query.address?.trim()) {
    errors.push("address is required");
  }
  return errors;
}
