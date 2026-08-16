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

export type { LifeMapGeoOrigin, LifeMapLocalMeters } from "./local-to-geo";
export {
  localMetersToGeo,
  resolveLifeMapPositionToGeo,
} from "./local-to-geo";

export type {
  LifeMapSpatialCategory,
  LifeMapSpatialInteractionType,
  LifeMapSpatialBridgeObject,
} from "./life-os-objects";
export {
  lifeMapSpatialCategoryForType,
  lifeMapInteractionTypeForActions,
  bridgeLifeMapObjectToSpatial,
  bridgeLifeMapObjectsToSpatial,
} from "./life-os-objects";

export type { LifeMapContextPanelModel } from "./interaction";
export {
  buildLifeMapContextPanel,
  buildLifeMapInteraction,
} from "./interaction";

export type {
  LifeMapPerformanceBudget,
  LifeMapDataVersionHint,
} from "./performance";
export {
  LIFE_MAP_PERFORMANCE_BUDGETS,
  lifeMapCacheKey,
  capLifeMapCollection,
} from "./performance";
