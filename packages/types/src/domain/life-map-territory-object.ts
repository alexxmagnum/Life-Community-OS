/**
 * TerritoryObject — physical fabric of a community digital twin.
 *
 * Distinct from Location (SoT for businesses / resources / services).
 * Territory objects are gates, pools, golf, lakes, greens, clubhouse…
 * They are never pins of a domain ficha unless a Location also exists.
 *
 * Without a real WGS84 position or geometry, the object does not appear.
 * Tenant-neutral — no Panoramica catalogs here.
 */

import type { DomainId } from "./ids";
import type {
  LifeMapActionKind,
  LifeMapGeoPosition,
  LifeMapObject,
} from "./life-map";
import { projectLifeMapObject } from "./life-map-objects";

export const TERRITORY_OBJECT_TYPES = [
  "gate",
  "security",
  "parking",
  "pool",
  "sports",
  "clubhouse",
  "golf",
  "lake",
  "green",
  "building",
] as const;

export type TerritoryObjectType = (typeof TERRITORY_OBJECT_TYPES)[number];

/** Cartographic LOD — community overview → landmarks → street detail. */
export const TERRITORY_OBJECT_LOD_BANDS = [
  "territory",
  "landmark",
  "detail",
] as const;

export type TerritoryObjectLodBand =
  (typeof TERRITORY_OBJECT_LOD_BANDS)[number];

export type TerritoryObjectGeometry =
  | {
      type: "Point";
      coordinates: [number, number];
    }
  | {
      type: "Polygon";
      coordinates: [number, number][][];
    };

export type TerritoryObjectAsset = {
  /** Spatial Asset Library key — never a binary payload. */
  key: string;
  format: "glb" | "gltf";
  /** Optional path under the owned asset root. */
  path?: string;
};

export type TerritoryObjectVisibility = {
  lod: TerritoryObjectLodBand;
  /** When false, fabric only — no tap ficha. */
  interactive?: boolean;
};

export type TerritoryObject = {
  id: DomainId;
  tenantId: DomainId;
  type: TerritoryObjectType;
  /** WGS84 anchor. Required unless geometry already encodes a point/polygon. */
  location?: LifeMapGeoPosition;
  geometry?: TerritoryObjectGeometry;
  asset?: TerritoryObjectAsset;
  visibility: TerritoryObjectVisibility;
  label?: string;
  summary?: string;
  territoryId?: DomainId;
};

export type TerritoryObjectIssueCode =
  | "missing_ids"
  | "unknown_type"
  | "missing_position"
  | "invalid_coordinates"
  | "tenant_mismatch";

export type TerritoryObjectIssue = {
  code: TerritoryObjectIssueCode;
  message: string;
};

export const TERRITORY_OBJECT_LAYER_ID = "territory" as const;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isTerritoryObjectType(
  value: string,
): value is TerritoryObjectType {
  return (TERRITORY_OBJECT_TYPES as readonly string[]).includes(value);
}

/**
 * True when the object has a real geographic position (point or polygon).
 * Objects without this MUST NOT appear on Life Map.
 */
export function territoryObjectHasPosition(
  object: Pick<TerritoryObject, "location" | "geometry">,
): boolean {
  const loc = object.location;
  if (loc && isFiniteNumber(loc.lat) && isFiniteNumber(loc.lng)) {
    return isValidLatLng(loc.lat, loc.lng);
  }
  const geometry = object.geometry;
  if (!geometry) return false;
  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    return isFiniteNumber(lat) && isFiniteNumber(lng) && isValidLatLng(lat, lng);
  }
  const ring = geometry.coordinates[0];
  if (!ring || ring.length < 4) return false;
  return ring.every(
    ([lng, lat]) =>
      isFiniteNumber(lat) && isFiniteNumber(lng) && isValidLatLng(lat, lng),
  );
}

export function validateTerritoryObject(
  object: TerritoryObject,
  expectedTenantId?: DomainId,
): TerritoryObjectIssue[] {
  const issues: TerritoryObjectIssue[] = [];
  if (!object.id || !object.tenantId) {
    issues.push({
      code: "missing_ids",
      message: "id and tenantId are required.",
    });
  }
  if (!isTerritoryObjectType(object.type)) {
    issues.push({
      code: "unknown_type",
      message: `Unknown TerritoryObject type "${String(object.type)}".`,
    });
  }
  if (!territoryObjectHasPosition(object)) {
    issues.push({
      code: "missing_position",
      message: "TerritoryObject without WGS84 location/geometry cannot appear.",
    });
  } else if (object.location) {
    if (!isValidLatLng(object.location.lat, object.location.lng)) {
      issues.push({
        code: "invalid_coordinates",
        message: "location lat/lng is outside WGS84 bounds.",
      });
    }
  }
  if (expectedTenantId && object.tenantId !== expectedTenantId) {
    issues.push({
      code: "tenant_mismatch",
      message: "TerritoryObject tenantId does not match the requesting tenant.",
    });
  }
  return issues;
}

export function filterRenderableTerritoryObjects(
  objects: readonly TerritoryObject[],
  tenantId: DomainId,
): TerritoryObject[] {
  return objects.filter(
    (object) =>
      object.tenantId === tenantId &&
      validateTerritoryObject(object, tenantId).length === 0,
  );
}

function geoFromTerritoryObject(
  object: TerritoryObject,
): LifeMapGeoPosition | null {
  if (
    object.location &&
    isFiniteNumber(object.location.lat) &&
    isFiniteNumber(object.location.lng)
  ) {
    return object.location;
  }
  if (object.geometry?.type === "Point") {
    const [lng, lat] = object.geometry.coordinates;
    return { lat, lng };
  }
  if (object.geometry?.type === "Polygon") {
    const ring = object.geometry.coordinates[0];
    if (!ring || ring.length === 0) return null;
    let lat = 0;
    let lng = 0;
    for (const [x, y] of ring) {
      lng += x;
      lat += y;
    }
    return { lat: lat / ring.length, lng: lng / ring.length };
  }
  return null;
}

/**
 * Project a TerritoryObject onto the Life Map render graph.
 * Does not become Location SoT. Decorative domain type + territory layer.
 */
export function projectTerritoryObjectToLifeMapObject(
  object: TerritoryObject,
  territoryId: DomainId,
): LifeMapObject | null {
  if (validateTerritoryObject(object).length > 0) return null;
  const position = geoFromTerritoryObject(object);
  if (!position) return null;
  const interactive = object.visibility.interactive !== false;
  return projectLifeMapObject({
    tenantId: object.tenantId,
    territoryId,
    objectId: object.id,
    type: "decoration",
    layerId: TERRITORY_OBJECT_LAYER_ID,
    position,
    ...(object.asset?.key ? { asset3DKey: object.asset.key } : {}),
    state: "idle",
    availableActions: (interactive
      ? (["open"] as LifeMapActionKind[])
      : []) as LifeMapActionKind[],
    label: object.label,
  });
}

export function projectTerritoryObjectsToLifeMapObjects(
  objects: readonly TerritoryObject[],
  tenantId: DomainId,
  territoryId: DomainId,
): LifeMapObject[] {
  const projected: LifeMapObject[] = [];
  for (const object of filterRenderableTerritoryObjects(objects, tenantId)) {
    const next = projectTerritoryObjectToLifeMapObject(object, territoryId);
    if (next) projected.push(next);
  }
  return projected;
}
