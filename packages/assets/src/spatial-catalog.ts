/**
 * Platform Spatial Asset Catalog — Life Map premium asset ecosystem.
 *
 * Registers spatial_object / building keys into a runtime catalog that
 * complements the generated UI registry (webp). Preview `path` may be a
 * billboard; optional `spatial.modelPath` is reserved for glTF when present.
 *
 * No tenant catalogs here. No commercial binaries invented.
 */

import { defineSpatialLibraryEntry } from "./spatial-library";
import type { AssetMetadata } from "./types";

type SpatialCatalogSeed = {
  entry: ReturnType<typeof defineSpatialLibraryEntry>;
  /** Billboard / preview under /assets/3d/ (must exist or soft-fail at resolve). */
  previewPath: string;
  /** Optional future glTF under /assets/3d/ — pipeline ready, may be absent. */
  modelPath?: string;
  width?: number;
  height?: number;
};

const SEEDS: readonly SpatialCatalogSeed[] = [
  {
    entry: defineSpatialLibraryEntry({
      category: "place",
      id: "restaurant",
      subtype: "restaurant",
      behaviour: "interactive",
      interaction: "open",
      label: "Restaurant",
    }),
    previewPath: "/assets/3d/platform/sports/sports/card/sports.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "place",
      id: "cafe",
      subtype: "cafe",
      behaviour: "interactive",
      interaction: "open",
      label: "Cafe",
    }),
    previewPath: "/assets/3d/platform/community/marketplace/card/marketplace.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "place",
      id: "shop",
      subtype: "shop",
      behaviour: "interactive",
      interaction: "open",
      label: "Shop",
    }),
    previewPath: "/assets/3d/platform/community/marketplace/card/marketplace.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "recreation",
      id: "golf",
      subtype: "golf",
      behaviour: "interactive",
      interaction: "open",
      label: "Golf",
    }),
    previewPath: "/assets/3d/platform/sports/golf/card/golf.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "recreation",
      id: "pool",
      subtype: "pool",
      behaviour: "interactive",
      interaction: "open",
      label: "Pool",
    }),
    previewPath: "/assets/3d/platform/sports/sports/card/sports.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "recreation",
      id: "padel",
      subtype: "padel",
      behaviour: "interactive",
      interaction: "reserve",
      label: "Padel",
    }),
    previewPath: "/assets/3d/platform/sports/padel/object/padel.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "place",
      id: "service",
      subtype: "service_point",
      behaviour: "interactive",
      interaction: "message",
      label: "Service",
    }),
    previewPath: "/assets/3d/platform/services/maintenance/card/maintenance.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "building",
      id: "house",
      subtype: "house",
      behaviour: "static",
      interaction: "open",
      label: "House",
    }),
    previewPath: "/assets/3d/platform/community/marketplace/card/marketplace.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "utility",
      id: "security",
      subtype: "signage",
      behaviour: "interactive",
      interaction: "open",
      label: "Security",
    }),
    previewPath: "/assets/3d/platform/services/towing/scene/towing.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "community",
      id: "gathering",
      subtype: "gathering",
      behaviour: "interactive",
      interaction: "join",
      label: "Gathering",
    }),
    previewPath: "/assets/3d/platform/community/heart-community/symbol/heart-community.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "community",
      id: "alert",
      subtype: "channel_anchor",
      behaviour: "ambient",
      interaction: "open",
      label: "Alert",
    }),
    previewPath: "/assets/3d/platform/community/hand-wave/symbol/hand-wave.webp",
  },
  {
    entry: defineSpatialLibraryEntry({
      category: "nature",
      id: "path",
      subtype: "landscape",
      behaviour: "static",
      interaction: "navigate",
      label: "Path",
    }),
    previewPath: "/assets/3d/platform/community/hand-wave/symbol/hand-wave.webp",
  },
];

const catalog = new Map<string, AssetMetadata>();
let ready = false;

function seedToMetadata(seed: SpatialCatalogSeed): AssetMetadata {
  const { entry } = seed;
  return {
    key: entry.assetKey,
    path: seed.previewPath,
    type: entry.registryType,
    domain: "life-map",
    variant: "default",
    scope: "global",
    tenant: null,
    width: seed.width ?? 512,
    height: seed.height ?? 341,
    spatial: {
      category: entry.category,
      subtype: entry.subtype,
      behaviour: entry.behaviour,
      interaction: entry.interaction,
      anchor: entry.anchor ?? "bottom",
      scale: entry.scale,
      lod: entry.lod,
      ...(seed.modelPath ? { modelPath: seed.modelPath } : {}),
    },
  };
}

/** Idempotent — safe to call from resolve / web bootstrap. */
export function ensurePlatformSpatialCatalog(): void {
  if (ready) return;
  ready = true;
  for (const seed of SEEDS) {
    catalog.set(seed.entry.assetKey, seedToMetadata(seed));
  }
}

export function getSpatialCatalogAsset(
  key: string,
): AssetMetadata | undefined {
  ensurePlatformSpatialCatalog();
  return catalog.get(key);
}

export function hasSpatialCatalogAsset(key: string): boolean {
  ensurePlatformSpatialCatalog();
  return catalog.has(key);
}

export function listSpatialCatalogAssets(): readonly AssetMetadata[] {
  ensurePlatformSpatialCatalog();
  return [...catalog.values()];
}

/** Register or replace a platform spatial entry (tests / tenant host extensions). */
export function registerSpatialCatalogAsset(meta: AssetMetadata): void {
  ensurePlatformSpatialCatalog();
  catalog.set(meta.key, meta);
}
