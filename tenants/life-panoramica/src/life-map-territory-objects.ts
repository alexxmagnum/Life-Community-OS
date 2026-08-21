/**
 * Life Panoramica — Territory Digital Twin v1 (physical fabric).
 *
 * Territory Objects = elementos físicos del territorio (no Location SoT).
 * Location Objects = negocios / servicios / lugares con ficha (fuera de aquí).
 *
 * Coordinates: local metres → WGS84 via territory geo origin (OSM/Catastro).
 * No floating absolute GPS invention — same projection as MapLibre basemap.
 */

import type {
  LifeMapObject,
  TerritoryObject,
  TerritoryObjectType,
} from "@life-community-os/types";
import {
  projectTerritoryObjectToLifeMapObject,
  TERRITORY_OBJECT_LAYER_ID,
} from "@life-community-os/types";

import { DEMO_TENANT_ID, DEMO_TERRITORY_ID } from "./demo-ids";
import { projectLifePanoramicaLocalMetersToGeo } from "./life-map";

/** Spatial Asset Registry ids (platform GLB library). */
const TERRITORY_ASSET_KEYS = {
  gate: "security-gate-v1",
  security: "security-booth-v1",
  barrier: "security-barrier-v1",
  parking: "parking-area-v1",
  clubhouse: "clubhouse-v1",
  pool: "pool-area-v1",
  padel: "padel-court-v1",
  golf: "golf-area-v1",
  lake: "lake-area-v1",
} as const;

/** Product layer for physical territory fabric (not Location pins). */
export const LIFE_PANORAMICA_TERRITORY_LAYER_ID = TERRITORY_OBJECT_LAYER_ID;

/**
 * Cartographic importance for MapLibre LOD.
 * territory — visible from overview
 * landmark — mid zoom community landmarks
 * detail — close-in accents only
 */
export type TerritoryLodBand = "territory" | "landmark" | "detail";

export type TerritoryKind =
  | "main_access"
  | "security_booth"
  | "barrier"
  | "main_parking"
  | "clubhouse"
  | "community_pool"
  | "sports_courts"
  | "golf"
  | "lake"
  | "green"
  | "residential"
  | "pool";

export type TerritoryAmenityKind =
  | "golf"
  | "lake"
  | "green"
  | "parking"
  | "pool"
  | "sports";

type LocalMeters = { x: number; y: number };

function geoFromLocal(local: LocalMeters): { lat: number; lng: number } {
  return projectLifePanoramicaLocalMetersToGeo(local);
}

/**
 * Physical layout anchors (metres east/north of territory geo origin).
 * Anchored to the same social core as the living twin (IKON / club / pool).
 */
const TERRITORY_LAYOUT = {
  mainAccess: {
    x: -48,
    y: -58,
    kind: "main_access" as const,
    label: "Acceso principal",
    lod: "territory" as const,
    summary: "Entrada principal a Panorámica Golf.",
    asset3DKey: TERRITORY_ASSET_KEYS.gate,
  },
  securityBooth: {
    x: -44,
    y: -52,
    kind: "security_booth" as const,
    label: "Garita de seguridad",
    lod: "landmark" as const,
    summary: "Control de acceso y vigilancia de la urbanización.",
    asset3DKey: TERRITORY_ASSET_KEYS.security,
  },
  barrier: {
    x: -40,
    y: -54,
    kind: "barrier" as const,
    label: "Barrera",
    lod: "detail" as const,
    summary: "Barrera de acceso al recinto.",
    asset3DKey: TERRITORY_ASSET_KEYS.barrier,
  },
  mainParking: {
    x: -30,
    y: -38,
    kind: "main_parking" as const,
    label: "Parking principal",
    lod: "landmark" as const,
    summary: "Aparcamiento principal junto al acceso.",
    asset3DKey: TERRITORY_ASSET_KEYS.parking,
  },
  clubhouse: {
    x: 12,
    y: 8,
    kind: "clubhouse" as const,
    label: "Clubhouse",
    lod: "territory" as const,
    summary: "Club social y punto de encuentro de la comunidad.",
    asset3DKey: TERRITORY_ASSET_KEYS.clubhouse,
  },
  communityPool: {
    x: -8,
    y: 22,
    kind: "community_pool" as const,
    label: "Piscina comunitaria",
    lod: "landmark" as const,
    summary: "Piscina comunitaria al aire libre.",
    asset3DKey: TERRITORY_ASSET_KEYS.pool,
  },
  sportsCourts: {
    x: 18,
    y: 20,
    kind: "sports_courts" as const,
    label: "Pistas deportivas",
    lod: "landmark" as const,
    summary: "Pistas de pádel y zona deportiva.",
    asset3DKey: TERRITORY_ASSET_KEYS.padel,
  },
  golf: {
    x: 42,
    y: -22,
    kind: "golf" as const,
    label: "Campo de golf",
    lod: "territory" as const,
    summary: "Recorrido de golf Panorámica.",
    asset3DKey: TERRITORY_ASSET_KEYS.golf,
  },
  lakeNorth: {
    x: 52,
    y: 6,
    kind: "lake" as const,
    label: "Lago norte",
    lod: "landmark" as const,
    summary: "Espejo de agua del territorio.",
    asset3DKey: TERRITORY_ASSET_KEYS.lake,
  },
  lakeSouth: {
    x: 58,
    y: -18,
    kind: "lake" as const,
    label: "Lago sur",
    lod: "detail" as const,
    summary: "Lago junto al recorrido de golf.",
  },
  greenWest: {
    x: -36,
    y: 12,
    kind: "green" as const,
    label: "Zona verde",
    lod: "territory" as const,
    summary: "Jardines y zonas verdes de la comunidad.",
  },
  greenEast: {
    x: 28,
    y: 32,
    kind: "green" as const,
    label: "Zona verde este",
    lod: "detail" as const,
    summary: "Área ajardinada residencial.",
  },
  residentialNorth: {
    x: 4,
    y: 42,
    kind: "residential" as const,
    label: "Viviendas",
    lod: "landmark" as const,
    summary: "Edificación residencial de Panorámica.",
  },
  residentialWest: {
    x: -22,
    y: 36,
    kind: "residential" as const,
    label: "Edificios oeste",
    lod: "detail" as const,
    summary: "Bloques residenciales al oeste del núcleo social.",
  },
  residentialEast: {
    x: 26,
    y: 38,
    kind: "residential" as const,
    label: "Edificios este",
    lod: "detail" as const,
    summary: "Bloques residenciales al este del club.",
  },
  poolVisible: {
    x: -4,
    y: 28,
    kind: "pool" as const,
    label: "Piscina",
    lod: "detail" as const,
    summary: "Piscina visible en el núcleo social.",
    asset3DKey: TERRITORY_ASSET_KEYS.pool,
  },
} as const;

type TerritoryLayoutKey = keyof typeof TERRITORY_LAYOUT;

function territoryTypeForKind(kind: TerritoryKind): TerritoryObjectType {
  switch (kind) {
    case "main_access":
    case "barrier":
      return "gate";
    case "security_booth":
      return "security";
    case "main_parking":
      return "parking";
    case "clubhouse":
      return "clubhouse";
    case "community_pool":
    case "pool":
      return "pool";
    case "sports_courts":
      return "sports";
    case "golf":
      return "golf";
    case "lake":
      return "lake";
    case "green":
      return "green";
    case "residential":
      return "building";
    default:
      return "building";
  }
}

/** Contract-backed territory twin (tenant-scoped). */
export function listLifePanoramicaTerritoryTwin(): TerritoryObject[] {
  return (Object.keys(TERRITORY_LAYOUT) as TerritoryLayoutKey[]).map((key) => {
    const meta = TERRITORY_LAYOUT[key];
    const geo = geoFromLocal(meta);
    const assetKey =
      "asset3DKey" in meta ? (meta.asset3DKey as string) : undefined;
    const object: TerritoryObject = {
      id: `lmo-terr-${key}`,
      tenantId: DEMO_TENANT_ID,
      territoryId: DEMO_TERRITORY_ID,
      type: territoryTypeForKind(meta.kind),
      location: { lat: geo.lat, lng: geo.lng },
      visibility: { lod: meta.lod, interactive: true },
      label: meta.label,
      summary: meta.summary,
      ...(assetKey
        ? { asset: { key: assetKey, format: "glb" as const } }
        : {}),
    };
    return object;
  });
}

/** Territory object projections for the MapLibre scene (no Location refs). */
export function listLifePanoramicaTerritoryObjects(): LifeMapObject[] {
  return listLifePanoramicaTerritoryTwin()
    .map((object) =>
      projectTerritoryObjectToLifeMapObject(object, DEMO_TERRITORY_ID),
    )
    .filter((object): object is LifeMapObject => object != null);
}

/** Metadata for renderer / context (keyed by objectId). */
export function getLifePanoramicaTerritoryMeta(objectId: string): {
  kind: TerritoryKind;
  lod: TerritoryLodBand;
  summary: string;
} | null {
  const key = objectId.replace(/^lmo-terr-/, "") as TerritoryLayoutKey;
  const meta = TERRITORY_LAYOUT[key];
  if (!meta) return null;
  return { kind: meta.kind, lod: meta.lod, summary: meta.summary };
}

function ellipseRing(
  center: LocalMeters,
  radiusEastM: number,
  radiusNorthM: number,
  steps = 24,
): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const local = {
      x: center.x + Math.cos(t) * radiusEastM,
      y: center.y + Math.sin(t) * radiusNorthM,
    };
    const geo = projectLifePanoramicaLocalMetersToGeo(local);
    ring.push([geo.lng, geo.lat]);
  }
  return ring;
}

function rectRing(
  center: LocalMeters,
  halfEastM: number,
  halfNorthM: number,
): [number, number][] {
  const corners = [
    { x: center.x - halfEastM, y: center.y - halfNorthM },
    { x: center.x + halfEastM, y: center.y - halfNorthM },
    { x: center.x + halfEastM, y: center.y + halfNorthM },
    { x: center.x - halfEastM, y: center.y + halfNorthM },
    { x: center.x - halfEastM, y: center.y - halfNorthM },
  ];
  return corners.map((c) => {
    const geo = projectLifePanoramicaLocalMetersToGeo(c);
    return [geo.lng, geo.lat] as [number, number];
  });
}

type AmenitySpec = {
  id: string;
  kind: TerritoryAmenityKind;
  label: string;
  lod: TerritoryLodBand;
  ring: [number, number][];
};

const AMENITY_SPECS: readonly AmenitySpec[] = [
  {
    id: "amenity-golf",
    kind: "golf",
    label: "Campo de golf",
    lod: "territory",
    ring: ellipseRing(TERRITORY_LAYOUT.golf, 55, 38, 32),
  },
  {
    id: "amenity-green-west",
    kind: "green",
    label: "Zona verde",
    lod: "territory",
    ring: ellipseRing(TERRITORY_LAYOUT.greenWest, 28, 22, 20),
  },
  {
    id: "amenity-green-east",
    kind: "green",
    label: "Zona verde este",
    lod: "landmark",
    ring: ellipseRing(TERRITORY_LAYOUT.greenEast, 18, 16, 18),
  },
  {
    id: "amenity-lake-north",
    kind: "lake",
    label: "Lago norte",
    lod: "landmark",
    ring: ellipseRing(TERRITORY_LAYOUT.lakeNorth, 14, 10, 20),
  },
  {
    id: "amenity-lake-south",
    kind: "lake",
    label: "Lago sur",
    lod: "detail",
    ring: ellipseRing(TERRITORY_LAYOUT.lakeSouth, 12, 9, 18),
  },
  {
    id: "amenity-parking",
    kind: "parking",
    label: "Parking principal",
    lod: "landmark",
    ring: rectRing(TERRITORY_LAYOUT.mainParking, 16, 10),
  },
  {
    id: "amenity-pool",
    kind: "pool",
    label: "Piscina comunitaria",
    lod: "landmark",
    ring: rectRing(TERRITORY_LAYOUT.communityPool, 8, 5),
  },
  {
    id: "amenity-sports",
    kind: "sports",
    label: "Pistas deportivas",
    lod: "landmark",
    ring: rectRing(TERRITORY_LAYOUT.sportsCourts, 12, 8),
  },
];

export function buildLifePanoramicaTerritoryAmenityGeoJson(): {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: Record<string, string>;
    geometry: { type: "Polygon"; coordinates: [number, number][][] };
  }>;
} {
  return {
    type: "FeatureCollection",
    features: AMENITY_SPECS.map((spec) => ({
      type: "Feature" as const,
      id: spec.id,
      properties: {
        amenityId: spec.id,
        kind: spec.kind,
        label: spec.label,
        lod: spec.lod,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [spec.ring],
      },
    })),
  };
}

/** Point features for territory markers (renderer-friendly). */
export function buildLifePanoramicaTerritoryPointGeoJson(): {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: Record<string, string>;
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
} {
  return {
    type: "FeatureCollection",
    features: Object.entries(TERRITORY_LAYOUT).map(([key, meta]) => {
      const geo = projectLifePanoramicaLocalMetersToGeo(meta);
      return {
        type: "Feature" as const,
        id: `lmo-terr-${key}`,
        properties: {
          objectId: `lmo-terr-${key}`,
          kind: meta.kind,
          label: meta.label,
          lod: meta.lod,
          summary: meta.summary,
          assetKey: "asset3DKey" in meta ? String(meta.asset3DKey) : "",
        },
        geometry: {
          type: "Point" as const,
          coordinates: [geo.lng, geo.lat] as [number, number],
        },
      };
    }),
  };
}
