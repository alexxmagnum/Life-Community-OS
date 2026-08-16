/**
 * Life Map — territory location resolver contracts (platform Core).
 *
 * Resolves a human / postal location into an Area of Interest (AOI)
 * before geographic providers (OSM, Catastro, GIS, CAD) are asked for layers.
 *
 * Future adapters (Nominatim, Google, municipal GIS, private) bind outside Core.
 * No HTTP, no map SDK, no inline geometry payloads, no invented coordinates,
 * no tenant hardcoding.
 */

import type { DomainId } from "./ids";
import type {
  LifeMapBounds,
  LifeMapCoordinateReferenceSystem,
} from "./life-map";
import { assertSafeTerritoryDataRef } from "./life-map-territory-ingestion";

// ── Provider families (location only — not map SDKs) ─────────

/**
 * Soft family labels for future geocoding / AOI adapters.
 * Core never calls these services; adapters live outside packages/types.
 */
export type TerritoryLocationProviderKind =
  | "nominatim"
  | "osm"
  | "google"
  | "gis"
  | "private"
  | "unknown"
  | (string & {});

export const TERRITORY_LOCATION_PROVIDER_KINDS: readonly TerritoryLocationProviderKind[] =
  ["nominatim", "osm", "google", "gis", "private"] as const;

/**
 * Provenance of a resolved AOI — never a token or SDK config blob.
 */
export type TerritoryLocationSource = {
  provider: TerritoryLocationProviderKind;
  /** Opaque pointer to the provider extract / place record when known. */
  sourceRef?: string;
  label?: string;
};

// ── Query ────────────────────────────────────────────────────

/**
 * Human location input for AOI resolution.
 * Never a coordinate pair — geocoding adapters bind later.
 */
export type TerritoryLocationQuery = {
  /** Resident-facing territory / community name. */
  territoryName: string;
  /** Optional free-text address or place line. */
  address?: string;
  /**
   * Country label or ISO code (e.g. "Spain" / "ES").
   * Required for provider routing; not a coordinate.
   */
  country: string;
  /** Optional tenant scope for multi-tenant orchestration. */
  tenantId?: DomainId;
  /** Optional known territory id when re-resolving. */
  territoryId?: DomainId;
};

// ── Area of interest ─────────────────────────────────────────

/**
 * Resolved spatial frame for a territory — refs and optional bounds only.
 * Does not embed GeoJSON / polygons inline.
 */
export type TerritoryAreaOfInterest = {
  territoryId?: DomainId;
  crs: LifeMapCoordinateReferenceSystem;
  /**
   * Optional bounding box when a real location adapter supplied it.
   * Null resolver never invents these values.
   */
  bounds?: LifeMapBounds;
  /**
   * Opaque pointer to external AOI geometry (tenant pack, GIS export, …).
   * Prefer this over inline geometry.
   */
  geometryRef?: string;
  /** Which location provider family produced this AOI. */
  source: TerritoryLocationSource;
};

// ── Result / warnings ────────────────────────────────────────

export type TerritoryLocationWarningCode =
  | "missing_name"
  | "missing_country"
  | "unsafe_geometry_ref"
  | "no_provider_wired"
  | "location_unresolved"
  | "partial_coverage"
  | (string & {});

export type TerritoryLocationWarning = {
  code: TerritoryLocationWarningCode;
  message: string;
  provider?: TerritoryLocationProviderKind;
};

export type TerritoryLocationResolveResult =
  | {
      ok: true;
      area: TerritoryAreaOfInterest;
      warnings?: readonly TerritoryLocationWarning[];
    }
  | {
      ok: false;
      warnings: readonly TerritoryLocationWarning[];
    };

// ── Resolver frontier ────────────────────────────────────────

/**
 * Injectable location resolver.
 * Concrete Nominatim / Google / GIS / private adapters bind later.
 */
export type TerritoryLocationResolver = {
  resolveLocation(
    query: TerritoryLocationQuery,
  ): TerritoryLocationResolveResult | Promise<TerritoryLocationResolveResult>;
};

// ── Validation ───────────────────────────────────────────────

export function validateTerritoryLocationQuery(
  query: TerritoryLocationQuery,
): TerritoryLocationWarning[] {
  const warnings: TerritoryLocationWarning[] = [];

  if (!query.territoryName?.trim()) {
    warnings.push({
      code: "missing_name",
      message: "territoryName is required",
    });
  }
  if (!query.country?.trim()) {
    warnings.push({
      code: "missing_country",
      message: "country is required",
    });
  }

  return warnings;
}

export function validateTerritoryAreaOfInterest(
  area: TerritoryAreaOfInterest,
): TerritoryLocationWarning[] {
  const warnings: TerritoryLocationWarning[] = [];

  if (area.geometryRef != null && area.geometryRef.trim()) {
    try {
      assertSafeTerritoryDataRef(area.geometryRef);
    } catch (e) {
      warnings.push({
        code: "unsafe_geometry_ref",
        message: e instanceof Error ? e.message : "Unsafe geometryRef",
        provider: area.source?.provider,
      });
    }
  }

  return warnings;
}

/**
 * Fail-closed stub — no geocoding providers wired.
 * Never invents bounds or geometry.
 */
export function createNullTerritoryLocationResolver(): TerritoryLocationResolver {
  return {
    resolveLocation(query) {
      const warnings = validateTerritoryLocationQuery(query);
      warnings.push({
        code: "no_provider_wired",
        message:
          "Territory location plan ready — no location providers wired yet (Nominatim, Google, GIS, private remain future adapters)",
      });
      return { ok: false, warnings };
    },
  };
}
