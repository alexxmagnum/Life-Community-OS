/**
 * Register known tenant Life Map packs.
 * Add new tenants here without changing LifeMapScreen wiring.
 */

import {
  createLifePanoramicaTerritoryDataResolver,
  enrichLifePanoramicaLifeMapContext,
  getLifePanoramicaLifeMapConfig,
  listLifePanoramicaSpatialObjects,
} from "@life-community-os/tenant-life-panoramica";

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
      createTerritoryDataResolver: () =>
        createLifePanoramicaTerritoryDataResolver(),
      dataVersion: "panoramica-demo-v1",
      enrichContext: (object) => enrichLifePanoramicaLifeMapContext(object),
    };
  });
}
