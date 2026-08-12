/**
 * Life Map renderer — scene abstraction.
 *
 * A scene is the replaceable unit an engine mounts: territory frame +
 * visible layers + renderable objects. No Business Domain imports.
 */

import type {
  LifeMapLayer,
  LifeMapObject,
  LifeMapTerritory,
} from "@life-community-os/types";

import type { LifeMapRendererCamera } from "./camera";
import { lifeMapCameraFromPose } from "./camera";
import type { LifeMapRenderableObject } from "./object";
import { toLifeMapRenderableObject } from "./object";

/** Layer visibility snapshot for the engine (ids only + flags). */
export type LifeMapSceneLayer = {
  id: string;
  visible: boolean;
  label?: string;
  order?: number;
};

/**
 * Complete scene descriptor passed to `LifeMapRenderer.setScene`.
 * Engines may ignore fields they do not support yet.
 */
export type LifeMapScene = {
  tenantId: string;
  territoryId: string;
  camera: LifeMapRendererCamera;
  layers: readonly LifeMapSceneLayer[];
  objects: readonly LifeMapRenderableObject[];
};

export type LifeMapSceneBuildInput = {
  territory: LifeMapTerritory;
  objects?: readonly LifeMapObject[];
  /**
   * Optional asset path resolver — typically from `@life-community-os/assets`.
   * Renderer package stays free of Asset Registry / tenant coupling.
   */
  resolveAssetPath?: (assetKey: string) => string | undefined;
};

function toSceneLayer(layer: LifeMapLayer): LifeMapSceneLayer {
  return {
    id: String(layer.id),
    visible: layer.visible,
    label: layer.label,
    order: layer.order,
  };
}

/**
 * Build a renderer scene from platform territory + projected objects.
 */
export function buildLifeMapScene(input: LifeMapSceneBuildInput): LifeMapScene {
  const { territory, objects = [], resolveAssetPath } = input;
  const frame = territory.bounds
    ? {
        north: territory.bounds.north,
        south: territory.bounds.south,
        east: territory.bounds.east,
        west: territory.bounds.west,
      }
    : undefined;

  return {
    tenantId: territory.tenantId,
    territoryId: territory.territoryId,
    camera: lifeMapCameraFromPose(territory.defaultCamera, frame),
    layers: territory.layers.map(toSceneLayer),
    objects: objects.map((object) => {
      const asset = object.asset3DKey
        ? {
            assetKey: object.asset3DKey,
            path: resolveAssetPath?.(object.asset3DKey),
          }
        : undefined;
      return toLifeMapRenderableObject(object, asset);
    }),
  };
}
