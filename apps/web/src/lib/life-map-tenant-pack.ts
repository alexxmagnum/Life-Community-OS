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
  TerritoryObject,
} from "@life-community-os/types";
import type { TerritoryFabricGeoJson } from "@life-community-os/life-map-renderer-maplibre";

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
  /** Physical territory twin — tenant-scoped, coordinates required. */
  listTerritoryObjects?: () => TerritoryObject[];
  territoryAmenities?: () => TerritoryFabricGeoJson | null;
  territoryPoints?: () => TerritoryFabricGeoJson | null;
  createTerritoryDataResolver: () => TerritoryDataResolver;
  /** Opaque content version for cache / CDN keys. */
  dataVersion: string;
  /** Optional CDN base for streaming assets (Phase 12). */
  assetCdnBaseUrl?: string;
  /** Optional domain enrichment for context cards (tenant-owned). */
  enrichContext?: (
    object: LifeMapObject,
  ) => Partial<{
    label: string;
    summary: string;
    experienceTag: string;
    heroTone: string;
    imageUrl: string;
    categoryHint: string;
  }> | null;
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
