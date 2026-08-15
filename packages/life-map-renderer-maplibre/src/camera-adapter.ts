/**
 * Camera adapter: LifeMapRendererCamera → MapLibre view.
 *
 * Geo targets and frame bounds drive the map.
 * Local anchors are ignored until a local→geo projection exists.
 */

import type { LifeMapRendererCamera } from "@life-community-os/life-map-renderer";
import type { LifeMapPosition } from "@life-community-os/types";
import type { Map as MapLibreMap } from "maplibre-gl";

function isGeoPosition(
  position: LifeMapPosition,
): position is { lat: number; lng: number; altitudeMeters?: number } {
  return (
    typeof (position as { lat?: unknown }).lat === "number" &&
    typeof (position as { lng?: unknown }).lng === "number"
  );
}

/** Heuristic distance → zoom until a formal mapping lands. */
export function distanceToMapLibreZoom(distance: number | undefined): number {
  if (distance === undefined || !Number.isFinite(distance)) return 14;
  // Larger distance → lower zoom. Clamp to MapLibre-useful range.
  const zoom = 18 - Math.log2(Math.max(distance, 1));
  return Math.min(18, Math.max(3, zoom));
}

/**
 * Apply Life Map camera pose / frame to a MapLibre map instance.
 */
export function applyLifeMapCameraToMapLibre(
  map: MapLibreMap,
  camera: LifeMapRendererCamera,
): void {
  const { pose, frame } = camera;

  if (frame) {
    map.fitBounds(
      [
        [frame.west, frame.south],
        [frame.east, frame.north],
      ],
      {
        padding: 32,
        duration: 0,
        bearing: pose.headingDegrees ?? 0,
        pitch: pose.pitchDegrees ?? 0,
      },
    );
    return;
  }

  if (isGeoPosition(pose.target)) {
    map.jumpTo({
      center: [pose.target.lng, pose.target.lat],
      zoom: distanceToMapLibreZoom(pose.distance),
      bearing: pose.headingDegrees ?? 0,
      pitch: pose.pitchDegrees ?? 0,
    });
  }
  // Local anchors: leave current view — no invented geo projection.
}
