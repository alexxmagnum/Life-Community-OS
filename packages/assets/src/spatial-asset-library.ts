/**
 * Platform Spatial Asset library — reusable architectural GLB for Life Map.
 *
 * Global, tenant-neutral. Coordinates live on TerritoryObject, not here.
 */

import type { SpatialAsset } from "./spatial-asset";

function lodSet(category: string, file: string): SpatialAsset["lod"] {
  const base = `/assets/3d/platform/spatial/${category}/${file}`;
  return [
    { level: 0, url: `${base}/lod0/${file}.glb` },
    { level: 1, url: `${base}/lod1/${file}.glb` },
    { level: 2, url: `${base}/lod2/${file}.glb` },
  ] as const;
}

function platformAsset(input: {
  id: string;
  name: string;
  category: SpatialAsset["category"];
  file: string;
  footprintMeters: SpatialAsset["metadata"]["footprintMeters"];
  heightMeters: number;
}): SpatialAsset {
  const lod = lodSet(input.category, input.file);
  const lod0 = lod[0] ?? lod[lod.length - 1];
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    format: "glb",
    url: lod0!.url,
    scale: 1,
    lod,
    metadata: {
      units: "meters",
      pivot: "bottom-center",
      footprintMeters: input.footprintMeters,
      heightMeters: input.heightMeters,
      tenantId: null,
      compression: "none",
      style: "premium-hospitality",
    },
  };
}

/** Initial premium hospitality library (12 architectural objects). */
export const PLATFORM_SPATIAL_ASSETS: readonly SpatialAsset[] = [
  platformAsset({
    id: "security-gate-v1",
    name: "Main entry gate",
    category: "security",
    file: "gate-entry",
    footprintMeters: { x: 8.4, z: 1.6 },
    heightMeters: 2.6,
  }),
  platformAsset({
    id: "security-booth-v1",
    name: "Security booth",
    category: "security",
    file: "security-booth",
    footprintMeters: { x: 2.4, z: 2.4 },
    heightMeters: 2.8,
  }),
  platformAsset({
    id: "security-barrier-v1",
    name: "Access barrier",
    category: "security",
    file: "security-barrier",
    footprintMeters: { x: 4.2, z: 0.4 },
    heightMeters: 1.1,
  }),
  platformAsset({
    id: "parking-area-v1",
    name: "Parking stall",
    category: "mobility",
    file: "parking-area",
    footprintMeters: { x: 5.0, z: 2.5 },
    heightMeters: 0.18,
  }),
  platformAsset({
    id: "ev-charger-v1",
    name: "EV charger",
    category: "mobility",
    file: "ev-charger",
    footprintMeters: { x: 0.4, z: 0.35 },
    heightMeters: 1.45,
  }),
  platformAsset({
    id: "clubhouse-v1",
    name: "Clubhouse",
    category: "hospitality",
    file: "clubhouse",
    footprintMeters: { x: 16, z: 10 },
    heightMeters: 4.4,
  }),
  platformAsset({
    id: "restaurant-terrace-v1",
    name: "Restaurant terrace",
    category: "hospitality",
    file: "restaurant-terrace",
    footprintMeters: { x: 8, z: 6 },
    heightMeters: 3.2,
  }),
  platformAsset({
    id: "pool-area-v1",
    name: "Community pool",
    category: "sport",
    file: "pool-area",
    footprintMeters: { x: 12.5, z: 6.5 },
    heightMeters: 0.45,
  }),
  platformAsset({
    id: "padel-court-v1",
    name: "Padel court",
    category: "sport",
    file: "padel-court",
    footprintMeters: { x: 20, z: 10 },
    heightMeters: 3.0,
  }),
  platformAsset({
    id: "tennis-court-v1",
    name: "Tennis court",
    category: "sport",
    file: "tennis-court",
    footprintMeters: { x: 23.77, z: 10.97 },
    heightMeters: 0.12,
  }),
  platformAsset({
    id: "lake-area-v1",
    name: "Lake landmark",
    category: "nature",
    file: "lake-area",
    footprintMeters: { x: 18, z: 12 },
    heightMeters: 0.25,
  }),
  platformAsset({
    id: "golf-area-v1",
    name: "Golf landmark",
    category: "nature",
    file: "golf-area",
    footprintMeters: { x: 3.2, z: 3.2 },
    heightMeters: 2.4,
  }),
];

/**
 * Legacy Life Map semantic keys → SpatialAsset id.
 * TerritoryObject.asset.key may use either form.
 */
export const SPATIAL_ASSET_KEY_ALIASES: Readonly<Record<string, string>> = {
  "utility.security.spatial_object": "security-booth-v1",
  "place.clubhouse.spatial_object": "clubhouse-v1",
  "recreation.pool.spatial_object": "pool-area-v1",
  "recreation.padel.spatial_object": "padel-court-v1",
  "recreation.golf.spatial_object": "golf-area-v1",
  "place.restaurant.spatial_object": "restaurant-terrace-v1",
  "gate-entry": "security-gate-v1",
  "security-booth": "security-booth-v1",
  "security-barrier": "security-barrier-v1",
  "parking-area": "parking-area-v1",
  "ev-charger": "ev-charger-v1",
  "clubhouse": "clubhouse-v1",
  "restaurant-terace": "restaurant-terrace-v1",
  "restaurant-terrace": "restaurant-terrace-v1",
  "pool-area": "pool-area-v1",
  "padel-court": "padel-court-v1",
  "tennis-court": "tennis-court-v1",
  "lake-area": "lake-area-v1",
  "golf-area": "golf-area-v1",
};
