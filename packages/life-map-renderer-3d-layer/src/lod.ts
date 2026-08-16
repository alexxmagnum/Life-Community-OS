/**
 * LOD preparation for scalable multi-tenant 3D communities.
 * Distance tiers — engines may cull / simplify without new Core contracts.
 */

export type LifeMap3DLodLevel = "full" | "simplified" | "culled";

export type LifeMap3DLodPolicy = {
  /** Beyond this distance (m from camera target on XZ), use simplified mesh. */
  simplifyBeyondMeters: number;
  /** Beyond this distance, skip mesh (cull). */
  cullBeyondMeters: number;
};

export const LIFE_MAP_3D_DEFAULT_LOD_POLICY: LifeMap3DLodPolicy = {
  simplifyBeyondMeters: 420,
  cullBeyondMeters: 900,
};

export const LIFE_MAP_3D_MOBILE_LOD_POLICY: LifeMap3DLodPolicy = {
  simplifyBeyondMeters: 280,
  cullBeyondMeters: 620,
};

/**
 * Resolve LOD from horizontal distance to camera look target (local metres).
 */
export function resolveLifeMap3DLod(
  distanceMeters: number,
  policy: LifeMap3DLodPolicy = LIFE_MAP_3D_DEFAULT_LOD_POLICY,
): LifeMap3DLodLevel {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return "full";
  if (distanceMeters > policy.cullBeyondMeters) return "culled";
  if (distanceMeters > policy.simplifyBeyondMeters) return "simplified";
  return "full";
}

/** Horizontal distance from local point to camera XZ (Y ignored). */
export function horizontalDistanceMeters(
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.hypot(dx, dz);
}
