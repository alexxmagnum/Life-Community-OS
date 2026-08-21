/**
 * Bootstrap discovery catalog → Location SoT.
 * LocalEntity catalog is seed content only — not a parallel SoT.
 */

import {
  locationTypeFromLocalKind,
  type CreateLocationInput,
  type Location,
} from "@life-community-os/types";
import { localEntityCatalog } from "@life-community-os/tenant-life-panoramica";
import { catalogLocationId } from "./location-href";
import { enrichLocationFields } from "./enrich-location-presentation";
import { EXAMPLE_IKON_ADDRESS } from "./example-ikon";

export { catalogLocationId };

/** Stable offsets so catalog places sit near the community nucleus. */
export const CATALOG_NUCLEUS_OFFSETS: Record<string, { dLat: number; dLng: number }> = {
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

export function categoryFromLocalEntity(
  entity: (typeof localEntityCatalog)[number],
): string {
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

/**
 * Pure drafts for Panoramica local-entity catalog.
 * Persistence belongs on the server (GET /api/locations), never a guest POST.
 */
export function buildLocalEntityCatalogInputs(
  tenantId: string,
  nucleus: Pick<Location, "latitude" | "longitude" | "address">,
  existing: readonly Pick<Location, "id" | "name">[] = [],
): CreateLocationInput[] {
  const id = tenantId.trim();
  const ids = new Set(existing.map((item) => item.id));
  const names = new Set(existing.map((item) => item.name.toLowerCase()));
  const drafts: CreateLocationInput[] = [];

  for (const entity of localEntityCatalog) {
    if (
      entity.kind === "restaurant" ||
      entity.kind === "cafe" ||
      entity.kind === "shop" ||
      entity.kind === "service"
    ) {
      continue;
    }
    const locationId = catalogLocationId(entity.id, id);
    if (ids.has(locationId) || names.has(entity.name.toLowerCase())) continue;
    const offset = CATALOG_NUCLEUS_OFFSETS[entity.id] ?? {
      dLat: 0.0005,
      dLng: 0.0005,
    };
    const now = new Date().toISOString();
    const draft = enrichLocationFields({
      id: locationId,
      tenantId: id,
      type: locationTypeFromLocalKind(entity.kind),
      name: entity.name,
      address: `${entity.areaLabel}, ${nucleus.address}`,
      latitude: nucleus.latitude + offset.dLat,
      longitude: nucleus.longitude + offset.dLng,
      category: categoryFromLocalEntity(entity),
      visibility: "public",
      summary: entity.story,
      imageUrl: entity.imageUrl,
      areaLabel: entity.areaLabel,
      createdAt: now,
      updatedAt: now,
    });
    drafts.push({
      id: draft.id,
      tenantId: draft.tenantId,
      type: draft.type,
      name: draft.name,
      address: draft.address,
      latitude: draft.latitude,
      longitude: draft.longitude,
      category: draft.category,
      visibility: draft.visibility,
      summary: draft.summary,
      imageUrl: draft.imageUrl,
      areaLabel: draft.areaLabel,
      hours: draft.hours,
      contact: draft.contact,
    });
  }

  return drafts;
}

export const CATALOG_NUCLEUS_FALLBACK = {
  latitude: 40.5486,
  longitude: 0.3308,
  address: EXAMPLE_IKON_ADDRESS,
} as const;

