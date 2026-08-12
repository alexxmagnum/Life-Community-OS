/**
 * Camera adapter — LifeMapRendererCamera → Three.js perspective pose.
 */

import type { LifeMapRendererCamera } from "@life-community-os/life-map-renderer";
import type { PerspectiveCamera, Vector3 } from "three";
import { Vector3 as ThreeVector3 } from "three";

import { lifeMapPositionToThree } from "./position";

const DEG = Math.PI / 180;

export type ThreeCameraPose = {
  position: Vector3;
  lookAt: Vector3;
};

/**
 * Orbit-style placement from heading / pitch / distance around a target.
 */
export function lifeMapCameraToThreePose(
  camera: LifeMapRendererCamera,
): ThreeCameraPose {
  const lookAt = lifeMapPositionToThree(camera.pose.target);
  const distance = camera.pose.distance ?? 48;
  const heading = (camera.pose.headingDegrees ?? 32) * DEG;
  const pitch = (camera.pose.pitchDegrees ?? 48) * DEG;

  const horizontal = Math.cos(pitch) * distance;
  const y = Math.sin(pitch) * distance;
  const x = lookAt.x + Math.sin(heading) * horizontal;
  const z = lookAt.z + Math.cos(heading) * horizontal;

  return {
    position: new ThreeVector3(x, Math.max(y, 4), z),
    lookAt,
  };
}

export function applyLifeMapCameraToThree(
  camera: PerspectiveCamera,
  lifeMapCamera: LifeMapRendererCamera,
): void {
  const pose = lifeMapCameraToThreePose(lifeMapCamera);
  camera.position.copy(pose.position);
  camera.lookAt(pose.lookAt);
  camera.updateProjectionMatrix();
}
