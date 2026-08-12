/**
 * Map Life Map positions into Three.js world space (Y-up).
 * Local anchors: (x, y) → (x, elev, -y). Geo: provisional planar projection.
 */

import type { LifeMapGeoPosition, LifeMapPosition } from "@life-community-os/types";
import type { Vector3 } from "three";
import { Vector3 as ThreeVector3 } from "three";

const GEO_SCALE = 8000;

export function lifeMapPositionToThree(
  position: LifeMapPosition,
  target: Vector3 = new ThreeVector3(),
): Vector3 {
  if ("kind" in position && position.kind === "local") {
    return target.set(position.x, position.z ?? 0, -position.y);
  }
  // Provisional planar projection — not a cartographic engine.
  const geo = position as LifeMapGeoPosition;
  return target.set(
    geo.lng * GEO_SCALE,
    geo.altitudeMeters ?? 0,
    -geo.lat * GEO_SCALE,
  );
}
