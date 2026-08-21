/**
 * Register known tenant Life Map packs.
 * Add new tenants here without changing LifeMapScreen wiring.
 */

import {
  createLifePanoramicaTerritoryDataResolver,
  enrichLifePanoramicaLifeMapContext,
  getLifePanoramicaLifeMapConfig,
  listLifePanoramicaSpatialObjects,
  listLifePanoramicaTerritoryTwin,
  buildLifePanoramicaTerritoryAmenityGeoJson,
  buildLifePanoramicaTerritoryPointGeoJson,
} from "@life-community-os/tenant-life-panoramica";

import { createLifeValleyLifeMapPack } from "./life-map-life-valley-pack";
import { registerLifeMapTenantPack } from "./life-map-tenant-pack";

let registered = false;

export function ensureLifeMapTenantPacksRegistered(): void {
  if (registered) return;
  registered = true;

  registerLifeMapTenantPack("life-panoramica", () => {
    const config = getLifePanoramicaLifeMapConfig();
    return {
      tenantId: "life-panoramica",
      territoryName: config.territoryName,
      visual: config.visual,
      territory: config.territory,
      listObjects: () => listLifePanoramicaSpatialObjects(),
      listTerritoryObjects: () => listLifePanoramicaTerritoryTwin(),
      territoryAmenities: () => buildLifePanoramicaTerritoryAmenityGeoJson(),
      territoryPoints: () => buildLifePanoramicaTerritoryPointGeoJson(),
      createTerritoryDataResolver: () =>
        createLifePanoramicaTerritoryDataResolver(),
      dataVersion: "panoramica-premium-v1",
      enrichContext: (object) => enrichLifePanoramicaLifeMapContext(object),
    };
  });

  registerLifeMapTenantPack("life-valley", () => createLifeValleyLifeMapPack());
}
