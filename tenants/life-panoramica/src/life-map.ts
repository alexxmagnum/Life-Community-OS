/**
 * Life Panoramica — Life Map territory foundation (tenant content only).
 *
 * Configures the spatial twin frame for this tenant: identity, prepared camera,
 * Life OS layers, and links to the Territory Data Package for real base data.
 * No map SDK, UI, routes, renderer, binary assets, or invented geometry.
 *
 * Module remains fail-closed (`moduleEnabled: false`) until product activation.
 */

import type {
  LifeMapBaseLayer,
  LifeMapLayer,
  LifeMapTerritory,
} from "@life-community-os/types";

import { CAPABILITIES } from "./capabilities";
import { DEMO_TENANT_ID, DEMO_TERRITORY_ID } from "./demo-ids";
import { lifePanoramicaFeatures } from "./features";
import {
  getLifePanoramicaTerritoryData,
  lifePanoramicaTerritoryData,
  listLifePanoramicaTerritoryDataSources,
  listLifePanoramicaTerritoryLayerImports,
  listLifePanoramicaTerritoryLayerSlots,
  projectLifePanoramicaTerritoryBaseLayers,
  type LifePanoramicaTerritoryDataPackage,
} from "./life-map-territory-data";
import { lifePanoramicaTheme } from "./theme";

/**
 * Tenant-local visual knobs for a future renderer.
 * Opaque style keys only — no textures, meshes, or vendor map styles.
 */
export type LifePanoramicaLifeMapVisualConfig = {
  /** Default atmosphere hint for the twin viewport. */
  atmosphere: "day" | "dusk" | "night";
  /** Terrain / base mesh density hint. */
  groundDetail: "soft" | "standard";
  /** Whether layer labels start visible when the map opens. */
  showLabelsByDefault: boolean;
  /** Accent token key aligned with tenant brand modes (not a hex brand lock). */
  accentToken: "cyan" | "lime" | "neutral";
};

/**
 * Full Life Map pack for Life Panoramica.
 * `territory` conforms to the platform `LifeMapTerritory` contract.
 * `territoryData` holds tenant-owned source/import organization (empty until real data).
 */
export type LifePanoramicaLifeMapConfig = {
  /** Resident-facing territory name (tenant content). */
  territoryName: string;
  visual: LifePanoramicaLifeMapVisualConfig;
  territory: LifeMapTerritory;
  /**
   * Tenant territory data package:
   * `{ sources: [], layerImports: [], layers: planned slots }`.
   */
  territoryData: LifePanoramicaTerritoryDataPackage;
};

/** Layer catalogue prepared for this territory — Life OS product layers only. */
export const lifePanoramicaLifeMapLayers: readonly LifeMapLayer[] = [
  {
    id: "places",
    sourceModuleId: "community",
    visible: true,
    requiredCapability: CAPABILITIES.localView,
    requiresModuleEnabled: true,
    label: "Lugares",
    order: 10,
  },
  {
    id: "housing",
    sourceModuleId: "housing",
    visible: true,
    requiredCapability: CAPABILITIES.housingView,
    requiresModuleEnabled: true,
    label: "Vivienda",
    order: 20,
  },
  {
    id: "services",
    sourceModuleId: "services",
    visible: true,
    requiredCapability: CAPABILITIES.localView,
    requiresModuleEnabled: true,
    label: "Servicios",
    order: 30,
  },
  {
    id: "experiences",
    sourceModuleId: "experiences",
    visible: true,
    requiredCapability: CAPABILITIES.experienceView,
    requiresModuleEnabled: true,
    label: "Experiencias",
    order: 40,
  },
  {
    id: "community",
    sourceModuleId: "community",
    visible: true,
    requiredCapability: CAPABILITIES.contentView,
    requiresModuleEnabled: true,
    label: "Comunidad",
    order: 50,
  },
  {
    id: "official",
    sourceModuleId: "official",
    visible: true,
    requiredCapability: CAPABILITIES.channelView,
    requiresModuleEnabled: true,
    label: "Oficial",
    order: 60,
  },
];

/**
 * Resolved physical base layers on the territory frame.
 * Empty until territoryData.layerImports project real refs.
 */
export const lifePanoramicaLifeMapBaseLayers: readonly LifeMapBaseLayer[] = [];

/**
 * Prepared camera inside the tenant local space.
 * Local anchors — not a map-vendor id and not survey-grade WGS84 yet.
 */
const lifePanoramicaPreparedCamera = {
  target: {
    kind: "local" as const,
    spaceId: DEMO_TERRITORY_ID,
    x: 0,
    y: 0,
    z: 0,
  },
  distance: 1400,
  headingDegrees: 28,
  pitchDegrees: 52,
};

export const lifePanoramicaLifeMapVisual: LifePanoramicaLifeMapVisualConfig = {
  atmosphere: "dusk",
  groundDetail: "soft",
  showLabelsByDefault: true,
  accentToken: "cyan",
};

/**
 * Platform territory frame for Life Panoramica.
 * `baseLayers` stay empty until real territorial data exists in territoryData.
 */
export const lifePanoramicaLifeMapTerritory: LifeMapTerritory = {
  tenantId: DEMO_TENANT_ID,
  territoryId: DEMO_TERRITORY_ID,
  defaultCamera: lifePanoramicaPreparedCamera,
  crs: "WGS84",
  layers: [...lifePanoramicaLifeMapLayers],
  baseLayers: [...lifePanoramicaLifeMapBaseLayers],
  moduleEnabled: lifePanoramicaFeatures.lifeMap,
};

export const lifePanoramicaLifeMap: LifePanoramicaLifeMapConfig = {
  territoryName:
    lifePanoramicaTheme.identity?.territoryName ?? "Life Panoramica",
  visual: lifePanoramicaLifeMapVisual,
  territory: lifePanoramicaLifeMapTerritory,
  territoryData: lifePanoramicaTerritoryData,
};

/** Convenience accessor — single territory for this tenant pack. */
export function getLifePanoramicaLifeMapTerritory(): LifeMapTerritory {
  return lifePanoramicaLifeMap.territory;
}

export function getLifePanoramicaLifeMapConfig(): LifePanoramicaLifeMapConfig {
  return lifePanoramicaLifeMap;
}

/** Base-layer configuration slot — empty until real data refs are supplied. */
export function listLifePanoramicaLifeMapBaseLayers(): readonly LifeMapBaseLayer[] {
  return lifePanoramicaLifeMap.territory.baseLayers ?? [];
}

export {
  getLifePanoramicaTerritoryData,
  listLifePanoramicaTerritoryDataSources,
  listLifePanoramicaTerritoryLayerImports,
  listLifePanoramicaTerritoryLayerSlots,
  projectLifePanoramicaTerritoryBaseLayers,
  type LifePanoramicaTerritoryDataPackage,
};
