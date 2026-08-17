/**
 * Fail-closed geocoder — never invents coordinates.
 */

import type {
  AddressGeocodeQuery,
  AddressGeocodeResult,
  AddressGeocoder,
} from "@life-community-os/types";
import { validateAddressGeocodeQuery } from "@life-community-os/types";

export function createNullAddressGeocoder(): AddressGeocoder {
  return {
    providerId: "null",
    async geocode(query: AddressGeocodeQuery) {
      const errors = validateAddressGeocodeQuery(query);
      if (errors.length > 0) return null;
      return null;
    },
    async search(query: AddressGeocodeQuery) {
      const errors = validateAddressGeocodeQuery(query);
      if (errors.length > 0) return [];
      return [];
    },
  };
}

/** Type guard helper when a result must be present. */
export function isAddressGeocodeResult(
  value: AddressGeocodeResult | null | undefined,
): value is AddressGeocodeResult {
  return Boolean(
    value &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude),
  );
}
