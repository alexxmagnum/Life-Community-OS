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
