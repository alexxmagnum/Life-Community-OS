/**
 * Server-side Location seed + RC enrichment — tenant-scoped.
 * Seeds come from the tenant pack. Production does not runtime-seed.
 */

import { isProductionDataPlane } from "@/lib/data/data-plane";
import {
  listLocationsServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import {
  enrichLocationFields,
  locationNeedsEnrichment,
} from "@/lib/location/enrich-location-presentation";
import { getTenantPack } from "@/lib/tenant/registry";

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
