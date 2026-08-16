/**
 * Multi-tenant Life Map pack resolver.
 *
 * /map → tenantId → LifeMapTenantPack → territory + objects + resolver.
 * Panoramica is one registered tenant — not a hard-wired screen dependency.
 */

import type {
  LifeMapObject,
  LifeMapTerritory,
  TerritoryDataResolver,
} from "@life-community-os/types";

export type LifeMapTenantVisualConfig = {
  atmosphere: "day" | "dusk" | "night";
  groundDetail: "soft" | "standard";
  showLabelsByDefault: boolean;
  accentToken: string;
};

export type LifeMapTenantPack = {
  tenantId: string;
  territoryName: string;
  visual: LifeMapTenantVisualConfig;
  territory: LifeMapTerritory;
  listObjects: () => LifeMapObject[];
  createTerritoryDataResolver: () => TerritoryDataResolver;
  /** Opaque content version for cache / CDN keys. */
  dataVersion: string;
};

type PackFactory = () => LifeMapTenantPack;

const packFactories = new Map<string, PackFactory>();

export function registerLifeMapTenantPack(
  tenantId: string,
  factory: PackFactory,
): void {
  packFactories.set(tenantId, factory);
}

export function resolveLifeMapTenantPack(
  tenantId: string,
): LifeMapTenantPack | null {
  const factory = packFactories.get(tenantId);
  if (!factory) return null;
  return factory();
}

export function listRegisteredLifeMapTenantIds(): string[] {
  return [...packFactories.keys()];
}
