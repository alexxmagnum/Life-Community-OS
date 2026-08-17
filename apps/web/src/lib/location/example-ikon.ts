/**
 * Example Location bootstrap — proves real address → geocode → map.
 *
 * Tenant-neutral: only seeds when the tenant has zero locations.
 * Does not hardcode Panoramica map objects; uses AddressGeocoder.
 */

import { saveLocation, listLocations } from "./location-store";
import { getAddressGeocoder } from "./geocoder";

/** Real, Nominatim-resolvable address for Urbanització Panoràmica (Sant Jordi). */
export const EXAMPLE_IKON_ADDRESS =
  "Urbanització Panoràmica, Sant Jordi / San Jorge, el Baix Maestrat, Castelló, Comunitat Valenciana, 12320, España";

export const EXAMPLE_IKON_NAME = "IKON Sports & Lounge";

/**
 * Ensure the IKON example Location exists for this tenant (once).
 * Coordinates come from geocoding — never invented locally.
 */
export async function ensureExampleIkonLocation(
  tenantId: string,
): Promise<{ created: boolean; locationId?: string; error?: string }> {
  const id = tenantId.trim();
  if (!id) return { created: false, error: "missing_tenant" };

  const existing = listLocations(id);
  if (existing.some((item) => item.name === EXAMPLE_IKON_NAME)) {
    return { created: false, locationId: existing.find((i) => i.name === EXAMPLE_IKON_NAME)?.id };
  }
  // Only auto-seed an empty tenant so user-registered businesses stay authoritative.
  if (existing.length > 0) {
    return { created: false };
  }

  const geocoder = getAddressGeocoder();
  try {
    const result = await geocoder.geocode({
      address: EXAMPLE_IKON_ADDRESS,
      country: "ES",
      language: "es",
    });
    if (!result) {
      return {
        created: false,
        error: "geocode_unresolved",
      };
    }

    const location = saveLocation({
      id: `loc-example-ikon-${id}`,
      tenantId: id,
      type: "business",
      name: EXAMPLE_IKON_NAME,
      address: EXAMPLE_IKON_ADDRESS,
      latitude: result.latitude,
      longitude: result.longitude,
      category: "restaurant",
      visibility: "public",
      geocodeProvider: result.provider,
      geocodeSourceRef: result.sourceRef,
      geocodeDisplayName: result.displayName,
    });

    return { created: true, locationId: location.id };
  } catch (error) {
    return {
      created: false,
      error: error instanceof Error ? error.message : "geocode_failed",
    };
  }
}
