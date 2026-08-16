/**
 * Stylized Life OS spatial meshes — live in the world, not map pins.
 * Apple Vision / resort vocabulary — low poly, mobile-safe.
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

import type { LifeMap3DAssetVisualKind } from "../asset-visual";
import {
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "../projection";
import type { LifeMap3DSpatialObject } from "../spatial-object";
import { LIFE_MAP_3D_SPATIAL_USERDATA_KEY } from "./spatial-markers";

const KIND_COLOR: Record<LifeMap3DAssetVisualKind, string> = {
  restaurant: "#b8a090",
  cafe: "#c4b4a0",
  pool: "#7eb0c4",
  golf: "#8faf7a",
  padel: "#7a9e8a",
  clubhouse: "#c8b8a4",
  service: "#b0a088",
  house: "#d2c6b4",
  generic: "#a8c4c8",
};

function mat(color: string, opts?: { opacity?: number; metalness?: number }) {
  const opacity = opts?.opacity ?? 1;
  return new MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: opts?.metalness ?? 0.08,
    transparent: opacity < 1,
    opacity,
    emissive: color,
    emissiveIntensity: 0.04,
  });
}

function tagSpatial(root: Group | Mesh, object: LifeMap3DSpatialObject) {
  root.userData[LIFE_MAP_3D_SPATIAL_USERDATA_KEY] = object.id;
  root.userData.lifeMap3DAsset3DKey = object.asset3DKey ?? null;
  root.userData.lifeMap3DInteractionType = object.interactionType ?? "select";
  root.userData.lifeMap3DOwnsMaterial = true;
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh) {
      mesh.userData[LIFE_MAP_3D_SPATIAL_USERDATA_KEY] = object.id;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
    }
  });
}

function buildRestaurant(color: string): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(5.2, 3.4, 4.2), mat(color));
  body.position.y = 1.7;
  const roof = new Mesh(new BoxGeometry(5.8, 0.35, 4.8), mat("#d8cfc0"));
  roof.position.y = 3.55;
  const canopy = new Mesh(new BoxGeometry(3.2, 0.18, 1.4), mat("#8a6f5c", { metalness: 0.15 }));
  canopy.position.set(0, 2.4, 2.5);
  g.add(body, roof, canopy);
  return g;
}

function buildCafe(color: string): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(4.4, 2.8, 3.6), mat(color));
  body.position.y = 1.4;
  const roof = new Mesh(new CylinderGeometry(0.1, 3.2, 1.2, 4), mat("#cfc4b4"));
  roof.position.y = 3.2;
  roof.rotation.y = Math.PI / 4;
  g.add(body, roof);
  return g;
}

function buildPool(color: string): Group {
  const g = new Group();
  const deck = new Mesh(new BoxGeometry(8, 0.25, 5), mat("#d6d0c4"));
  deck.position.y = 0.12;
  const water = new Mesh(
    new BoxGeometry(6.4, 0.35, 3.6),
    mat(color, { opacity: 0.72, metalness: 0.35 }),
  );
  water.position.y = 0.28;
  g.add(deck, water);
  return g;
}

function buildGolf(color: string): Group {
  const g = new Group();
  const green = new Mesh(new CylinderGeometry(3.2, 3.2, 0.35, 16), mat(color));
  green.position.y = 0.18;
  const flag = new Mesh(new CylinderGeometry(0.06, 0.06, 3.2, 6), mat("#e8e4d8"));
  flag.position.y = 1.8;
  const banner = new Mesh(new BoxGeometry(0.9, 0.55, 0.08), mat("#c45c5c"));
  banner.position.set(0.4, 3.1, 0);
  g.add(green, flag, banner);
  return g;
}

function buildPadel(color: string): Group {
  const g = new Group();
  const court = new Mesh(new BoxGeometry(6, 0.2, 3.4), mat(color));
  court.position.y = 0.1;
  const net = new Mesh(new BoxGeometry(0.08, 1.1, 3.2), mat("#e8e4d8", { opacity: 0.7 }));
  net.position.y = 0.7;
  g.add(court, net);
  return g;
}

function buildHouse(color: string): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(4.8, 3.2, 4.2), mat(color));
  body.position.y = 1.6;
  const roof = new Mesh(new BoxGeometry(5.4, 0.4, 4.8), mat("#a89078"));
  roof.position.y = 3.4;
  g.add(body, roof);
  return g;
}

function buildService(color: string): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(2.6, 2.4, 2.6), mat(color));
  body.position.y = 1.2;
  const lamp = new Mesh(new SphereGeometry(0.35, 10, 8), mat("#f0e6d4", { metalness: 0.2 }));
  lamp.position.y = 2.7;
  g.add(body, lamp);
  return g;
}

function buildGeneric(color: string): Group {
  const g = new Group();
  const body = new Mesh(new CylinderGeometry(1.4, 1.6, 3.6, 10), mat(color));
  body.position.y = 1.8;
  g.add(body);
  return g;
}

export function createLifeOsSpatialMesh(
  object: LifeMap3DSpatialObject,
  origin: LifeMap3DProjectionOrigin,
  visualKind: LifeMap3DAssetVisualKind,
  _sharedMaterial?: Material,
): Group {
  const color = KIND_COLOR[visualKind] ?? KIND_COLOR.generic;
  let root: Group;
  switch (visualKind) {
    case "restaurant":
      root = buildRestaurant(color);
      break;
    case "cafe":
    case "clubhouse":
      root = buildCafe(color);
      break;
    case "pool":
      root = buildPool(color);
      break;
    case "golf":
      root = buildGolf(color);
      break;
    case "padel":
      root = buildPadel(color);
      break;
    case "house":
      root = buildHouse(color);
      break;
    case "service":
      root = buildService(color);
      break;
    default:
      root = buildGeneric(color);
  }

  const { x, z } = lngLatToLocalMeters(
    object.position.lng,
    object.position.lat,
    origin,
  );
  root.name = `life-os:${object.id}`;
  root.position.set(x, 0, z);
  tagSpatial(root, object);
  return root;
}
