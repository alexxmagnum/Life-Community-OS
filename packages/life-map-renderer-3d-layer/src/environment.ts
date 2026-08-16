/**
 * Environment features for the hybrid 3D layer (water / green).
 * Geometry stays territorial (host-resolved); Three adds presence only.
 */

import type { LifeMap3DFootprintRing } from "./buildings";

export type LifeMap3DEnvironmentKind = "water" | "green";

export type LifeMap3DEnvironmentFeature = {
  id: string;
  kind: LifeMap3DEnvironmentKind;
  footprint: LifeMap3DFootprintRing;
  properties?: Readonly<Record<string, unknown>>;
};

/** Soft caps — scalable SaaS, not thousands of trees in v1. */
export const LIFE_MAP_3D_VEGETATION = {
  /** Max tree instances total across all green polygons. */
  maxInstances: 48,
  /** Max trees sampled per green polygon. */
  maxPerPolygon: 4,
} as const;
