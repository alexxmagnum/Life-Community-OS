/**
 * Panorámica demo Location bootstrap — address → geocode → living map cluster.
 *
 * Seeds a commercial lifestyle set: IKON, pool, pádel, golf, services.
 * Coordinates come from AddressGeocoder; companions offset around the nucleus.
 */

import type { LocationType } from "@life-community-os/types";
import { saveLocation, listLocations, removeLocation } from "./location-store";
import { getAddressGeocoder } from "./geocoder";
import { demoPlaceProfileFor } from "./demo-place-profile";

/** Real, Nominatim-resolvable address for Urbanització Panoràmica (Sant Jordi). */
export const EXAMPLE_IKON_ADDRESS =
  "Urbanització Panoràmica, Sant Jordi / San Jorge, el Baix Maestrat, Castelló, Comunitat Valenciana, 12320, España";

export const EXAMPLE_IKON_NAME = "IKON Sports & Lounge";

type SeedPlace = {
  idSuffix: string;
  name: string;
  category: string;
  type: LocationType;
  dLat: number;
  dLng: number;
};

/** Spaced so ×6–×10 heroes read as distinct places in one living-zone frame. */
const SEED_CLUSTER: readonly SeedPlace[] = [
  {
    idSuffix: "ikon",
    name: EXAMPLE_IKON_NAME,
    category: "restaurant",
    type: "business",
    dLat: 0,
    dLng: 0,
  },
  {
    idSuffix: "pool",
    name: "Piscina comunitaria",
    category: "pool",
    type: "facility",
    dLat: 0.0012,
    dLng: 0.00105,
  },
  {
    idSuffix: "padel",
    name: "Pistas de pádel",
    category: "padel",
    type: "facility",
    dLat: -0.0011,
    dLng: 0.00125,
  },
  {
    idSuffix: "golf",
    name: "Club de Golf Panorámica",
    category: "golf",
    type: "facility",
    dLat: -0.00125,
    dLng: -0.00115,
  },
  {
    idSuffix: "service",
    name: "Jardinería Panorámica",
    category: "service",
    type: "service",
    dLat: 0.00115,
    dLng: -0.0011,
  },
  {
    idSuffix: "electrician",
    name: "Electricista del barrio",
    category: "electrician",
    type: "service",
    dLat: 0.00035,
    dLng: -0.00145,
  },
];

function seedId(suffix: string, tenantId: string): string {
  return `loc-example-${suffix}-${tenantId}`;
}

function findSeed(
  existing: ReturnType<typeof listLocations>,
  place: SeedPlace,
  tenantId: string,
) {
  return (
    existing.find((item) => item.id === seedId(place.idSuffix, tenantId)) ??
    existing.find((item) => item.name === place.name) ??
    null
  );
}

function upsertSeedPlace(
  place: SeedPlace,
  tenantId: string,
  base: {
    address: string;
    latitude: number;
    longitude: number;
    geocodeProvider?: string;
    geocodeSourceRef?: string;
    geocodeDisplayName?: string;
  },
) {
  const profile = demoPlaceProfileFor({
    id: seedId(place.idSuffix, tenantId),
    name: place.name,
  });
  return saveLocation({
    id: seedId(place.idSuffix, tenantId),
    tenantId,
    type: place.type,
    name: place.name,
    address: base.address,
    latitude: base.latitude + place.dLat,
    longitude: base.longitude + place.dLng,
    category: place.category,
    visibility: "public",
    geocodeProvider: base.geocodeProvider,
    geocodeSourceRef: base.geocodeSourceRef,
    geocodeDisplayName: base.geocodeDisplayName,
    contact: profile?.contact,
  });
}

/**
 * Ensure the Panorámica lifestyle cluster exists for this tenant.
 */
export async function ensureExampleIkonLocation(
  tenantId: string,
): Promise<{ created: boolean; locationId?: string; error?: string }> {
  const id = tenantId.trim();
  if (!id) return { created: false, error: "missing_tenant" };

  const existing = listLocations(id);
  const hasIkon = existing.some((item) => item.name === EXAMPLE_IKON_NAME);

  if (hasIkon) {
    const ikon = existing.find((i) => i.name === EXAMPLE_IKON_NAME)!;
    let created = false;
    for (const place of SEED_CLUSTER) {
      const found = findSeed(existing, place, id);
      if (found) {
        const nextLat = ikon.latitude + place.dLat;
        const nextLng = ikon.longitude + place.dLng;
        const profile = demoPlaceProfileFor({
          id: seedId(place.idSuffix, id),
          name: place.name,
        });
        const needs =
          found.name !== place.name ||
          found.category !== place.category ||
          found.contact !== profile?.contact ||
          Math.abs(found.latitude - nextLat) > 1e-7 ||
          Math.abs(found.longitude - nextLng) > 1e-7;
        if (needs) {
          await saveLocation({
            ...found,
            id: seedId(place.idSuffix, id),
            name: place.name,
            category: place.category,
            type: place.type,
            latitude: nextLat,
            longitude: nextLng,
            contact: profile?.contact,
          });
          created = true;
        }
        continue;
      }
      await upsertSeedPlace(place, id, {
        address: ikon.address,
        latitude: ikon.latitude,
        longitude: ikon.longitude,
        geocodeProvider: ikon.geocodeProvider,
        geocodeSourceRef: ikon.geocodeSourceRef,
        geocodeDisplayName: ikon.geocodeDisplayName,
      });
      created = true;
    }
    // Drop obsolete spacing placeholders from earlier demos.
    for (const obsolete of ["Servicios locales", "Zona deportiva"]) {
      const stale = existing.find((item) => item.name === obsolete);
      if (stale && !SEED_CLUSTER.some((p) => p.name === obsolete)) {
        await removeLocation(id, stale.id);
        created = true;
      }
    }
    return { created, locationId: ikon.id };
  }

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
      return { created: false, error: "geocode_unresolved" };
    }

    let firstId: string | undefined;
    for (const place of SEED_CLUSTER) {
      const location = await upsertSeedPlace(place, id, {
        address: EXAMPLE_IKON_ADDRESS,
        latitude: result.latitude,
        longitude: result.longitude,
        geocodeProvider: result.provider,
        geocodeSourceRef: result.sourceRef,
        geocodeDisplayName: result.displayName,
      });
      if (place.idSuffix === "ikon") firstId = location.id;
    }

    return { created: true, locationId: firstId };
  } catch (error) {
    return {
      created: false,
      error: error instanceof Error ? error.message : "geocode_failed",
    };
  }
}
