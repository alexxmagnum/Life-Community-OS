/**
 * Local-only Life Map visual preview gate.
 * Production stays fail-closed via tenant `lifeMap: false` + module registry.
 */

/** Dev spatial engine for `/map` technical preview. */
export type LifeMapDevEngine = "maplibre" | "three";

/**
 * Which renderer `/map` mounts in development.
 * Default: MapLibre (Phase 10.11). Set `NEXT_PUBLIC_LIFE_MAP_ENGINE=three` to restore Three.
 */
export function getLifeMapDevEngine(): LifeMapDevEngine {
  const value = process.env.NEXT_PUBLIC_LIFE_MAP_ENGINE?.trim().toLowerCase();
  if (value === "three") return "three";
  return "maplibre";
}

export function isLifeMapDevPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_LIFE_MAP_DEV === "1"
  );
}

/**
 * Hybrid MapLibre + Three building extrusion overlay (dev preview only).
 * Default on when Life Map dev preview is enabled and engine is MapLibre.
 * Opt out with `NEXT_PUBLIC_LIFE_MAP_3D=0`.
 */
export function isLifeMapHybrid3DPreviewEnabled(): boolean {
  if (!isLifeMapDevPreviewEnabled()) return false;
  if (getLifeMapDevEngine() !== "maplibre") return false;
  const value = process.env.NEXT_PUBLIC_LIFE_MAP_3D?.trim().toLowerCase();
  if (value === "0" || value === "false" || value === "off") return false;
  return true;
}
