/**
 * Life Panoramica — Life Map spatial content foundation (tenant pack only).
 *
 * Projects existing domain entities into LifeMapObject shapes.
 * Life Map is never the source of truth — refs point at Local Entity / Resources / Housing.
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

import {
  DEMO_AREA_ALDEA_GOLF,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";
import {
  getLifePanoramicaLifeMapTerritory,
  projectLifePanoramicaLocalMetersToGeo,
} from "./life-map";
import { getLocalEntityById } from "./local-places";
import { getResourceById } from "./resources";

/** Reserved spatial AssetKeys — Spatial Library vocabulary (catalog may be empty). */
export const LIFE_PANORAMICA_SPATIAL_ASSET_KEYS = {
  ikon: "place.restaurant.spatial_object",
  golfClub: "recreation.golf.spatial_object",
  pool: "recreation.pool.spatial_object",
  clubhouse: "place.cafe.spatial_object",
  gardenService: "service.garden.spatial_object",
  padel: "recreation.padel.spatial_object",
  housingPreview: "building.house.building",
} as const;

export type LifePanoramicaSpatialAssetKey =
  (typeof LIFE_PANORAMICA_SPATIAL_ASSET_KEYS)[keyof typeof LIFE_PANORAMICA_SPATIAL_ASSET_KEYS];

/**
 * Local layout anchors (metres east/north of territory geo origin).
 * Relative placement — projected to WGS84 for MapLibre / Three.
 */
const LOCAL_LAYOUT_METERS = {
  ikon: { x: -22, y: 14 },
  golfClub: { x: 26, y: -12 },
  pool: { x: -8, y: 22 },
  clubhouse: { x: 12, y: 8 },
  gardenService: { x: -30, y: -6 },
  padel: { x: 18, y: 20 },
  housingPreview: { x: 6, y: 28 },
} as const;

function geoFromLocal(local: { x: number; y: number }): LifeMapPosition {
  return projectLifePanoramicaLocalMetersToGeo(local);
}

/** Keep local anchors available for Three-only / future local spaces. */
const LOCAL_LAYOUT = {
  ikon: {
    kind: "local" as const,
    spaceId: DEMO_TERRITORY_ID,
    x: LOCAL_LAYOUT_METERS.ikon.x,
    y: LOCAL_LAYOUT_METERS.ikon.y,
    z: 0,
  },
  golfClub: {
    kind: "local" as const,
    spaceId: DEMO_TERRITORY_ID,
    x: LOCAL_LAYOUT_METERS.golfClub.x,
    y: LOCAL_LAYOUT_METERS.golfClub.y,
    z: 0,
  },
  housingPreview: {
    kind: "local" as const,
    spaceId: DEMO_TERRITORY_ID,
    x: LOCAL_LAYOUT_METERS.housingPreview.x,
    y: LOCAL_LAYOUT_METERS.housingPreview.y,
    z: 0,
  },
} as const satisfies Record<string, LifeMapPosition>;

void LOCAL_LAYOUT;

const PLACE_REF_MODULE = "community" as const;
const PLACE_ENTITY_KIND = "local_entity" as const;

export const LIFE_PANORAMICA_SPATIAL_PLACE_IDS = {
  ikon: "lp-ikon",
  golfClub: "lp-golf-club",
  pool: "lp-pool",
  clubhouse: "lp-clubhouse",
  garden: "lp-garden",
} as const;

export const LIFE_PANORAMICA_SPATIAL_RESOURCE_IDS = {
  padel: "res-padel-aldea",
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
    input.type ??
    (entity.kind === "service" ? "service" : "place");
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

/** IKON — restaurant / lounge. */
export const lifePanoramicaIkonSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.ikon,
    objectId: "lmo-place-ikon",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.ikon),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.ikon,
  });

/** Club de Golf. */
export const lifePanoramicaGolfSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.golfClub,
    objectId: "lmo-place-golf-club",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.golfClub),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.golfClub,
  });

/** Piscina comunitaria. */
export const lifePanoramicaPoolSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.pool,
    objectId: "lmo-place-pool",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.pool),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.pool,
  });

/** Café del club. */
export const lifePanoramicaClubhouseSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.clubhouse,
    objectId: "lmo-place-clubhouse",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.clubhouse),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.clubhouse,
  });

/** Jardinería — servicio. */
export const lifePanoramicaGardenServiceSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.garden,
    objectId: "lmo-service-garden",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.gardenService),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.gardenService,
    type: "service",
    availableActions: ["open", "message"],
  });

/** Pádel — resource domain. */
export const lifePanoramicaPadelSpatialProjection: LifeMapObjectProjectionInput =
  projectResourceToLifeMapInput({
    resourceId: LIFE_PANORAMICA_SPATIAL_RESOURCE_IDS.padel,
    objectId: "lmo-resource-padel",
    position: geoFromLocal(LOCAL_LAYOUT_METERS.padel),
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.padel,
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

/** Seeded Life OS objects for the living twin. */
export const lifePanoramicaSeededSpatialProjections: readonly LifeMapObjectProjectionInput[] =
  [
    lifePanoramicaIkonSpatialProjection,
    lifePanoramicaGolfSpatialProjection,
    lifePanoramicaPoolSpatialProjection,
    lifePanoramicaClubhouseSpatialProjection,
    lifePanoramicaGardenServiceSpatialProjection,
    lifePanoramicaPadelSpatialProjection,
    lifePanoramicaHousingMaquetteProjection,
  ];

export function listLifePanoramicaSpatialProjections(): LifeMapObjectProjectionInput[] {
  return [
    ...lifePanoramicaSeededSpatialProjections,
    ...lifePanoramicaHousingSpatialLayer.projections,
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
