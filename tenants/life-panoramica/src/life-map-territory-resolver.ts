/**
 * Life Panoramica — injectable TerritoryDataResolver.
 *
 * Resolves tenant-owned `dataRef` values to GeoJSON payloads.
 * No Core tokens, no map SDK, no other tenants.
 */

import type {
  TerritoryDataPayload,
  TerritoryDataResolver,
} from "@life-community-os/types";
import { createStaticTerritoryDataResolver } from "@life-community-os/types";

import roadsV1GeoJson from "../territory/data/roads/v1/roads.json";
import roadsV1Manifest from "../territory/data/roads/v1/manifest.json";
import buildingsV1GeoJson from "../territory/data/buildings/v1/buildings.json";
import buildingsV1Manifest from "../territory/data/buildings/v1/manifest.json";
import waterV1GeoJson from "../territory/data/water/v1/water.json";
import waterV1Manifest from "../territory/data/water/v1/manifest.json";
import greenV1GeoJson from "../territory/data/green/v1/green.json";
import greenV1Manifest from "../territory/data/green/v1/manifest.json";

/** Opaque dataRef for the OSM roads extract (v1). */
export const LIFE_PANORAMICA_ROADS_DATA_REF =
  "tenant://life-panoramica/base/roads/v1" as const;

/** Opaque dataRef for the Cadastre buildings extract (v1). */
export const LIFE_PANORAMICA_BUILDINGS_DATA_REF =
  "tenant://life-panoramica/base/buildings/v1" as const;

/** Opaque dataRef for the OSM water extract (v1). */
export const LIFE_PANORAMICA_WATER_DATA_REF =
  "tenant://life-panoramica/base/water/v1" as const;

/** Opaque dataRef for the OSM green extract (v1). */
export const LIFE_PANORAMICA_GREEN_DATA_REF =
  "tenant://life-panoramica/base/green/v1" as const;

export const lifePanoramicaRoadsV1Manifest = roadsV1Manifest;
export const lifePanoramicaBuildingsV1Manifest = buildingsV1Manifest;
export const lifePanoramicaWaterV1Manifest = waterV1Manifest;
export const lifePanoramicaGreenV1Manifest = greenV1Manifest;

const LIFE_PANORAMICA_TERRITORY_PAYLOADS: Record<string, TerritoryDataPayload> =
  {
    [LIFE_PANORAMICA_ROADS_DATA_REF]: {
      kind: "geojson",
      dataRef: LIFE_PANORAMICA_ROADS_DATA_REF,
      geojson: roadsV1GeoJson,
    },
    [LIFE_PANORAMICA_BUILDINGS_DATA_REF]: {
      kind: "geojson",
      dataRef: LIFE_PANORAMICA_BUILDINGS_DATA_REF,
      geojson: buildingsV1GeoJson,
    },
    [LIFE_PANORAMICA_WATER_DATA_REF]: {
      kind: "geojson",
      dataRef: LIFE_PANORAMICA_WATER_DATA_REF,
      geojson: waterV1GeoJson,
    },
    [LIFE_PANORAMICA_GREEN_DATA_REF]: {
      kind: "geojson",
      dataRef: LIFE_PANORAMICA_GREEN_DATA_REF,
      geojson: greenV1GeoJson,
    },
  };

/**
 * Tenant-scoped resolver — only Life Panoramica territory refs.
 * Unknown refs fail closed (`not_found`).
 */
export function createLifePanoramicaTerritoryDataResolver(): TerritoryDataResolver {
  return createStaticTerritoryDataResolver(LIFE_PANORAMICA_TERRITORY_PAYLOADS);
}
