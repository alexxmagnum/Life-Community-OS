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

/** Opaque dataRef for the OSM roads extract (v1). */
export const LIFE_PANORAMICA_ROADS_DATA_REF =
  "tenant://life-panoramica/base/roads/v1" as const;

export const lifePanoramicaRoadsV1Manifest = roadsV1Manifest;

const roadsPayload: TerritoryDataPayload = {
  kind: "geojson",
  dataRef: LIFE_PANORAMICA_ROADS_DATA_REF,
  geojson: roadsV1GeoJson,
};

const LIFE_PANORAMICA_TERRITORY_PAYLOADS: Record<string, TerritoryDataPayload> =
  {
    [LIFE_PANORAMICA_ROADS_DATA_REF]: roadsPayload,
  };

/**
 * Tenant-scoped resolver — only Life Panoramica territory refs.
 * Unknown refs fail closed (`not_found`).
 */
export function createLifePanoramicaTerritoryDataResolver(): TerritoryDataResolver {
  return createStaticTerritoryDataResolver(LIFE_PANORAMICA_TERRITORY_PAYLOADS);
}
