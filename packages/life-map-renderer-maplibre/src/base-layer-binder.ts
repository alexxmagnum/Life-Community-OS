/**
 * Internal binder: LifeMapBaseLayer → MapLibre source / layer descriptors.
 *
 * Applies resolved GeoJSON payloads when provided.
 * Does NOT fetch or resolve `dataRef` itself — resolver is injected upstream.
 */

import type {
  LifeMapBaseLayer,
  LifeMapBaseLayerType,
  ResolvedLifeMapBaseLayer,
  TerritoryDataPayload,
} from "@life-community-os/types";
import { isTerritoryGeoJsonPayload } from "@life-community-os/types";
import type {
  FillLayerSpecification,
  GeoJSONSource,
  LineLayerSpecification,
  Map as MapLibreMap,
} from "maplibre-gl";

/** Base layer kinds this MapLibre foundation binds (no terrain yet). */
export const MAPLIBRE_BOUND_BASE_LAYER_TYPES = [
  "roads",
  "water",
  "buildings",
  "green",
  "boundary",
] as const satisfies readonly LifeMapBaseLayerType[];

export type MapLibreBoundBaseLayerType =
  (typeof MAPLIBRE_BOUND_BASE_LAYER_TYPES)[number];

export function isMapLibreBoundBaseLayerType(
  type: LifeMapBaseLayerType,
): type is MapLibreBoundBaseLayerType {
  return (MAPLIBRE_BOUND_BASE_LAYER_TYPES as readonly string[]).includes(type);
}

const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [],
};

/** Planned MapLibre binding for one LifeMapBaseLayer — no network I/O. */
export type MapLibreBaseLayerBinding = {
  baseLayerId: string;
  type: MapLibreBoundBaseLayerType;
  /** Opaque ref echoed for future loaders — never fetched here. */
  dataRef: string;
  sourceId: string;
  layerId: string;
  visible: boolean;
  zIndex: number;
  label?: string;
  /** True when a GeoJSON payload was applied to the source. */
  hasResolvedGeoJson: boolean;
};

export type SyncMapLibreBaseLayersOptions = {
  /**
   * Optional map of dataRef → already-resolved payload.
   * Prefer {@link resolvedLayers} when pairing layer + payload.
   */
  resolvedByDataRef?: ReadonlyMap<string, TerritoryDataPayload>;
  /** Preferred: resolved base layers from TerritoryDataResolver. */
  resolvedLayers?: readonly ResolvedLifeMapBaseLayer[];
};

export function mapLibreSourceIdForBaseLayer(layerId: string): string {
  return `lm-base-src:${layerId}`;
}

export function mapLibreLayerIdForBaseLayer(layerId: string): string {
  return `lm-base-lyr:${layerId}`;
}

/**
 * Plan a MapLibre binding from a platform base layer.
 * Unsupported types (terrain, custom, …) return null.
 */
export function planMapLibreBaseLayerBinding(
  layer: LifeMapBaseLayer,
): Omit<MapLibreBaseLayerBinding, "hasResolvedGeoJson"> | null {
  if (!isMapLibreBoundBaseLayerType(layer.type)) {
    return null;
  }
  return {
    baseLayerId: layer.id,
    type: layer.type,
    dataRef: layer.dataRef,
    sourceId: mapLibreSourceIdForBaseLayer(layer.id),
    layerId: mapLibreLayerIdForBaseLayer(layer.id),
    visible: layer.visible,
    zIndex: layer.zIndex,
    label: layer.label,
  };
}

function isLineBaseType(
  type: MapLibreBoundBaseLayerType,
): type is "roads" | "boundary" {
  return type === "roads" || type === "boundary";
}

function buildPayloadLookup(
  options: SyncMapLibreBaseLayersOptions | undefined,
): Map<string, TerritoryDataPayload> {
  const lookup = new Map<string, TerritoryDataPayload>();
  if (options?.resolvedByDataRef) {
    for (const [ref, payload] of options.resolvedByDataRef) {
      lookup.set(ref, payload);
    }
  }
  if (options?.resolvedLayers) {
    for (const entry of options.resolvedLayers) {
      if (entry.payload) {
        lookup.set(entry.layer.dataRef, entry.payload);
      }
    }
  }
  return lookup;
}

function geoJsonDataForPayload(
  payload: TerritoryDataPayload | undefined,
): typeof EMPTY_FEATURE_COLLECTION | unknown {
  if (payload && isTerritoryGeoJsonPayload(payload)) {
    return payload.geojson ?? EMPTY_FEATURE_COLLECTION;
  }
  return EMPTY_FEATURE_COLLECTION;
}

/**
 * Sync planned base layers onto a MapLibre map.
 * Uses resolved GeoJSON when supplied; otherwise empty FeatureCollection.
 * Never resolves `dataRef` itself.
 */
export function syncMapLibreBaseLayers(
  map: MapLibreMap,
  baseLayers: readonly LifeMapBaseLayer[] | undefined,
  options?: SyncMapLibreBaseLayersOptions,
): MapLibreBaseLayerBinding[] {
  const payloadByRef = buildPayloadLookup(options);

  const planned = (baseLayers ?? [])
    .map((layer) => {
      const plan = planMapLibreBaseLayerBinding(layer);
      if (!plan) return null;
      const payload = payloadByRef.get(layer.dataRef);
      const hasResolvedGeoJson = Boolean(
        payload && isTerritoryGeoJsonPayload(payload),
      );
      return { ...plan, hasResolvedGeoJson } satisfies MapLibreBaseLayerBinding;
    })
    .filter((b): b is MapLibreBaseLayerBinding => b !== null)
    .sort((a, b) => a.zIndex - b.zIndex);

  const keepSourceIds = new Set(planned.map((b) => b.sourceId));
  const keepLayerIds = new Set(planned.map((b) => b.layerId));
  const style = map.getStyle();
  if (!style) {
    return planned;
  }

  for (const layer of [...(style.layers ?? [])].reverse()) {
    if (layer.id.startsWith("lm-base-lyr:") && !keepLayerIds.has(layer.id)) {
      map.removeLayer(layer.id);
    }
  }
  for (const sourceId of Object.keys(style.sources ?? {})) {
    if (sourceId.startsWith("lm-base-src:") && !keepSourceIds.has(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  for (const binding of planned) {
    const payload = payloadByRef.get(binding.dataRef);
    const data = geoJsonDataForPayload(payload);

    if (!map.getSource(binding.sourceId)) {
      map.addSource(binding.sourceId, {
        type: "geojson",
        data: data as typeof EMPTY_FEATURE_COLLECTION,
      });
    } else {
      const source = map.getSource(binding.sourceId) as GeoJSONSource;
      source.setData(data as typeof EMPTY_FEATURE_COLLECTION);
    }

    if (!map.getLayer(binding.layerId)) {
      const visibility = binding.visible ? "visible" : "none";
      const metadata = {
        lifeMapBaseLayerId: binding.baseLayerId,
        lifeMapDataRef: binding.dataRef,
        lifeMapBaseLayerType: binding.type,
      };

      if (isLineBaseType(binding.type)) {
        const lineLayer: LineLayerSpecification = {
          id: binding.layerId,
          type: "line",
          source: binding.sourceId,
          layout: { visibility },
          paint:
            binding.type === "roads"
              ? {
                  "line-color": "#6b7280",
                  "line-width": 1.5,
                  "line-opacity": 0.85,
                }
              : {
                  "line-color": "#292524",
                  "line-width": 2,
                  "line-opacity": 0.9,
                  "line-dasharray": [2, 1],
                },
          metadata,
        };
        map.addLayer(lineLayer);
      } else {
        const fillLayer: FillLayerSpecification = {
          id: binding.layerId,
          type: "fill",
          source: binding.sourceId,
          layout: { visibility },
          paint:
            binding.type === "water"
              ? {
                  "fill-color": "#7dd3fc",
                  "fill-opacity": 0.55,
                }
              : binding.type === "buildings"
                ? {
                    "fill-color": "#d6d3d1",
                    "fill-opacity": 0.75,
                    "fill-outline-color": "#a8a29e",
                  }
                : {
                    "fill-color": "#86efac",
                    "fill-opacity": 0.45,
                  },
          metadata,
        };
        map.addLayer(fillLayer);
      }
    } else {
      map.setLayoutProperty(
        binding.layerId,
        "visibility",
        binding.visible ? "visible" : "none",
      );
    }
  }

  return planned;
}

/**
 * Apply already-resolved base layers (from TerritoryDataResolver) to the map.
 */
export function syncMapLibreResolvedBaseLayers(
  map: MapLibreMap,
  resolvedLayers: readonly ResolvedLifeMapBaseLayer[],
): MapLibreBaseLayerBinding[] {
  return syncMapLibreBaseLayers(
    map,
    resolvedLayers.map((r) => r.layer),
    { resolvedLayers },
  );
}
