/**
 * Life Map renderer — camera abstraction.
 *
 * Engine-agnostic pose for a future spatial viewport.
 * Does not depend on any map / 3D vendor.
 */

import type { LifeMapCameraPose, LifeMapPosition } from "@life-community-os/types";

/**
 * Runtime camera state for the renderer.
 * Starts from `LifeMapTerritory.defaultCamera` and may be driven by UX later.
 */
export type LifeMapRendererCamera = {
  pose: LifeMapCameraPose;
  /**
   * Optional framing hint copied from territory bounds when present.
   * Opaque to the product shell — engines interpret as they need.
   */
  frame?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
};

export type LifeMapCameraUpdate = Partial<{
  target: LifeMapPosition;
  distance: number;
  headingDegrees: number;
  pitchDegrees: number;
  frame: LifeMapRendererCamera["frame"];
}>;

export function lifeMapCameraFromPose(
  pose: LifeMapCameraPose,
  frame?: LifeMapRendererCamera["frame"],
): LifeMapRendererCamera {
  return {
    pose: { ...pose },
    ...(frame ? { frame } : {}),
  };
}

export function applyLifeMapCameraUpdate(
  current: LifeMapRendererCamera,
  update: LifeMapCameraUpdate,
): LifeMapRendererCamera {
  return {
    pose: {
      target: update.target ?? current.pose.target,
      distance: update.distance ?? current.pose.distance,
      headingDegrees: update.headingDegrees ?? current.pose.headingDegrees,
      pitchDegrees: update.pitchDegrees ?? current.pose.pitchDegrees,
    },
    frame: update.frame !== undefined ? update.frame : current.frame,
  };
}
