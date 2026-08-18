/**
 * Camera adapter: LifeMapRendererCamera → MapLibre view.
 *
 * Community experience: pose focus wins over full-territory fitBounds.
 * Uses explicit community zoom — distance heuristics alone look like satellite GIS.
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

/**
 * Map community / exploration distance to a human-scale zoom.
 * Short distances → community focus; large distances → soft overview.
 */
export function distanceToMapLibreZoom(distance: number | undefined): number {
  if (distance === undefined || !Number.isFinite(distance)) {
    return LIFE_MAP_PREMIUM_CAMERA.communityFocusZoom;
  }
  // Product framing: community twin distances are hundreds of metres, not DEM km.
  if (distance <= 700) {
    return LIFE_MAP_PREMIUM_CAMERA.communityFocusZoom;
  }
  if (distance <= 1200) {
    return Math.max(
      LIFE_MAP_PREMIUM_CAMERA.explorationMinZoom,
      LIFE_MAP_PREMIUM_CAMERA.communityFocusZoom - 0.55,
    );
  }
  const zoom = 18 - Math.log2(Math.max(distance, 1));
  return Math.min(
    LIFE_MAP_PREMIUM_CAMERA.explorationMaxZoom,
    Math.max(LIFE_MAP_PREMIUM_CAMERA.explorationMinZoom - 0.8, zoom),
  );
}

export type ApplyLifeMapCameraOptions = {
  durationMs?: number;
  paddingPx?: number;
  maxZoom?: number;
  immediate?: boolean;
  /** Rare tooling: fit full territory frame. */
  forceBounds?: boolean;
};

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
  const forceBounds = options?.forceBounds === true;

  if (isGeoPosition(pose.target) && !forceBounds) {
    const center: [number, number] = [pose.target.lng, pose.target.lat];
    const zoom = Math.min(maxZoom, distanceToMapLibreZoom(pose.distance));
    const bearing =
      pose.headingDegrees ?? LIFE_MAP_PREMIUM_CAMERA.communityFocusBearing;
    const pitch =
      pose.pitchDegrees ?? LIFE_MAP_PREMIUM_CAMERA.communityFocusPitch;
    if (duration > 0) {
      map.easeTo({
        center,
        zoom,
        bearing,
        pitch,
        duration,
        essential: true,
      });
    } else {
      map.jumpTo({
        center,
        zoom,
        bearing,
        pitch,
      });
    }
    return;
  }

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
        pitch: pose.pitchDegrees ?? LIFE_MAP_PREMIUM_CAMERA.communityFocusPitch,
        essential: true,
      },
    );
  }
}
