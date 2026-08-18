/**
 * Server-side Location seed — tenant-scoped, no browser store.
 */

import type { LocationType } from "@life-community-os/types";
import {
  listLocationsServer,
  saveLocationServer,
} from "@/lib/location/server-location-repository";

const VALLEY_PLACES: Array<{
  id: string;
  name: string;
  category: string;
  type: LocationType;
  summary: string;
  areaLabel: string;
  latitude: number;
  longitude: number;
}> = [
  {
    id: "loc-catalog-lv-plaza-life-valley",
    name: "Plaza Life Valley",
    category: "place",
    type: "community-place",
    summary: "Núcleo social del tenant de validación multi-tenant.",
    areaLabel: "Centro Valle",
    latitude: 39.4825,
    longitude: -0.378,
  },
  {
    id: "loc-catalog-lv-cafe-life-valley",
    name: "Café del Valle",
    category: "cafe",
    type: "business",
    summary: "Cafetería de referencia solo en Life Valley.",
    areaLabel: "Centro Valle",
    latitude: 39.4832,
    longitude: -0.3785,
  },
];

export async function ensureServerTenantLocations(
  tenantSlug: string,
): Promise<{ created: number }> {
  const slug = tenantSlug.trim().toLowerCase();
  if (slug !== "life-valley") return { created: 0 };

  const existing = await listLocationsServer(slug);
  const ids = new Set(existing.map((l) => l.id));
  let created = 0;
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
    });
    created += 1;
  }
  return { created };
}
