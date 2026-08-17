/**
 * Configurable AddressGeocoder factory.
 *
 * Providers are swappable — Nominatim first; Google/Mapbox bind later.
 */

import type {
  AddressGeocodeConfig,
  AddressGeocoder,
} from "@life-community-os/types";

import { createNominatimAddressGeocoder } from "./nominatim-geocoder";
import { createNullAddressGeocoder } from "./null-geocoder";

export function createAddressGeocoder(
  config: AddressGeocodeConfig,
): AddressGeocoder {
  const provider = (config.provider || "null").toLowerCase();

  switch (provider) {
    case "nominatim":
      return createNominatimAddressGeocoder({
        endpoint: config.endpoint,
        userAgent: config.userAgent,
      });
    case "google":
    case "mapbox":
      // Future adapters — fail closed until wired with real keys/SDKs.
      return createNullAddressGeocoder();
    case "null":
    default:
      return createNullAddressGeocoder();
  }
}

/**
 * Resolve geocoder from env-style config (apps / edge).
 * Default: nominatim for local demos; set ADDRESS_GEOCODER_PROVIDER=null to disable.
 */
export function createAddressGeocoderFromEnv(env: {
  ADDRESS_GEOCODER_PROVIDER?: string;
  ADDRESS_GEOCODER_ENDPOINT?: string;
  ADDRESS_GEOCODER_USER_AGENT?: string;
  NEXT_PUBLIC_ADDRESS_GEOCODER_PROVIDER?: string;
}): AddressGeocoder {
  const provider =
    env.ADDRESS_GEOCODER_PROVIDER?.trim() ||
    env.NEXT_PUBLIC_ADDRESS_GEOCODER_PROVIDER?.trim() ||
    "nominatim";

  return createAddressGeocoder({
    provider,
    endpoint: env.ADDRESS_GEOCODER_ENDPOINT,
    userAgent: env.ADDRESS_GEOCODER_USER_AGENT,
  });
}
