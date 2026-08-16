/**
 * Camera adapter: LifeMapRendererCamera → MapLibre view.
 *
 * Geo targets and frame bounds drive the map.
 * Local anchors are ignored until a local→geo projection exists.
 * Premium framing: community context, cinematic open, no GIS plunge.
 */

import type { LifeMapRendererCamera } from "@life-community-os/life-map-renderer";
import type { LifeMapPosition } from "@life-community-os/types";
import type { Map as MapLibreMap } from "maplibre-gl";

import { LIFE_MAP_PREMIUM_CAMERA } from "./premium-style";

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

export type ApplyLifeMapCameraOptions = {
  /** Animation duration in ms. Default: premium open duration. */
  durationMs?: number;
  /** Bounds padding in px. Default: premium fit padding. */
  paddingPx?: number;
  /** Cap fit zoom so open view stays community-scale. */
  maxZoom?: number;
  /** When true, skip animation (first paint / SSR-safe). */
  immediate?: boolean;
};

/**
 * Apply Life Map camera pose / frame to a MapLibre map instance.
 */
export function applyLifeMapCameraToMapLibre(
  map: MapLibreMap,
  camera: LifeMapRendererCamera,
  options?: ApplyLifeMapCameraOptions,
): void {
  const { pose, frame } = camera;
  const immediate = options?.immediate === true;
  const duration = immediate
    ? 0
    : (options?.durationMs ?? LIFE_MAP_PREMIUM_CAMERA.openDurationMs);
  const padding =
    options?.paddingPx ?? LIFE_MAP_PREMIUM_CAMERA.fitPaddingPx;
  const maxZoom = options?.maxZoom ?? LIFE_MAP_PREMIUM_CAMERA.maxFitZoom;

  if (frame) {
    map.fitBounds(
      [
        [frame.west, frame.south],
        [frame.east, frame.north],
      ],
      {
        padding,
        duration,
        maxZoom,
        bearing: pose.headingDegrees ?? 0,
        pitch: pose.pitchDegrees ?? 0,
        essential: true,
      },
    );
    return;
  }

  if (isGeoPosition(pose.target)) {
    const center: [number, number] = [pose.target.lng, pose.target.lat];
    const zoom = Math.min(
      maxZoom,
      distanceToMapLibreZoom(pose.distance),
    );
    if (duration > 0) {
      map.easeTo({
        center,
        zoom,
        bearing: pose.headingDegrees ?? 0,
        pitch: pose.pitchDegrees ?? 0,
        duration,
        essential: true,
      });
    } else {
      map.jumpTo({
        center,
        zoom,
        bearing: pose.headingDegrees ?? 0,
        pitch: pose.pitchDegrees ?? 0,
      });
    }
  }
  // Local anchors: leave current view — no invented geo projection.
}
