/**
 * Life Map — territory data resolver frontier (platform Core).
 *
 * Resolves opaque `dataRef` → territorial payloads for renderers.
 * Provider-agnostic: no map SDK, no network fetch, no API tokens,
 * no tenant pack imports.
 *
 * Concrete resolvers (filesystem, CDN, tenant pack) are injected by the app.
 */

import type { LifeMapBaseLayer, LifeMapBaseLayerType } from "./life-map";
import { assertSafeTerritoryDataRef } from "./life-map-territory-ingestion";

// ── Payload kinds ────────────────────────────────────────────

/**
 * Interchange kinds a resolver may return.
 * GeoJSON is implemented first; others are contract stubs for future adapters.
 */
export type TerritoryDataPayloadKind =
  | "geojson"
  | "vector_tiles"
  | "raster"
  | "tiles_3d";

export const TERRITORY_DATA_PAYLOAD_KINDS: readonly TerritoryDataPayloadKind[] =
  ["geojson", "vector_tiles", "raster", "tiles_3d"] as const;

/**
 * GeoJSON payload — opaque structured value (FeatureCollection / Feature / Geometry).
 * Core does not validate geometry topology here.
 */
export type TerritoryGeoJsonPayload = {
  kind: "geojson";
  dataRef: string;
  /**
   * Opaque GeoJSON document.
   * Callers / adapters interpret; Core stores no invented coordinates.
   */
  geojson: unknown;
};

/**
 * Future: vector tile source descriptor.
 * No URL resolution or tile fetch in Core.
 */
export type TerritoryVectorTilesPayload = {
  kind: "vector_tiles";
  dataRef: string;
  /** Opaque tile set pointer — never an API key. */
  tilesRef?: string;
  minZoom?: number;
  maxZoom?: number;
};

/**
 * Future: raster / imagery descriptor.
 */
export type TerritoryRasterPayload = {
  kind: "raster";
  dataRef: string;
  /** Opaque raster pointer — never an API key. */
  rasterRef?: string;
};

/**
 * Future: 3D Tiles / mesh tileset descriptor (e.g. Cesium).
 */
export type TerritoryTiles3dPayload = {
  kind: "tiles_3d";
  dataRef: string;
  /** Opaque tileset pointer — never an API key. */
  tilesetRef?: string;
};

export type TerritoryDataPayload =
  | TerritoryGeoJsonPayload
  | TerritoryVectorTilesPayload
  | TerritoryRasterPayload
  | TerritoryTiles3dPayload;

// ── Resolve contract ─────────────────────────────────────────

export type TerritoryDataResolveIssueCode =
  | "empty_data_ref"
  | "unsafe_data_ref"
  | "not_found"
  | "unsupported_kind"
  | "invalid_payload"
  | "resolver_error";

export type TerritoryDataResolveIssue = {
  code: TerritoryDataResolveIssueCode;
  message: string;
  dataRef?: string;
};

/**
 * Optional context for injectable resolvers.
 * `tenantId` is an opaque id string — never import a tenant pack here.
 */
export type TerritoryDataResolveContext = {
  tenantId?: string;
  territoryId?: string;
  baseLayerId?: string;
  baseLayerType?: LifeMapBaseLayerType;
};

export type TerritoryDataResolveResult =
  | { ok: true; payload: TerritoryDataPayload }
  | { ok: false; issues: TerritoryDataResolveIssue[] };

/**
 * Provider-agnostic territory data resolver.
 *
 * `dataRef` in → payload out. Implementations are injected (tenant storage,
 * static maps, CDN). This interface must not embed SDK clients or secrets.
 */
export type TerritoryDataResolver = {
  resolve(
    dataRef: string,
    context?: TerritoryDataResolveContext,
  ): TerritoryDataResolveResult | Promise<TerritoryDataResolveResult>;
};

/**
 * Base layer + optional resolved payload — what renderers consume.
 */
export type ResolvedLifeMapBaseLayer = {
  layer: LifeMapBaseLayer;
  payload: TerritoryDataPayload | null;
  issues?: TerritoryDataResolveIssue[];
};

// ── Helpers ──────────────────────────────────────────────────

export function isTerritoryGeoJsonPayload(
  payload: TerritoryDataPayload,
): payload is TerritoryGeoJsonPayload {
  return payload.kind === "geojson";
}

/**
 * Fail-closed resolver — always `not_found`.
 * Safe default until a real injector is wired.
 */
export function createNullTerritoryDataResolver(): TerritoryDataResolver {
  return {
    resolve(dataRef) {
      const trimmed = dataRef?.trim() ?? "";
      if (!trimmed) {
        return {
          ok: false,
          issues: [
            {
              code: "empty_data_ref",
              message: "dataRef is required",
            },
          ],
        };
      }
      try {
        assertSafeTerritoryDataRef(trimmed);
      } catch (e) {
        return {
          ok: false,
          issues: [
            {
              code: "unsafe_data_ref",
              message: e instanceof Error ? e.message : "Unsafe dataRef",
              dataRef: trimmed,
            },
          ],
        };
      }
      return {
        ok: false,
        issues: [
          {
            code: "not_found",
            message: `No territory payload registered for dataRef "${trimmed}"`,
            dataRef: trimmed,
          },
        ],
      };
    },
  };
}

/**
 * Injectable in-memory resolver — maps dataRef → payload.
 * For tests and local wiring; does not fetch or invent geometry.
 */
export function createStaticTerritoryDataResolver(
  payloads: ReadonlyMap<string, TerritoryDataPayload> | Record<string, TerritoryDataPayload>,
): TerritoryDataResolver {
  const map =
    payloads instanceof Map
      ? payloads
      : new Map(Object.entries(payloads));

  return {
    resolve(dataRef) {
      const trimmed = dataRef?.trim() ?? "";
      if (!trimmed) {
        return {
          ok: false,
          issues: [
            { code: "empty_data_ref", message: "dataRef is required" },
          ],
        };
      }
      try {
        assertSafeTerritoryDataRef(trimmed);
      } catch (e) {
        return {
          ok: false,
          issues: [
            {
              code: "unsafe_data_ref",
              message: e instanceof Error ? e.message : "Unsafe dataRef",
              dataRef: trimmed,
            },
          ],
        };
      }
      const payload = map.get(trimmed);
      if (!payload) {
        return {
          ok: false,
          issues: [
            {
              code: "not_found",
              message: `No territory payload registered for dataRef "${trimmed}"`,
              dataRef: trimmed,
            },
          ],
        };
      }
      if (payload.dataRef !== trimmed) {
        return {
          ok: false,
          issues: [
            {
              code: "invalid_payload",
              message: `Payload dataRef "${payload.dataRef}" does not match request "${trimmed}"`,
              dataRef: trimmed,
            },
          ],
        };
      }
      return { ok: true, payload };
    },
  };
}

/**
 * Resolve one base layer through an injectable resolver.
 */
export async function resolveLifeMapBaseLayer(
  layer: LifeMapBaseLayer,
  resolver: TerritoryDataResolver,
  context?: Omit<TerritoryDataResolveContext, "baseLayerId" | "baseLayerType">,
): Promise<ResolvedLifeMapBaseLayer> {
  const result = await resolver.resolve(layer.dataRef, {
    ...context,
    baseLayerId: layer.id,
    baseLayerType: layer.type,
  });
  if (result.ok) {
    return { layer, payload: result.payload };
  }
  return { layer, payload: null, issues: result.issues };
}

/**
 * Resolve many base layers — order preserved.
 */
export async function resolveLifeMapBaseLayers(
  layers: readonly LifeMapBaseLayer[],
  resolver: TerritoryDataResolver,
  context?: Omit<TerritoryDataResolveContext, "baseLayerId" | "baseLayerType">,
): Promise<ResolvedLifeMapBaseLayer[]> {
  const out: ResolvedLifeMapBaseLayer[] = [];
  for (const layer of layers) {
    out.push(await resolveLifeMapBaseLayer(layer, resolver, context));
  }
  return out;
}
