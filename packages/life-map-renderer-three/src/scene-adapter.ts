/**
 * Scene adapter — sync LifeMapScene objects into a Three.js scene graph.
 * Placeholder meshes only — no GLB / asset loading.
 */

import type {
  LifeMapRenderableObject,
  LifeMapScene,
  LifeMapSceneLayer,
} from "@life-community-os/life-map-renderer";
import type { LifeMapObjectType } from "@life-community-os/types";
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  type Material,
} from "three";

import { THREE_LIFE_MAP_PALETTE as P } from "./palette";
import { lifeMapPositionToThree } from "./position";

const OBJECT_ROOT_NAME = "life-map.objects";
const GROUND_NAME = "life-map.ground";

function materialForState(
  state: LifeMapRenderableObject["state"],
): MeshStandardMaterial {
  const base =
    state === "active"
      ? P.objectActive
      : state === "unavailable" || state === "hidden"
        ? P.objectMuted
        : P.objectIdle;

  return new MeshStandardMaterial({
    color: base,
    roughness: 0.72,
    metalness: 0.08,
    transparent: state === "hidden",
    opacity: state === "hidden" ? 0.22 : 0.96,
  });
}

function geometryForType(type: LifeMapObjectType) {
  switch (type) {
    case "housing":
      return new BoxGeometry(2.2, 1.4, 2.2);
    case "place":
      return new CylinderGeometry(1.05, 1.2, 1.1, 24);
    case "service":
      return new BoxGeometry(1.6, 1.6, 1.6);
    case "experience":
      return new SphereGeometry(1.05, 28, 20);
    case "resource":
      return new BoxGeometry(2.4, 0.55, 2.4);
    case "official":
      return new CylinderGeometry(0.85, 0.85, 2.2, 20);
    default:
      return new BoxGeometry(1.4, 1.4, 1.4);
  }
}

function yOffsetForType(type: LifeMapObjectType): number {
  switch (type) {
    case "housing":
      return 0.7;
    case "place":
      return 0.55;
    case "official":
      return 1.1;
    case "resource":
      return 0.28;
    case "experience":
      return 1.05;
    default:
      return 0.7;
  }
}

export function ensureTerritoryGround(scene: Scene): Mesh {
  const existing = scene.getObjectByName(GROUND_NAME);
  if (existing && existing instanceof Mesh) return existing;

  const ground = new Mesh(
    new PlaneGeometry(220, 220, 1, 1),
    new MeshStandardMaterial({
      color: P.ground,
      roughness: 0.92,
      metalness: 0.04,
    }),
  );
  ground.name = GROUND_NAME;
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const rim = new Mesh(
    new PlaneGeometry(228, 228, 1, 1),
    new MeshStandardMaterial({
      color: P.groundRim,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.55,
    }),
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = -0.02;
  scene.add(rim);

  return ground;
}

function ensureObjectRoot(scene: Scene): Group {
  const existing = scene.getObjectByName(OBJECT_ROOT_NAME);
  if (existing && existing instanceof Group) return existing;
  const group = new Group();
  group.name = OBJECT_ROOT_NAME;
  scene.add(group);
  return group;
}

function isLayerVisible(
  layers: readonly LifeMapSceneLayer[],
  layerId: string,
): boolean {
  const layer = layers.find((l) => l.id === layerId);
  return layer ? layer.visible : true;
}

function disposeMesh(mesh: Mesh): void {
  mesh.geometry.dispose();
  const mat = mesh.material;
  if (Array.isArray(mat)) mat.forEach((m: Material) => m.dispose());
  else (mat as Material).dispose();
}

/**
 * Rebuild placeholder object meshes from the current LifeMapScene.
 */
export function syncThreeSceneFromLifeMap(
  threeScene: Scene,
  lifeMapScene: LifeMapScene,
): void {
  ensureTerritoryGround(threeScene);
  const root = ensureObjectRoot(threeScene);

  while (root.children.length > 0) {
    const child = root.children[0];
    if (child) {
      root.remove(child);
      if (child instanceof Mesh) disposeMesh(child);
      else child.clear();
    }
  }

  for (const object of lifeMapScene.objects) {
    if (!isLayerVisible(lifeMapScene.layers, String(object.layerId))) continue;
    if (object.state === "hidden") continue;

    const mesh = new Mesh(
      geometryForType(object.type),
      materialForState(object.state),
    );
    mesh.name = object.objectId;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const pos = lifeMapPositionToThree(object.position);
    mesh.position.set(pos.x, pos.y + yOffsetForType(object.type), pos.z);
    root.add(mesh);
  }
}

export function clearThreeLifeMapObjects(threeScene: Scene): void {
  const root = threeScene.getObjectByName(OBJECT_ROOT_NAME);
  if (!root || !(root instanceof Group)) return;
  while (root.children.length > 0) {
    const child = root.children[0];
    if (child) {
      root.remove(child);
      if (child instanceof Mesh) disposeMesh(child);
    }
  }
}
