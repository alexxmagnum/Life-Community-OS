/**
 * @life-community-os/life-map-renderer-three
 *
 * Experimental Three.js / React Three Fiber Life Map renderer.
 * Implements LifeMapRenderer. Not wired to /map. No map SDK. No GLB.
 */

export { THREE_LIFE_MAP_PALETTE } from "./palette";

export { lifeMapPositionToThree } from "./position";

export {
  lifeMapCameraToThreePose,
  applyLifeMapCameraToThree,
  type ThreeCameraPose,
} from "./camera-adapter";

export {
  ensureTerritoryGround,
  syncThreeSceneFromLifeMap,
  clearThreeLifeMapObjects,
} from "./scene-adapter";

export {
  createThreeLifeMapRenderer,
  ThreeLifeMapRenderer,
} from "./create-three-renderer";

export {
  ThreeLifeMapCanvas,
  type ThreeLifeMapCanvasProps,
  type LifeMapObjectPointerEvent,
} from "./ThreeLifeMapCanvas";
