/**
 * Life Panoramica — Territory Data Package.
 *
 * Tenant-owned organization for future real territorial datasets.
 * No geometry, coordinates, OSM extracts, or invented Panoramica shapes.
 *
 * When real files exist, add TerritoryDataSource + TerritoryLayerImport entries
 * and opaque dataRefs (e.g. tenant://life-panoramica/territory/roads/v1.geojson).
 * Core only understands platform contracts — never store payloads here.
 */

import type {
  LifeMapBaseLayer,
  LifeMapBaseLayerType,
  TerritoryDataSource,
  TerritoryLayerImport,
} from "@life-community-os/types";
import { projectTerritoryLayerImports } from "@life-community-os/types";

import { DEMO_TERRITORY_ID } from "./demo-ids";

/** Physical layer kinds this tenant expects to receive (no payloads). */
export type LifePanoramicaTerritoryBaseKind =
  | "boundary"
  | "roads"
  | "buildings"
  | "water"
  | "green";

/**
 * Planned base-layer slot — metadata only until a real source exists.
 * `dataRef: null` means “not supplied yet” (never invent a path with fake data).
 */
export type LifePanoramicaTerritoryLayerSlot = {
  kind: LifePanoramicaTerritoryBaseKind;
  /** Stable id for a future TerritoryLayerImport. */
  importId: string;
  /** Maps 1:1 to LifeMapBaseLayerType for these kinds. */
  baseLayerType: LifeMapBaseLayerType;
  /** Whether this slot should be imported when data arrives. */
  enabled: boolean;
  /** Opaque ref when a real file exists; null until then. */
  dataRef: string | null;
  label: string;
};

/**
 * Tenant territory data package — sources + layer plan + imports.
 * Belongs exclusively to the tenant pack (not packages/types or assets).
 */
export type LifePanoramicaTerritoryDataPackage = {
  territoryId: string;
  /** Declared CRS for future geo payloads (no bounds invented). */
  crs: "WGS84";
  sources: readonly TerritoryDataSource[];
  /** Planned physical layers (boundary, roads, …). */
  layers: readonly LifePanoramicaTerritoryLayerSlot[];
  layerImports: readonly TerritoryLayerImport[];
};

/**
 * Planned layer slots for Life Panoramica.
 * All `dataRef` are null — structure only.
 */
export const lifePanoramicaTerritoryLayerSlots: readonly LifePanoramicaTerritoryLayerSlot[] =
  [
    {
      kind: "boundary",
      importId: "import-boundary",
      baseLayerType: "boundary",
      enabled: true,
      dataRef: null,
      label: "Límite urbanización",
    },
    {
      kind: "roads",
      importId: "import-roads",
      baseLayerType: "roads",
      enabled: true,
      dataRef: null,
      label: "Calles internas",
    },
    {
      kind: "buildings",
      importId: "import-buildings",
      baseLayerType: "buildings",
      enabled: true,
      dataRef: null,
      label: "Edificios",
    },
    {
      kind: "water",
      importId: "import-water",
      baseLayerType: "water",
      enabled: true,
      dataRef: null,
      label: "Agua",
    },
    {
      kind: "green",
      importId: "import-green",
      baseLayerType: "green",
      enabled: true,
      dataRef: null,
      label: "Zonas verdes / golf",
    },
  ];

/** External datasets — empty until authorized real sources exist. */
export const lifePanoramicaTerritoryDataSources: readonly TerritoryDataSource[] =
  [];

/**
 * Import instructions (external → LifeMapBaseLayer).
 * Empty until real sourceRef / files exist for each slot.
 */
export const lifePanoramicaTerritoryLayerImports: readonly TerritoryLayerImport[] =
  [];

/**
 * Canonical territory data package for this tenant.
 * Keep sources / layerImports empty — no fake Panoramica geometry.
 */
export const lifePanoramicaTerritoryData: LifePanoramicaTerritoryDataPackage = {
  territoryId: DEMO_TERRITORY_ID,
  crs: "WGS84",
  sources: lifePanoramicaTerritoryDataSources,
  layers: lifePanoramicaTerritoryLayerSlots,
  layerImports: lifePanoramicaTerritoryLayerImports,
};

export function getLifePanoramicaTerritoryData(): LifePanoramicaTerritoryDataPackage {
  return lifePanoramicaTerritoryData;
}

export function listLifePanoramicaTerritoryDataSources(): readonly TerritoryDataSource[] {
  return lifePanoramicaTerritoryData.sources;
}

export function listLifePanoramicaTerritoryLayerSlots(): readonly LifePanoramicaTerritoryLayerSlot[] {
  return lifePanoramicaTerritoryData.layers;
}

export function listLifePanoramicaTerritoryLayerImports(): readonly TerritoryLayerImport[] {
  return lifePanoramicaTerritoryData.layerImports;
}

/**
 * Project configured imports into LifeMapBaseLayer[].
 * Returns [] while imports remain empty — never invents geometry.
 */
export function projectLifePanoramicaTerritoryBaseLayers(): {
  layers: LifeMapBaseLayer[];
  rejected: {
    importId: string;
    issues: { code: string; message: string }[];
  }[];
} {
  return projectTerritoryLayerImports(lifePanoramicaTerritoryData.layerImports, {
    expectedTerritoryId: DEMO_TERRITORY_ID,
  });
}
