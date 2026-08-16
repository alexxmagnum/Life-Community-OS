/**
 * Spatial object markers — category volumes (not classic pins).
 * asset3DKey reserved for future glTF / CDN swap.
 */

import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Material,
} from "three";

import {
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "../projection";
import type {
  LifeMap3DSpatialCategory,
  LifeMap3DSpatialObject,
} from "../spatial-object";

export const LIFE_MAP_3D_SPATIAL_USERDATA_KEY = "lifeMap3DSpatialObjectId";

const CATEGORY_COLOR: Record<LifeMap3DSpatialCategory, string> = {
  places: "#a8c4c8",
  services: "#c4b08a",
  community: "#b8a8c8",
  sports: "#8ab89a",
  housing: "#d0c4b0",
  other: "#b0b0a8",
};

export function createSpatialMarkerMaterial(
  color = "#a8c4c8",
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.12,
    emissive: color,
    emissiveIntensity: 0.1,
  });
}

function geometryForCategory(category: LifeMap3DSpatialCategory | undefined) {
  switch (category) {
    case "sports":
      return new CylinderGeometry(1.8, 1.8, 1.2, 12);
    case "services":
      return new BoxGeometry(2.4, 3.2, 2.4);
    case "community":
      return new SphereGeometry(1.6, 12, 10);
    case "housing":
      return new BoxGeometry(2.8, 2.2, 2.8);
    case "places":
    default:
      return new CylinderGeometry(1.3, 1.5, 4.2, 10);
  }
}

/**
 * Soft spatial mass — not a map pin. asset3DKey reserved for future glTF.
 */
export function createSpatialObjectMarker(
  object: LifeMap3DSpatialObject,
  origin: LifeMap3DProjectionOrigin,
  material?: Material,
): Mesh {
  const { x, z } = lngLatToLocalMeters(
    object.position.lng,
    object.position.lat,
    origin,
  );
  const category = object.category ?? "other";
  const geometry = geometryForCategory(category);
  const mat =
    material ??
    createSpatialMarkerMaterial(CATEGORY_COLOR[category] ?? CATEGORY_COLOR.other);
  const mesh = new Mesh(geometry, mat);
  mesh.name = `spatial:${object.id}`;
  const height =
    category === "sports" ? 0.6 : category === "community" ? 1.6 : 2.1;
  mesh.position.set(x, height, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData[LIFE_MAP_3D_SPATIAL_USERDATA_KEY] = object.id;
  mesh.userData.lifeMap3DAsset3DKey = object.asset3DKey ?? null;
  mesh.userData.lifeMap3DInteractionType =
    object.interactionType ?? "select";
  mesh.userData.lifeMap3DCategory = category;
  mesh.userData.lifeMap3DOwnsMaterial = !material;
  return mesh;
}

export function createSpatialObjectsGroup(): Group {
  const group = new Group();
  group.name = "life-map-3d-spatial-objects";
  return group;
}
