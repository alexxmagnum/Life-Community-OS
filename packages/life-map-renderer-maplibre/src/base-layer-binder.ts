/**
 * Internal binder: LifeMapBaseLayer → MapLibre source / layer descriptors.
 *
 * Applies resolved GeoJSON payloads when provided.
 * Does NOT fetch or resolve `dataRef` itself — resolver is injected upstream.
 * Paint comes from the Life Map premium style system.
 */

import type {
  LifeMapBaseLayer,
  LifeMapBaseLayerType,
  ResolvedLifeMapBaseLayer,
  TerritoryDataPayload,
} from "@life-community-os/types";
import { isTerritoryGeoJsonPayload } from "@life-community-os/types";
import type {
  FillExtrusionLayerSpecification,
  FillLayerSpecification,
  GeoJSONSource,
  LineLayerSpecification,
  Map as MapLibreMap,
} from "maplibre-gl";

import {
  LIFE_MAP_PREMIUM_PALETTE,
  premiumPaintForBaseType,
  type LifeMapPremiumBaseLayerType,
} from "./premium-style";

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
  /**
   * When true (hybrid 3D), keep building footprints subtle so volume reads first.
   */
  softenBuildingFills?: boolean;
  /**
   * When true (hybrid 3D), keep water/green fills subtle under 3D pads.
   */
  softenEnvironmentFills?: boolean;
};

export function mapLibreSourceIdForBaseLayer(layerId: string): string {
  return `lm-base-src:${layerId}`;
}

export function mapLibreLayerIdForBaseLayer(layerId: string): string {
  return `lm-base-lyr:${layerId}`;
}

export function mapLibreExtrusionLayerIdForBaseLayer(layerId: string): string {
  return `lm-base-lyr:${layerId}:extrusion`;
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

function applyPremiumPaint(
  map: MapLibreMap,
  binding: MapLibreBaseLayerBinding,
  softenBuildingFills: boolean,
  softenEnvironmentFills: boolean,
): void {
  const paint = premiumPaintForBaseType(
    binding.type as LifeMapPremiumBaseLayerType,
  );
  for (const [key, value] of Object.entries(paint)) {
    try {
      map.setPaintProperty(binding.layerId, key, value);
    } catch {
      // Layer may not support the property yet — ignore.
    }
  }
  if (binding.type === "buildings" && softenBuildingFills) {
    try {
      // Slightly soft so 3D heroes read on top — territory remains visible.
      map.setPaintProperty(binding.layerId, "fill-opacity", 0.82);
      map.setPaintProperty(binding.layerId, "fill-outline-color", "#a89f90");
    } catch {
      // ignore
    }
  }
  if (
    softenEnvironmentFills &&
    (binding.type === "water" || binding.type === "green")
  ) {
    try {
      map.setPaintProperty(
        binding.layerId,
        "fill-opacity",
        binding.type === "water" ? 0.88 : 0.72,
      );
    } catch {
      // ignore
    }
  }
  if (softenEnvironmentFills && binding.type === "roads") {
    try {
      map.setPaintProperty(binding.layerId, "line-opacity", 0.92);
    } catch {
      // ignore
    }
  }
  if (softenEnvironmentFills && binding.type === "boundary") {
    try {
      map.setPaintProperty(binding.layerId, "line-opacity", 0.5);
    } catch {
      // ignore
    }
  }
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
  const softenBuildingFills = Boolean(options?.softenBuildingFills);
  const softenEnvironmentFills = Boolean(options?.softenEnvironmentFills);

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
  const keepLayerIds = new Set([
    ...planned.map((b) => b.layerId),
    ...planned
      .filter((b) => b.type === "buildings")
      .map((b) => mapLibreExtrusionLayerIdForBaseLayer(b.baseLayerId)),
  ]);
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
        // Stable ids for feature-state hover / selection.
        generateId: true,
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
      const paint = premiumPaintForBaseType(
        binding.type as LifeMapPremiumBaseLayerType,
      );

      if (isLineBaseType(binding.type)) {
        const lineLayer: LineLayerSpecification = {
          id: binding.layerId,
          type: "line",
          source: binding.sourceId,
          layout: {
            visibility,
            "line-cap": "round",
            "line-join": "round",
          },
          paint: paint as LineLayerSpecification["paint"],
          metadata,
        };
        map.addLayer(lineLayer);
      } else {
        const fillLayer: FillLayerSpecification = {
          id: binding.layerId,
          type: "fill",
          source: binding.sourceId,
          layout: { visibility },
          paint: paint as FillLayerSpecification["paint"],
          metadata,
          // Footprints stay under extrusion; hide fill when extrusion is on.
          ...(binding.type === "buildings"
            ? { maxzoom: 15.6 }
            : {}),
        };
        map.addLayer(fillLayer);
      }
    }

    // Real building mass on the map — commercial Earth feel (no floating toys).
    if (binding.type === "buildings") {
      const extrusionId = mapLibreExtrusionLayerIdForBaseLayer(
        binding.baseLayerId,
      );
      if (!map.getLayer(extrusionId)) {
        const extrusion: FillExtrusionLayerSpecification = {
          id: extrusionId,
          type: "fill-extrusion",
          source: binding.sourceId,
          minzoom: 15.4,
          layout: {
            visibility: binding.visible ? "visible" : "none",
          },
          paint: {
            "fill-extrusion-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              LIFE_MAP_PREMIUM_PALETTE.buildingsSelected,
              ["boolean", ["feature-state", "hover"], false],
              LIFE_MAP_PREMIUM_PALETTE.buildingsHover,
              LIFE_MAP_PREMIUM_PALETTE.buildingsExtrusion,
            ],
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15.4,
              0,
              16.2,
              [
                "coalesce",
                ["get", "height"],
                ["*", ["coalesce", ["get", "building:levels"], 3], 3],
                9,
              ],
              18,
              [
                "coalesce",
                ["get", "height"],
                ["*", ["coalesce", ["get", "building:levels"], 3], 3],
                11,
              ],
            ],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15.4,
              0,
              16,
              0.78,
              17.5,
              0.88,
            ],
          },
          metadata: {
            lifeMapBaseLayerId: binding.baseLayerId,
            lifeMapDataRef: binding.dataRef,
            lifeMapBaseLayerType: "buildings",
            lifeMapExtrusion: true,
          },
        };
        map.addLayer(extrusion);
      } else {
        map.setLayoutProperty(
          extrusionId,
          "visibility",
          binding.visible ? "visible" : "none",
        );
      }
    }

    map.setLayoutProperty(
      binding.layerId,
      "visibility",
      binding.visible ? "visible" : "none",
    );
    applyPremiumPaint(map, binding, softenBuildingFills, softenEnvironmentFills);
  }

  return planned;
}

/**
 * Apply already-resolved base layers (from TerritoryDataResolver) to the map.
 */
export function syncMapLibreResolvedBaseLayers(
  map: MapLibreMap,
  resolvedLayers: readonly ResolvedLifeMapBaseLayer[],
  options?: Pick<SyncMapLibreBaseLayersOptions, "softenBuildingFills">,
): MapLibreBaseLayerBinding[] {
  return syncMapLibreBaseLayers(
    map,
    resolvedLayers.map((r) => r.layer),
    { resolvedLayers, ...options },
  );
}
