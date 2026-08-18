/**
 * Bootstrap discovery catalog → Location SoT.
 * LocalEntity catalog is seed content only — not a parallel SoT.
 */

import {
  locationTypeFromLocalKind,
  type Location,
} from "@life-community-os/types";
import { localEntityCatalog } from "@life-community-os/tenant-life-panoramica";
import { listLocations, saveLocation } from "./location-store";
import { getAddressGeocoder } from "./geocoder";
import { EXAMPLE_IKON_ADDRESS } from "./example-ikon";

/** Stable offsets so catalog places sit near the community nucleus. */
const OFFSETS: Record<string, { dLat: number; dLng: number }> = {
  "lp-terraza": { dLat: 0.0008, dLng: -0.0006 },
  "lp-clubhouse": { dLat: -0.0004, dLng: 0.0007 },
  "lp-pan": { dLat: 0.0006, dLng: 0.0009 },
  "lp-market": { dLat: -0.0007, dLng: -0.0004 },
  "lp-path": { dLat: 0.0014, dLng: 0.0002 },
  "lp-ikon": { dLat: 0, dLng: 0 },
  "lp-golf-club": { dLat: -0.00125, dLng: -0.00115 },
  "lp-pool": { dLat: 0.0012, dLng: 0.00105 },
  "lp-mirador": { dLat: 0.0016, dLng: -0.0008 },
  "lp-garden": { dLat: 0.00115, dLng: -0.0011 },
  "lp-lock": { dLat: -0.0009, dLng: 0.0011 },
  "lp-vet": { dLat: 0.0002, dLng: 0.0013 },
};

function catalogLocationId(entityId: string, tenantId: string): string {
  return `loc-catalog-${entityId}-${tenantId}`;
}

function categoryFromEntity(entity: (typeof localEntityCatalog)[number]): string {
  switch (entity.kind) {
    case "restaurant":
      return "restaurant";
    case "cafe":
      return "cafe";
    case "shop":
      return "shop";
    case "service":
      return entity.categoryLabel.toLowerCase().includes("jard")
        ? "service"
        : "service";
    case "place":
      if (entity.name.toLowerCase().includes("piscina")) return "pool";
      if (entity.name.toLowerCase().includes("golf")) return "golf";
      return "place";
    default:
      return entity.kind;
  }
}

export async function ensureCatalogLocations(
  tenantId: string,
): Promise<{ created: number; error?: string }> {
  const id = tenantId.trim();
  if (!id) return { created: 0, error: "missing_tenant" };

  const existing = listLocations(id);
  const byName = new Map(existing.map((item) => [item.name.toLowerCase(), item]));

  let base: Pick<Location, "latitude" | "longitude" | "address"> | null = null;
  const ikon = existing.find((item) =>
    item.name.toLowerCase().includes("ikon"),
  );
  if (ikon) {
    base = {
      latitude: ikon.latitude,
      longitude: ikon.longitude,
      address: ikon.address,
    };
  } else {
    try {
      const geocoder = getAddressGeocoder();
      const result = await geocoder.geocode({
        address: EXAMPLE_IKON_ADDRESS,
        country: "ES",
        language: "es",
      });
      if (!result) return { created: 0, error: "geocode_unresolved" };
      base = {
        latitude: result.latitude,
        longitude: result.longitude,
        address: EXAMPLE_IKON_ADDRESS,
      };
    } catch (err) {
      return {
        created: 0,
        error: err instanceof Error ? err.message : "geocode_failed",
      };
    }
  }

  let created = 0;
  for (const entity of localEntityCatalog) {
    const locationId = catalogLocationId(entity.id, id);
    if (existing.some((item) => item.id === locationId)) continue;
    if (byName.has(entity.name.toLowerCase())) continue;

    const offset = OFFSETS[entity.id] ?? { dLat: 0.0005, dLng: 0.0005 };
    await saveLocation({
      id: locationId,
      tenantId: id,
      type: locationTypeFromLocalKind(entity.kind),
      name: entity.name,
      address: `${entity.areaLabel}, ${base.address}`,
      latitude: base.latitude + offset.dLat,
      longitude: base.longitude + offset.dLng,
      category: categoryFromEntity(entity),
      visibility: "public",
      summary: entity.story,
      imageUrl: entity.imageUrl,
      areaLabel: entity.areaLabel,
    });
    created += 1;
  }

  return { created };
}
