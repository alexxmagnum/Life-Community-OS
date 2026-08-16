/**
 * Spatial object markers — placeholder volumes until real assets load.
 * Instancing-ready architecture for multi-tenant scale.
 */

import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Material,
} from "three";

import {
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "../projection";
import type { LifeMap3DSpatialObject } from "../spatial-object";

export const LIFE_MAP_3D_SPATIAL_USERDATA_KEY = "lifeMap3DSpatialObjectId";

export function createSpatialMarkerMaterial(
  color = "#a8c4c8",
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.12,
    emissive: color,
    emissiveIntensity: 0.08,
  });
}

/**
 * Simple vertical marker — asset3DKey reserved for future glTF swap.
 */
export function createSpatialObjectMarker(
  object: LifeMap3DSpatialObject,
  origin: LifeMap3DProjectionOrigin,
  material: Material,
): Mesh {
  const { x, z } = lngLatToLocalMeters(
    object.position.lng,
    object.position.lat,
    origin,
  );
  const geometry = new CylinderGeometry(1.2, 1.4, 4.5, 10);
  const mesh = new Mesh(geometry, material);
  mesh.name = `spatial:${object.id}`;
  mesh.position.set(x, 2.25, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData[LIFE_MAP_3D_SPATIAL_USERDATA_KEY] = object.id;
  mesh.userData.lifeMap3DAsset3DKey = object.asset3DKey ?? null;
  mesh.userData.lifeMap3DInteractionType =
    object.interactionType ?? "select";
  return mesh;
}

export function createSpatialObjectsGroup(): Group {
  const group = new Group();
  group.name = "life-map-3d-spatial-objects";
  return group;
}
