/**
 * Minimal Life Valley Life Map pack — second-tenant validation.
 * Distinct camera / objects from Panorámica; null territory GeoJSON until Valley GIS lands.
 */

import {
  createNullTerritoryDataResolver,
  type LifeMapObject,
  type LifeMapTerritory,
} from "@life-community-os/types";
import type { LifeMapTenantPack } from "./life-map-tenant-pack";

const VALLEY_CAMERA = {
  target: { lat: 39.4825, lng: -0.378 },
  distance: 420,
  headingDegrees: 12,
  pitchDegrees: 55,
};

const valleyTerritory: LifeMapTerritory = {
  tenantId: "life-valley",
  territoryId: "terr-life-valley",
  defaultCamera: VALLEY_CAMERA,
  crs: "WGS84",
  bounds: {
    west: -0.395,
    south: 39.47,
    east: -0.36,
    north: 39.495,
  },
  layers: [
    {
      id: "community",
      sourceModuleId: "community",
      visible: true,
      requiredCapability: "community.content.view",
      requiresModuleEnabled: true,
      label: "Lugares",
      order: 10,
    },
  ],
  baseLayers: [],
  moduleEnabled: true,
};

function listValleySpatialObjects(): LifeMapObject[] {
  return [
    {
      tenantId: "life-valley",
      territoryId: "terr-life-valley",
      objectId: "lv-obj-plaza",
      type: "place",
      layerId: "community",
      state: "active",
      position: {
        lat: VALLEY_CAMERA.target.lat,
        lng: VALLEY_CAMERA.target.lng,
      },
      availableActions: ["open", "navigate"],
      label: "Plaza Life Valley",
      ref: {
        moduleId: "locations",
        entityId: "loc-catalog-lv-plaza-life-valley",
        entityKind: "location",
      },
    },
    {
      tenantId: "life-valley",
      territoryId: "terr-life-valley",
      objectId: "lv-obj-cafe",
      type: "place",
      layerId: "community",
      state: "active",
      position: {
        lat: VALLEY_CAMERA.target.lat + 0.0007,
        lng: VALLEY_CAMERA.target.lng - 0.0005,
      },
      availableActions: ["open", "navigate"],
      label: "Café del Valle",
      ref: {
        moduleId: "locations",
        entityId: "loc-catalog-lv-cafe-life-valley",
        entityKind: "location",
      },
    },
  ];
}

export function createLifeValleyLifeMapPack(): LifeMapTenantPack {
  return {
    tenantId: "life-valley",
    territoryName: "Life Valley",
    visual: {
      atmosphere: "day",
      groundDetail: "soft",
      showLabelsByDefault: true,
      accentToken: "emerald",
    },
    territory: valleyTerritory,
    listObjects: () => listValleySpatialObjects(),
    createTerritoryDataResolver: () => createNullTerritoryDataResolver(),
    dataVersion: "life-valley-minimal-v1",
    enrichContext: (object) => ({
      label: object.label,
      summary:
        object.objectId === "lv-obj-cafe"
          ? "Cafetería exclusiva del segundo tenant"
          : "Núcleo social de Life Valley",
      experienceTag: "valley",
      heroTone: "#1a6b4a",
      categoryHint: object.type,
    }),
  };
}
