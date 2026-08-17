/**
 * Life Map experience gates.
 * Panoramica customer demo uses MapLibre + hybrid Three by default.
 * Production tenants stay fail-closed via their own `lifeMap` feature flag.
 */

/** Spatial engine for `/map`. */
export type LifeMapDevEngine = "maplibre" | "three";

/**
 * Which renderer `/map` mounts.
 * Default: MapLibre (territorial SoT). Set `NEXT_PUBLIC_LIFE_MAP_ENGINE=three` for legacy prototype.
 */
export function getLifeMapDevEngine(): LifeMapDevEngine {
  const value = process.env.NEXT_PUBLIC_LIFE_MAP_ENGINE?.trim().toLowerCase();
  if (value === "three") return "three";
  return "maplibre";
}

/**
 * Legacy local unlock when tenant `lifeMap` feature is still off.
 * Prefer enabling the tenant feature for customer demos.
 */
export function isLifeMapDevPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_LIFE_MAP_DEV === "1"
  );
}

/**
 * Hybrid MapLibre + Three world — customer demo default.
 * Opt out with `NEXT_PUBLIC_LIFE_MAP_3D=0`.
 */
export function isLifeMapHybrid3DPreviewEnabled(): boolean {
  if (getLifeMapDevEngine() !== "maplibre") return false;
  const value = process.env.NEXT_PUBLIC_LIFE_MAP_3D?.trim().toLowerCase();
  if (value === "0" || value === "false" || value === "off") return false;
  return true;
}

/** Customer-facing experience unlock (feature OR local demo gate). */
export function isLifeMapExperienceUnlocked(featureEnabled: boolean): boolean {
  return featureEnabled || isLifeMapDevPreviewEnabled();
}
