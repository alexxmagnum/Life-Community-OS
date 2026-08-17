/**
 * Browser-safe AddressGeocoder — calls the Next.js geocode proxy
 * (Nominatim rejects direct browser CORS).
 */

import type {
  AddressGeocodeQuery,
  AddressGeocodeResult,
  AddressGeocoder,
} from "@life-community-os/types";
import { validateAddressGeocodeQuery } from "@life-community-os/types";

export function createWebAddressGeocoder(): AddressGeocoder {
  return {
    providerId: "nominatim",
    async geocode(query: AddressGeocodeQuery) {
      const errors = validateAddressGeocodeQuery(query);
      if (errors.length > 0) return null;
      const params = new URLSearchParams({
        q: query.address.trim(),
        limit: "1",
      });
      if (query.country?.trim()) params.set("country", query.country.trim());
      if (query.language?.trim()) params.set("language", query.language.trim());

      const response = await fetch(`/api/geocode?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as {
        result?: AddressGeocodeResult | null;
      };
      return payload.result ?? null;
    },
    async search(query: AddressGeocodeQuery) {
      const errors = validateAddressGeocodeQuery(query);
      if (errors.length > 0) return [];
      const params = new URLSearchParams({
        q: query.address.trim(),
        limit: String(query.limit ?? 5),
      });
      if (query.country?.trim()) params.set("country", query.country.trim());
      if (query.language?.trim()) params.set("language", query.language.trim());

      const response = await fetch(`/api/geocode?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return [];
      const payload = (await response.json()) as {
        results?: AddressGeocodeResult[];
      };
      return payload.results ?? [];
    },
  };
}
