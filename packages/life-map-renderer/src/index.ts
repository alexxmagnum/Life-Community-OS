/**
 * @life-community-os/life-map-renderer
 *
 * Replaceable spatial renderer boundary for Life Map.
 * Consumes LifeMapTerritory / LifeMapObject / asset key refs only.
 * No map SDK, no tenant packs, no Business Domain logic.
 */

export type {
  LifeMapRendererCamera,
  LifeMapCameraUpdate,
} from "./camera";
export { lifeMapCameraFromPose, applyLifeMapCameraUpdate } from "./camera";

export type {
  LifeMapAssetReference,
  LifeMapRenderableObject,
  LifeMapObjectRenderOp,
} from "./object";
export { toLifeMapRenderableObject } from "./object";

export type {
  LifeMapSceneLayer,
  LifeMapScene,
  LifeMapSceneBuildInput,
} from "./scene";
export { buildLifeMapScene } from "./scene";

export type {
  LifeMapRendererHost,
  LifeMapRendererCapabilities,
  LifeMapRendererInfo,
  LifeMapRenderer,
  CreateLifeMapRendererOptions,
} from "./renderer";
export { createNullLifeMapRenderer } from "./renderer";
