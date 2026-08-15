/**
 * Life Panoramica — Territory Data Package.
 *
 * Tenant-owned organization for real territorial datasets.
 * Payloads live under `territory/data/` — never in Core.
 */

import type {
  LifeMapBaseLayer,
  LifeMapBaseLayerType,
  TerritoryDataSource,
  TerritoryLayerImport,
} from "@life-community-os/types";
import {
  projectTerritoryLayerImports,
  validateTerritoryDataSource,
} from "@life-community-os/types";

import { DEMO_TERRITORY_ID } from "./demo-ids";
import { LIFE_PANORAMICA_ROADS_DATA_REF } from "./life-map-territory-resolver";
import roadsV1Manifest from "../territory/data/roads/v1/manifest.json";

/** Physical layer kinds this tenant expects to receive. */
export type LifePanoramicaTerritoryBaseKind =
  | "boundary"
  | "roads"
  | "buildings"
  | "water"
  | "green";

/**
 * Planned base-layer slot — metadata.
 * `dataRef: null` means “not supplied yet” (never invent a path with fake data).
 */
export type LifePanoramicaTerritoryLayerSlot = {
  kind: LifePanoramicaTerritoryBaseKind;
  /** Stable id for TerritoryLayerImport. */
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
  /** Declared CRS for geo payloads. */
  crs: "WGS84";
  sources: readonly TerritoryDataSource[];
  /** Planned physical layers (boundary, roads, …). */
  layers: readonly LifePanoramicaTerritoryLayerSlot[];
  layerImports: readonly TerritoryLayerImport[];
};

/**
 * Planned layer slots for Life Panoramica.
 * Only `roads` has a real dataRef in v1.
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
      dataRef: LIFE_PANORAMICA_ROADS_DATA_REF,
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

/** External datasets — OSM roads extract v1 only. */
export const lifePanoramicaTerritoryDataSources: readonly TerritoryDataSource[] =
  [
    {
      id: "panoramica-osm-roads-v1",
      provider: "osm",
      format: "geojson",
      sourceRef: LIFE_PANORAMICA_ROADS_DATA_REF,
      crs: "WGS84",
      version: "v1",
      label: "OpenStreetMap highways (Urbanització Panoràmica AOI)",
    },
  ];

/**
 * Import instructions (external → LifeMapBaseLayer).
 * Roads only — no buildings / water / green / golf yet.
 */
export const lifePanoramicaTerritoryLayerImports: readonly TerritoryLayerImport[] =
  [
    {
      id: "import-roads",
      territoryId: DEMO_TERRITORY_ID,
      sourceId: "panoramica-osm-roads-v1",
      externalLayer: "roads.json",
      layerKind: "roads",
      targetType: "roads",
      dataRef: LIFE_PANORAMICA_ROADS_DATA_REF,
      sourceType: "vector",
      visible: true,
      zIndex: 20,
      label: "Calles internas",
    },
  ];

/**
 * Canonical territory data package for this tenant.
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
 * Roads v1 only until more imports are added.
 */
export function projectLifePanoramicaTerritoryBaseLayers(): {
  layers: LifeMapBaseLayer[];
  rejected: {
    importId: string;
    issues: { code: string; message: string }[];
  }[];
} {
  for (const source of lifePanoramicaTerritoryData.sources) {
    const sourceIssues = validateTerritoryDataSource(source);
    if (sourceIssues.length > 0) {
      throw new Error(
        `[life-panoramica] Invalid TerritoryDataSource "${source.id}": ${sourceIssues
          .map((i) => i.message)
          .join("; ")}`,
      );
    }
  }

  return projectTerritoryLayerImports(lifePanoramicaTerritoryData.layerImports, {
    expectedTerritoryId: DEMO_TERRITORY_ID,
  });
}

/** Bounding box from the real OSM roads extract (WGS84). */
export function getLifePanoramicaRoadsV1Bounds(): {
  west: number;
  south: number;
  east: number;
  north: number;
} {
  const bbox = roadsV1Manifest.bbox;
  if (!Array.isArray(bbox) || bbox.length !== 4) {
    throw new Error("[life-panoramica] roads v1 manifest bbox is invalid");
  }
  const west = bbox[0];
  const south = bbox[1];
  const east = bbox[2];
  const north = bbox[3];
  if (
    typeof west !== "number" ||
    typeof south !== "number" ||
    typeof east !== "number" ||
    typeof north !== "number"
  ) {
    throw new Error("[life-panoramica] roads v1 manifest bbox must be numbers");
  }
  return { west, south, east, north };
}
