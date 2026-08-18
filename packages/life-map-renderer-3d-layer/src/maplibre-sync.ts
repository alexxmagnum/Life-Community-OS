/**
 * Sync Three overlay camera with a MapLibre map view.
 * Projection origin stays locked so extrusions do not drift while panning.
 */

import type { PerspectiveCamera } from "three";

import {
  lngLatToLocalMeters,
  type LifeMap3DProjectionOrigin,
} from "./projection";

export type LifeMap3DMapLibreView = {
  center: { lng: number; lat: number };
  zoom: number;
  pitchDegrees: number;
  bearingDegrees: number;
  /** Overlay host height in CSS pixels — improves distance heuristic. */
  viewportHeightPx?: number;
};

/**
 * Approximate MapLibre mercator view → Three PerspectiveCamera (Y-up local metres).
 */
export function applyMapLibreViewToPerspective(
  perspective: PerspectiveCamera,
  view: LifeMap3DMapLibreView,
  origin: LifeMap3DProjectionOrigin,
): void {
  const look = lngLatToLocalMeters(view.center.lng, view.center.lat, origin);
  const pitch = (Math.max(view.pitchDegrees, 5) * Math.PI) / 180;
  const bearing = (view.bearingDegrees * Math.PI) / 180;

  const viewportH = Math.max(view.viewportHeightPx ?? 480, 1);
  const metersPerPixel =
    (Math.cos((view.center.lat * Math.PI) / 180) * 2 * Math.PI * 6_378_137) /
    (256 * 2 ** view.zoom);
  // Match MapLibre neighborhood framing — places sit on real Earth.
  const distance = Math.max(
    ((metersPerPixel * viewportH) / (2 * Math.tan((45 * Math.PI) / 360))) * 0.55,
    55,
  );

  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  perspective.position.set(
    look.x + Math.sin(bearing) * distance * cosPitch,
    Math.max(distance * sinPitch, 28),
    look.z + Math.cos(bearing) * distance * cosPitch,
  );
  perspective.lookAt(look.x, 2.5, look.z);
  perspective.fov = 45;
  perspective.updateProjectionMatrix();
}
