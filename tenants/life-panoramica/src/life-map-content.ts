/**
 * Life Panoramica — Life Map spatial content foundation (tenant pack only).
 *
 * Projects existing domain entities into LifeMapObject shapes.
 * Life Map is never the source of truth — refs point at Local Entity / Housing.
 *
 * No map SDK, UI, renderer, binary assets, fake listings, or WGS84 inventado.
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
import { getLifePanoramicaLifeMapTerritory } from "./life-map";
import { getLocalEntityById } from "./local-places";

/** Reserved spatial AssetKeys — not registered until catalog ships. */
export const LIFE_PANORAMICA_SPATIAL_ASSET_KEYS = {
  ikon: "places.ikon.spatial_object",
  golfClub: "places.golf-club.spatial_object",
} as const;

export type LifePanoramicaSpatialAssetKey =
  (typeof LIFE_PANORAMICA_SPATIAL_ASSET_KEYS)[keyof typeof LIFE_PANORAMICA_SPATIAL_ASSET_KEYS];

/**
 * Local layout anchors inside the prepared territory space
 * (`life-map.ts` camera / spaceId). Relative placement only — not survey GPS.
 */
const LOCAL_LAYOUT = {
  ikon: {
    kind: "local" as const,
    spaceId: DEMO_TERRITORY_ID,
    x: -48,
    y: 22,
    z: 0,
  },
  golfClub: {
    kind: "local" as const,
    spaceId: DEMO_TERRITORY_ID,
    x: 56,
    y: -18,
    z: 0,
  },
} as const satisfies Record<string, LifeMapPosition>;

const PLACE_REF_MODULE = "community" as const;
const PLACE_ENTITY_KIND = "local_entity" as const;

/** Existing Local Entity ids projected onto the map. */
export const LIFE_PANORAMICA_SPATIAL_PLACE_IDS = {
  ikon: "lp-ikon",
  golfClub: "lp-golf-club",
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
}): LifeMapObjectProjectionInput {
  const entity = requireLocalEntity(input.entityId);
  return {
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    objectId: input.objectId,
    type: "place",
    layerId: "places",
    ref: {
      moduleId: PLACE_REF_MODULE,
      entityId: entity.id,
      entityKind: PLACE_ENTITY_KIND,
    },
    position: input.position,
    asset3DKey: input.asset3DKey,
    state: "idle",
    availableActions: ["open", "navigate"],
    label: entity.name,
    communityAreaId:
      input.communityAreaId ?? entity.communityAreaId ?? DEMO_AREA_ALDEA_GOLF,
  };
}

/** IKON — existing Local Entity `lp-ikon`. */
export const lifePanoramicaIkonSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.ikon,
    objectId: "lmo-place-ikon",
    position: LOCAL_LAYOUT.ikon,
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.ikon,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
  });

/**
 * Club de Golf — existing Local Entity `lp-golf-club` (place).
 * Not a Resource row; golf course booking remains in Resources when/if added.
 */
export const lifePanoramicaGolfSpatialProjection: LifeMapObjectProjectionInput =
  projectLocalEntityToLifeMapInput({
    entityId: LIFE_PANORAMICA_SPATIAL_PLACE_IDS.golfClub,
    objectId: "lmo-place-golf-club",
    position: LOCAL_LAYOUT.golfClub,
    asset3DKey: LIFE_PANORAMICA_SPATIAL_ASSET_KEYS.golfClub,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
  });

/**
 * Housing spatial layer — projection adapter only.
 * No fake listings. Empty until Housing domain supplies real ids + poses.
 */
export type LifePanoramicaHousingSpatialLayer = {
  layerId: "housing";
  /** Empty by design — Housing content index has no seeded listings. */
  projections: readonly LifeMapObjectProjectionInput[];
};

export const lifePanoramicaHousingSpatialLayer: LifePanoramicaHousingSpatialLayer =
  {
    layerId: "housing",
    projections: [],
  };

/**
 * Build a Housing Life Map projection from an existing listing.
 * Caller must supply position (survey / local layout) — never invented here.
 */
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

/** Seeded place projections for this territory (IKON + Golf). */
export const lifePanoramicaSeededSpatialProjections: readonly LifeMapObjectProjectionInput[] =
  [
    lifePanoramicaIkonSpatialProjection,
    lifePanoramicaGolfSpatialProjection,
  ];

/** All current tenant spatial projections (seeded places + housing layer). */
export function listLifePanoramicaSpatialProjections(): LifeMapObjectProjectionInput[] {
  return [
    ...lifePanoramicaSeededSpatialProjections,
    ...lifePanoramicaHousingSpatialLayer.projections,
  ];
}

/** Materialize projections as LifeMapObject records (still not SoT). */
export function listLifePanoramicaSpatialObjects(): LifeMapObject[] {
  return listLifePanoramicaSpatialProjections().map((input) =>
    projectLifeMapObject(input),
  );
}

/**
 * Load seeded projections into a territory-scoped registry.
 * Fails closed while `lifeMap` / moduleEnabled is false.
 */
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
