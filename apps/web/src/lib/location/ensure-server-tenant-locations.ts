/**
 * Server-side Location seed + RC enrichment — tenant-scoped.
 * Seeds come from the tenant pack. Production does not runtime-seed.
 * Guests never POST catalog rows; this runs on GET /api/locations.
 */

import { createAddressGeocoder } from "@life-community-os/address-geocoder";
import { isProductionDataPlane } from "@/lib/data/data-plane";
import {
  listLocationsServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import {
  enrichLocationFields,
  locationNeedsEnrichment,
} from "@/lib/location/enrich-location-presentation";
import {
  buildLocalEntityCatalogInputs,
  CATALOG_NUCLEUS_FALLBACK,
} from "@/lib/location/seed-catalog-locations";
import { getTenantPack } from "@/lib/tenant/registry";

async function resolveCatalogNucleus(existing: Awaited<
  ReturnType<typeof listLocationsServer>
>): Promise<{ latitude: number; longitude: number; address: string }> {
  const ikon = existing.find((item) =>
    item.name.toLowerCase().includes("ikon"),
  );
  if (ikon) {
    return {
      latitude: ikon.latitude,
      longitude: ikon.longitude,
      address: ikon.address || CATALOG_NUCLEUS_FALLBACK.address,
    };
  }
  try {
    const geocoder = createAddressGeocoder({
      provider:
        process.env.ADDRESS_GEOCODER_PROVIDER?.trim() ||
        process.env.NEXT_PUBLIC_ADDRESS_GEOCODER_PROVIDER?.trim() ||
        "nominatim",
      endpoint: process.env.ADDRESS_GEOCODER_ENDPOINT,
      userAgent:
        process.env.ADDRESS_GEOCODER_USER_AGENT ??
        "LifeCommunityOS/0.1 (catalog-seed)",
    });
    const result = await geocoder.geocode({
      address: CATALOG_NUCLEUS_FALLBACK.address,
      country: "ES",
      language: "es",
      limit: 1,
    });
    if (result) {
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        address: CATALOG_NUCLEUS_FALLBACK.address,
      };
    }
  } catch {
    /* Nominatim optional in local bootstrap */
  }
  return {
    latitude: CATALOG_NUCLEUS_FALLBACK.latitude,
    longitude: CATALOG_NUCLEUS_FALLBACK.longitude,
    address: CATALOG_NUCLEUS_FALLBACK.address,
  };
}

export async function ensureServerTenantLocations(
  tenantSlug: string,
): Promise<{ created: number; enriched: number }> {
  if (isProductionDataPlane()) {
    return { created: 0, enriched: 0 };
  }

  const slug = tenantSlug.trim().toLowerCase();
  let created = 0;
  let enriched = 0;
  const pack = getTenantPack(slug);

  if (pack && pack.locationSeedMode === "pack") {
    const existing = await listLocationsServer(slug);
    const ids = new Set(existing.map((item) => item.id));
    for (const place of pack.getLocationSeeds()) {
      if (ids.has(place.id)) continue;
      await saveLocationServer({
        id: place.id,
        tenantId: slug,
        type: place.type ?? "community-place",
        name: place.name,
        address: place.address ?? `${place.areaLabel}, ${pack.displayName}`,
        latitude: place.latitude,
        longitude: place.longitude,
        category: place.category,
        visibility: "public",
        summary: place.summary,
        areaLabel: place.areaLabel,
        hours: place.hours,
        contact: place.contact,
        imageUrl: place.imageUrl,
      });
      created += 1;
    }
  }

  if (pack && pack.locationSeedMode === "local-entity-catalog") {
    const existing = await listLocationsServer(slug);
    const nucleus = await resolveCatalogNucleus(existing);
    const drafts = buildLocalEntityCatalogInputs(slug, nucleus, existing);
    for (const draft of drafts) {
      await saveLocationServer({
        ...draft,
        tenantId: slug,
      });
      created += 1;
    }
  }

  const all = await listLocationsServer(slug);
  for (const loc of all) {
    if (loc.tenantId !== slug) continue;
    if (!locationNeedsEnrichment(loc)) continue;
    const next = enrichLocationFields(loc);
    await saveLocationServer({
      ...next,
      tenantId: slug,
    });
    enriched += 1;
  }

  return { created, enriched };
}
