/**
 * Server-side Location seed + RC enrichment — tenant-scoped.
 */

import type { LocationType } from "@life-community-os/types";
import { isProductionDataPlane } from "@/lib/data/data-plane";
import {
  listLocationsServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";
import {
  enrichLocationFields,
  locationNeedsEnrichment,
} from "@/lib/location/enrich-location-presentation";

const VALLEY_PLACES: Array<{
  id: string;
  name: string;
  category: string;
  type: LocationType;
  summary: string;
  areaLabel: string;
  latitude: number;
  longitude: number;
  hours: string;
  contact: string;
  imageUrl: string;
}> = [
  {
    id: "loc-catalog-lv-plaza-life-valley",
    name: "Plaza Life Valley",
    category: "place",
    type: "community-place",
    summary: "Plaza y punto de encuentro de Life Valley.",
    areaLabel: "Centro Valle",
    latitude: 39.4825,
    longitude: -0.378,
    hours: "Acceso libre · eventos anunciados",
    contact: "hola@lifevalley.community",
    imageUrl:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "loc-catalog-lv-cafe-life-valley",
    name: "Café del Valle",
    category: "cafe",
    type: "business",
    summary: "Café acogedor en el centro de Life Valley.",
    areaLabel: "Centro Valle",
    latitude: 39.4832,
    longitude: -0.3785,
    hours: "Lun–Dom · 08:00–20:00",
    contact: "+34 960 000 200",
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
  },
];

export async function ensureServerTenantLocations(
  tenantSlug: string,
): Promise<{ created: number; enriched: number }> {
  if (isProductionDataPlane()) {
    return { created: 0, enriched: 0 };
  }

  const slug = tenantSlug.trim().toLowerCase();
  let created = 0;
  let enriched = 0;

  if (slug === "life-valley") {
    const existing = await listLocationsServer(slug);
    const ids = new Set(existing.map((l) => l.id));
    for (const place of VALLEY_PLACES) {
      if (ids.has(place.id)) continue;
      await saveLocationServer({
        id: place.id,
        tenantId: slug,
        type: place.type,
        name: place.name,
        address: `${place.areaLabel}, Life Valley`,
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

  // RC: backfill missing presentation fields on existing Locations.
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
