/**
 * Life Panoramica — Life Map territory foundation (tenant content only).
 *
 * Configures the spatial twin frame for this tenant: identity, prepared camera,
 * available layers, and basic visual knobs. No map SDK, UI, routes, renderer,
 * binary assets, or demo spatial objects.
 *
 * Module remains fail-closed (`moduleEnabled: false`) until product activation.
 */

import type { LifeMapLayer, LifeMapTerritory } from "@life-community-os/types";

import { CAPABILITIES } from "./capabilities";
import { DEMO_TENANT_ID, DEMO_TERRITORY_ID } from "./demo-ids";
import { lifePanoramicaFeatures } from "./features";
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
  /** Accent token key aligned with tenant brand modes (not a hex color). */
  accentToken: "cyan" | "lime" | "neutral";
};

/**
 * Full Life Map pack for Life Panoramica.
 * `territory` conforms to the platform `LifeMapTerritory` contract.
 */
export type LifePanoramicaLifeMapConfig = {
  /** Resident-facing territory name (tenant content). */
  territoryName: string;
  visual: LifePanoramicaLifeMapVisualConfig;
  territory: LifeMapTerritory;
};

/** Layer catalogue prepared for this territory — no projected objects yet. */
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
 * `moduleEnabled` mirrors the tenant feature flag (prepared, not activated).
 */
export const lifePanoramicaLifeMapTerritory: LifeMapTerritory = {
  tenantId: DEMO_TENANT_ID,
  territoryId: DEMO_TERRITORY_ID,
  defaultCamera: lifePanoramicaPreparedCamera,
  layers: [...lifePanoramicaLifeMapLayers],
  moduleEnabled: lifePanoramicaFeatures.lifeMap,
};

export const lifePanoramicaLifeMap: LifePanoramicaLifeMapConfig = {
  territoryName:
    lifePanoramicaTheme.identity?.territoryName ?? "Life Panoramica",
  visual: lifePanoramicaLifeMapVisual,
  territory: lifePanoramicaLifeMapTerritory,
};

/** Convenience accessor — single territory for this tenant pack. */
export function getLifePanoramicaLifeMapTerritory(): LifeMapTerritory {
  return lifePanoramicaLifeMap.territory;
}

export function getLifePanoramicaLifeMapConfig(): LifePanoramicaLifeMapConfig {
  return lifePanoramicaLifeMap;
}
