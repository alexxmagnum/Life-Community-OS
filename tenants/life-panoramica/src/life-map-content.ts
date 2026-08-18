/**
 * Life Panoramica — Life Map spatial content (tenant pack only).
 *
 * Projects existing domain entities into LifeMapObject shapes.
 * Life Map is never the source of truth — refs point at Local / Resources /
 * Experiences / Official / Alerts.
 *
 * Positions: local layout metres projected to WGS84 via territory center
 * (real OSM/Catastro bounds) — not invented absolute GPS.
 */

import type {
  HousingListing,
  LifeMapObject,
  LifeMapObjectProjectionInput,
  LifeMapPosition,
} from "@life-community-os/types";
import {
  createLifeMapObjectRegistry,
  projectLifeMapObject,
  type LifeMapObjectRegistry,
} from "@life-community-os/types";

import { listActiveCommunityAlerts } from "./community-alerts";
import {
  DEMO_AREA_ALDEA_GOLF,
  DEMO_AREA_CENTRO,
  DEMO_AUTHORITY_SECURITY_ID,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";
import { getExperienceById } from "./experiences";
import {
  getLifePanoramicaLifeMapTerritory,
  projectLifePanoramicaLocalMetersToGeo,
} from "./life-map";
import { getLocalEntityById } from "./local-places";
import { getOfficialEntityById } from "./official-entities";
import { getResourceById } from "./resources";

/** Reserved spatial AssetKeys — Spatial Library vocabulary. */
export const LIFE_PANORAMICA_SPATIAL_ASSET_KEYS = {
  ikon: "place.restaurant.spatial_object",
  terraza: "place.restaurant.spatial_object",
  golfClub: "recreation.golf.spatial_object",
  pool: "recreation.pool.spatial_object",
  clubhouse: "place.clubhouse.spatial_object",
  gardenService: "place.service.spatial_object",
  lockService: "place.service.spatial_object",
  vetService: "place.service.spatial_object",
  bakery: "place.shop.spatial_object",
  market: "place.shop.spatial_object",
  path: "nature.path.spatial_object",
  mirador: "nature.path.spatial_object",
  padel: "recreation.padel.spatial_object",
  housingPreview: "building.house.building",
  security: "utility.security.spatial_object",
  gathering: "community.gathering.spatial_object",
  alert: "community.alert.spatial_object",
} as const;

export type LifePanoramicaSpatialAssetKey =
  (typeof LIFE_PANORAMICA_SPATIAL_ASSET_KEYS)[keyof typeof LIFE_PANORAMICA_SPATIAL_ASSET_KEYS];

/**
 * Local layout anchors (metres east/north of territory geo origin).
 * Relative placement — projected to WGS84 for MapLibre / Three.
 */
const LOCAL_LAYOUT_METERS = {
  ikon: { x: -22, y: 14 },
  terraza: { x: -36, y: 18 },
  golfClub: { x: 26, y: -12 },
  pool: { x: -8, y: 22 },
  clubhouse: { x: 12, y: 8 },
  gardenService: { x: -30, y: -6 },
  lockService: { x: 34, y: 16 },
  vetService: { x: 8, y: -22 },
  bakery: { x: -18, y: -18 },
  market: { x: 4, y: -8 },
  path: { x: -40, y: 30 },
  mirador: { x: 38, y: 28 },
  padel: { x: 18, y: 20 },
  housingPreview: { x: 6, y: 28 },
  security: { x: -4, y: -28 },
  expCoffee: { x: 10, y: 6 },
  expGolf: { x: 22, y: -8 },
  expPadel: { x: 16, y: 18 },
  expSunset: { x: -38, y: 26 },
  alertNorth: { x: 20, y: 36 },
} as const;

function geoFromLocal(local: { x: number; y: number }): LifeMapPosition {
  return projectLifePanoramicaLocalMetersToGeo(local);
}

const PLACE_REF_MODULE = "community" as const;
const PLACE_ENTITY_KIND = "local_entity" as const;

export const LIFE_PANORAMICA_SPATIAL_PLACE_IDS = {
  ikon: "lp-ikon",
  terraza: "lp-terraza",
  golfClub: "lp-golf-club",
  pool: "lp-pool",
  clubhouse: "lp-clubhouse",
  garden: "lp-garden",
  lock: "lp-lock",
  vet: "lp-vet",
  bakery: "lp-pan",
  market: "lp-market",
  path: "lp-path",
  mirador: "lp-mirador",
} as const;

export const LIFE_PANORAMICA_SPATIAL_RESOURCE_IDS = {
  padel: "res-padel-aldea",
} as const;

export const LIFE_PANORAMICA_SPATIAL_EXPERIENCE_IDS = {
  coffee: "exp-coffee",
  golf: "exp-golf-afternoon",
  padel: "exp-padel-social",
  sunset: "exp-sunset-walk",
} as const;

function requireLocalEntity(entityId: string) {
  const entity = getLocalEntityById(entityId);
  if (!entity) {
    throw new Error(
      `[life-map-content] Missing LocalEntity "${entityId}" — projection requires existing domain content.`,
    );
  }
  return entity;
}

/**
 * Project a Local Entity place onto Life Map (domain ref only).
 */
export function projectLocalEntityToLifeMapInput(input: {
  entityId: string;
  objectId: string;
  position: LifeMapPosition;
  asset3DKey?: string;
  communityAreaId?: string;
  type?: "place" | "service";
  availableActions?: LifeMapObjectProjectionInput["availableActions"];
}): LifeMapObjectProjectionInput {
  const entity = requireLocalEntity(input.entityId);
  const type =
    input.type ?? (entity.kind === "service" ? "service" : "place");
  return {
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    objectId: input.objectId,
    type,
    layerId: type === "service" ? "services" : "places",
    ref: {
      moduleId: PLACE_REF_MODULE,
      entityId: entity.id,
      entityKind: PLACE_ENTITY_KIND,
    },
    position: input.position,
    asset3DKey: input.asset3DKey,
    state: "idle",
    availableActions: input.availableActions ?? ["open", "navigate"],
    label: entity.name,
    communityAreaId:
      input.communityAreaId ?? entity.communityAreaId ?? DEMO_AREA_ALDEA_GOLF,
  };
}

export function projectResourceToLifeMapInput(input: {
  resourceId: string;
  objectId: string;
  position: LifeMapPosition;
  asset3DKey?: string;
}): LifeMapObjectProjectionInput {
  const resource = getResourceById(input.resourceId);
  if (!resource) {
    throw new Error(
      `[life-map-content] Missing Resource "${input.resourceId}"`,
    );
  }
  return {
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    objectId: input.objectId,
    type: "resource",
    layerId: "experiences",
    ref: {
      moduleId: "resources",
      entityId: resource.id,
      entityKind: "resource",
    },
    position: input.position,
    asset3DKey: input.asset3DKey,
    state: "idle",
    availableActions: ["open", "reserve"],
    label: resource.name,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
  };
}

export function projectExperienceToLifeMapInput(input: {
  experienceId: string;
  objectId: string;
  position: LifeMapPosition;
  asset3DKey?: string;
}): LifeMapObjectProjectionInput | null {
  const exp = getExperienceById(input.experienceId);
  if (!exp) return null;
  if (
    exp.status === "cancelled" ||
    exp.status === "expired" ||
    exp.status === "completed"
  ) {
    return null;
  }
  return {
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    objectId: input.objectId,
    type: "experience",
    layerId: "experiences",
    ref: {
      moduleId: "experiences",
      entityId: exp.id,
      entityKind: "experience",
    },
    position: input.position,
    asset3DKey:
      input.asset3DKey ?? LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.gathering,
    state: exp.status === "full" ? "full" : "active",
    availableActions: ["open", "join"],
    label: exp.title,
    communityAreaId: exp.communityAreaId ?? DEMO_AREA_ALDEA_GOLF,
  };
}

export function projectOfficialToLifeMapInput(input: {
  officialId: string;
  objectId: string;
  position: LifeMapPosition;
  asset3DKey?: string;
}): LifeMapObjectProjectionInput {
  const official = getOfficialEntityById(input.officialId);
  if (!official) {
    throw new Error(
      `[life-map-content] Missing OfficialEntity "${input.officialId}"`,
    );
  }
  return {
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    objectId: input.objectId,
    type: "official",
    layerId: "official",
    ref: {
      moduleId: "official",
      entityId: official.id,
      entityKind: official.slug,
    },
    position: input.position,
    asset3DKey:
      input.asset3DKey ?? LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.security,
    state: "idle",
    availableActions: ["open", "navigate"],
    label: official.name,
    communityAreaId: DEMO_AREA_CENTRO,
  };
}

export function projectCommunityAlertToLifeMapInput(input: {
  alertId: string;
  title: string;
  position: LifeMapPosition;
  objectId: string;
}): LifeMapObjectProjectionInput {
  return {
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    objectId: input.objectId,
    type: "community",
    layerId: "community",
    ref: {
      moduleId: "community",
      entityId: input.alertId,
      entityKind: "community_alert",
    },
    position: input.position,
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.alert,
    state: "active",
    availableActions: ["open"],
    label: input.title,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
  };
}

/** Core community places. */
export const lifePanoramicaIkonSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.ikon,
    objectId: "lmo-place-ikon",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.ikon),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.ikon,
  });

export const lifePanoramicaTerrazaSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.terraza,
    objectId: "lmo-place-terraza",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.terraza),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.terraza,
  });

export const lifePanoramicaGolfSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.golfClub,
    objectId: "lmo-place-golf-club",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.golfClub),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.golfClub,
  });

export const lifePanoramicaPoolSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.pool,
    objectId: "lmo-place-pool",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.pool),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.pool,
  });

export const lifePanoramicaClubhouseSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.clubhouse,
    objectId: "lmo-place-clubhouse",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.clubhouse),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.clubhouse,
  });

export const lifePanoramicaGardenServiceSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.garden,
    objectId: "lmo-service-garden",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.gardenService),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.gardenService,
    type: "service",
    availableActions: ["open", "message"],
  });

export const lifePanoramicaLockServiceSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.lock,
    objectId: "lmo-service-lock",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.lockService),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.lockService,
    type: "service",
    availableActions: ["open", "message"],
  });

export const lifePanoramicaVetServiceSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.vet,
    objectId: "lmo-service-vet",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.vetService),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.vetService,
    type: "service",
    availableActions: ["open", "message"],
  });

export const lifePanoramicaBakerySpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.bakery,
    objectId: "lmo-place-bakery",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.bakery),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.bakery,
  });

export const lifePanoramicaMarketSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.market,
    objectId: "lmo-place-market",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.market),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.market,
  });

export const lifePanoramicaPathSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.path,
    objectId: "lmo-place-path",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.path),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.path,
  });

export const lifePanoramicaMiradorSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.mirador,
    objectId: "lmo-place-mirador",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.mirador),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.mirador,
  });

export const lifePanoramicaPadelSpatialProjection: LifeMapObjectProjectionInput =
  projectResourceToLifeMapInput({
    resourceId: LIFE_PANORAMICA_SPATIAL_RESOURCE_IDS.padel,
    objectId: "lmo-resource-padel",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.padel),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.padel,
  });

export const lifePanoramicaSecuritySpatialProjection: LifeMapObjectProjectionInput =
  projectOfficialToLifeMapInput({
    officialId: DEMO_AUTHORITY_SECURITY_ID,
    objectId: "lmo-official-security",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.security),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.security,
  });

/**
 * Housing maquette preview — decoration only (no Housing listing invented).
 */
export const lifePanoramicaHousingMaquetteProjection: LifeMapObjectProjectionInput =
  {
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    objectId: "lmo-building-house-preview",
    type: "decoration",
    layerId: "housing",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.housingPreview),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.housingPreview,
    state: "idle",
    availableActions: ["open"],
    label: "Vivienda",
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
  };

export type LifePanoramicaHousingSpatialLayer = {
  layerId: "housing";
  projections: readonly LifeMapObjectProjectionInput[];
};

export const lifePanoramicaHousingSpatialLayer: LifePanoramicaHousingSpatialLayer =
  {
    layerId: "housing",
    projections: [],
  };

export function projectHousingListingToLifeMapInput(input: {
  listing: Pick<HousingListing, "id" | "title" | "status" | "publication">;
  objectId: string;
  position: LifeMapPosition;
  asset3DKey?: string;
}): LifeMapObjectProjectionInput {
  const { listing } = input;
  return {
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    objectId: input.objectId,
    type: "housing",
    layerId: "housing",
    ref: {
      moduleId: "housing",
      entityId: listing.id,
      entityKind: "housing_listing",
    },
    position: input.position,
    asset3DKey: input.asset3DKey,
    state: listing.status === "published" ? "active" : "unavailable",
    availableActions: ["open", "message"],
    label: listing.title,
    communityAreaId: listing.publication.communityAreaId,
  };
}

function listExperienceSpatialProjections(): LifeMapObjectProjectionInput[] {
  const specs = [
    {
      id: LIFE_PANORAMICA_SPATIAL_EXPERIENCE_IDS.coffee,
      objectId: "lmo-exp-coffee",
      local: LOCAL_LAYOUT_METERS.expCoffee,
    },
    {
      id: LIFE_PANORAMICA_SPATIAL_EXPERIENCE_IDS.golf,
      objectId: "lmo-exp-golf",
      local: LOCAL_LAYOUT_METERS.expGolf,
    },
    {
      id: LIFE_PANORAMICA_SPATIAL_EXPERIENCE_IDS.padel,
      objectId: "lmo-exp-padel",
      local: LOCAL_LAYOUT_METERS.expPadel,
    },
    {
      id: LIFE_PANORAMICA_SPATIAL_EXPERIENCE_IDS.sunset,
      objectId: "lmo-exp-sunset",
      local: LOCAL_LAYOUT_METERS.expSunset,
    },
  ] as const;

  const out: LifeMapObjectProjectionInput[] = [];
  for (const spec of specs) {
    const projected = projectExperienceToLifeMapInput({
      experienceId: spec.id,
      objectId: spec.objectId,
      position: geoFromLocal(spec.local),
    });
    if (projected) out.push(projected);
  }
  return out;
}

function listAlertSpatialProjections(): LifeMapObjectProjectionInput[] {
  return listActiveCommunityAlerts()
    .slice(0, 2)
    .map((alert, index) =>
      projectCommunityAlertToLifeMapInput({
        alertId: alert.id,
        title: alert.title,
        objectId: `lmo-alert-${alert.id}`,
        position: geoFromLocal({
          x: LOCAL_LAYOUT_METERS.alertNorth.x + index * 6,
          y: LOCAL_LAYOUT_METERS.alertNorth.y,
        }),
      }),
    );
}

/** Seeded Life OS objects for the living twin. */
export const lifePanoramicaSeededSpatialProjections: readonly LifeMapObjectProjectionInput[] =
  [
    lifePanoramicaIkonSpatialProjection,
    lifePanoramicaTerrazaSpatialProjection,
    lifePanoramicaGolfSpatialProjection,
    lifePanoramicaPoolSpatialProjection,
    lifePanoramicaClubhouseSpatialProjection,
    lifePanoramicaGardenServiceSpatialProjection,
    lifePanoramicaLockServiceSpatialProjection,
    lifePanoramicaVetServiceSpatialProjection,
    lifePanoramicaBakerySpatialProjection,
    lifePanoramicaMarketSpatialProjection,
    lifePanoramicaPathSpatialProjection,
    lifePanoramicaMiradorSpatialProjection,
    lifePanoramicaPadelSpatialProjection,
    lifePanoramicaSecuritySpatialProjection,
    lifePanoramicaHousingMaquetteProjection,
  ];

export function listLifePanoramicaSpatialProjections(): LifeMapObjectProjectionInput[] {
  return [
    ...lifePanoramicaSeededSpatialProjections,
    ...lifePanoramicaHousingSpatialLayer.projections,
    ...listExperienceSpatialProjections(),
    ...listAlertSpatialProjections(),
  ];
}

export function listLifePanoramicaSpatialObjects(): LifeMapObject[] {
  return listLifePanoramicaSpatialProjections().map((input) =>
    projectLifeMapObject(input),
  );
}

export function createLifePanoramicaSpatialObjectRegistry(): {
  registry: LifeMapObjectRegistry;
  registered: LifeMapObject[];
  rejected: { objectId: string; issues: { code: string; message: string }[] }[];
} {
  const territory = getLifePanoramicaLifeMapTerritory();
  const registry = createLifeMapObjectRegistry(territory);
  const registered: LifeMapObject[] = [];
  const rejected: {
    objectId: string;
    issues: { code: string; message: string }[];
  }[] = [];

  for (const input of listLifePanoramicaSpatialProjections()) {
    const result = registry.register(input);
    if (result.ok) {
      registered.push(result.object);
    } else {
      rejected.push({ objectId: input.objectId, issues: result.issues });
    }
  }

  return { registry, registered, rejected };
}
