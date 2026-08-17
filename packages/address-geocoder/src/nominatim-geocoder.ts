/**
 * Nominatim (OpenStreetMap) AddressGeocoder adapter.
 *
 * Uses the public Nominatim API with a required identifying User-Agent.
 * Never invents coordinates — returns null when the provider finds nothing.
 *
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */

import type {
  AddressGeocodeConfig,
  AddressGeocodeQuery,
  AddressGeocodeResult,
  AddressGeocoder,
} from "@life-community-os/types";
import { validateAddressGeocodeQuery } from "@life-community-os/types";

type NominatimHit = {
  lat?: string;
  lon?: string;
  display_name?: string;
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  boundingbox?: [string, string, string, string];
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
    country_code?: string;
  };
};

const DEFAULT_ENDPOINT = "https://nominatim.openstreetmap.org";
const DEFAULT_USER_AGENT =
  "LifeCommunityOS/0.1 (address-geocoder; https://lifecommunityos.local)";

function parseHit(hit: NominatimHit): AddressGeocodeResult | null {
  const latitude = Number(hit.lat);
  const longitude = Number(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  const bbox = hit.boundingbox;
  const boundingBox =
    bbox && bbox.length === 4
      ? {
          south: Number(bbox[0]),
          north: Number(bbox[1]),
          west: Number(bbox[2]),
          east: Number(bbox[3]),
        }
      : undefined;

  return {
    latitude,
    longitude,
    displayName: hit.display_name?.trim() || "Ubicación encontrada",
    provider: "nominatim",
    sourceRef:
      hit.place_id != null
        ? `nominatim:place:${hit.place_id}`
        : hit.osm_id != null
          ? `nominatim:osm:${hit.osm_type ?? "node"}:${hit.osm_id}`
          : undefined,
    boundingBox:
      boundingBox &&
      Number.isFinite(boundingBox.north) &&
      Number.isFinite(boundingBox.south) &&
      Number.isFinite(boundingBox.east) &&
      Number.isFinite(boundingBox.west)
        ? boundingBox
        : undefined,
    locality:
      hit.address?.city ||
      hit.address?.town ||
      hit.address?.village ||
      hit.address?.municipality,
    postalCode: hit.address?.postcode,
    countryCode: hit.address?.country_code?.toUpperCase(),
  };
}

export type NominatimAddressGeocoderOptions = {
  endpoint?: string;
  userAgent?: string;
  /** Extra query params (e.g. email for Nominatim contact). */
  email?: string;
};

export function createNominatimAddressGeocoder(
  options: NominatimAddressGeocoderOptions = {},
): AddressGeocoder {
  const endpoint = (options.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, "");
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  async function request(
    query: AddressGeocodeQuery,
  ): Promise<AddressGeocodeResult[]> {
    const errors = validateAddressGeocodeQuery(query);
    if (errors.length > 0) return [];

    const params = new URLSearchParams({
      q: query.address.trim(),
      format: "json",
      addressdetails: "1",
      limit: String(Math.min(Math.max(query.limit ?? 5, 1), 10)),
    });
    if (query.country?.trim()) {
      params.set("countrycodes", normalizeCountryCodes(query.country));
    }
    if (query.language?.trim()) {
      params.set("accept-language", query.language.trim());
    }
    if (options.email?.trim()) {
      params.set("email", options.email.trim());
    }

    const response = await fetch(`${endpoint}/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
    });
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as NominatimHit[];
    if (!Array.isArray(payload)) return [];
    return payload
      .map(parseHit)
      .filter((item): item is AddressGeocodeResult => item != null);
  }

  return {
    providerId: "nominatim",
    async geocode(query) {
      const results = await request({ ...query, limit: query.limit ?? 1 });
      return results[0] ?? null;
    },
    async search(query) {
      return request(query);
    },
  };
}

function normalizeCountryCodes(country: string): string {
  const trimmed = country.trim().toLowerCase();
  if (trimmed === "spain" || trimmed === "españa" || trimmed === "espana") {
    return "es";
  }
  if (trimmed.length === 2) return trimmed;
  return trimmed;
}

export function nominatimOptionsFromConfig(
  config: AddressGeocodeConfig,
): NominatimAddressGeocoderOptions {
  return {
    endpoint: config.endpoint,
    userAgent: config.userAgent,
  };
}
