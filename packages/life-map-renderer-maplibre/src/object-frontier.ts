/**
 * Life OS object frontier for MapLibre — commercial premium pins.
 *
 * Zoom 12–15: soft dots / clusters feel
 * Zoom 16–17: premium pins + labels
 * Zoom 18+: pins remain; optional grounded 3D accents elsewhere
 */

import type { LifeMapRenderableObject } from "@life-community-os/life-map-renderer";
import type {
  CircleLayerSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  SymbolLayerSpecification,
} from "maplibre-gl";

/** Stable MapLibre custom-layer / source id for a Life OS object. */
export function mapLibreObjectSourceId(objectId: string): string {
  return `lm-obj-src:${objectId}`;
}

export function mapLibreObjectLayerId(objectId: string): string {
  return `lm-obj-lyr:${objectId}`;
}

export const MAPLIBRE_OBJECTS_SOURCE_ID = "lm-life-os-objects";
export const MAPLIBRE_OBJECTS_LAYER_ID = "lm-life-os-objects-circle";
export const MAPLIBRE_OBJECTS_HALO_LAYER_ID = "lm-life-os-objects-halo";
export const MAPLIBRE_OBJECTS_LABEL_LAYER_ID = "lm-life-os-objects-label";

export type MapLibreObjectBinding = {
  objectId: string;
  layerId: string;
  sourceId: string;
  productLayerId: string;
  type: LifeMapRenderableObject["type"];
  assetKey?: string;
  label?: string;
  hasGeo: boolean;
};

function isGeoPosition(
  position: LifeMapRenderableObject["position"],
): position is { lat: number; lng: number } {
  return (
    typeof (position as { lat?: unknown }).lat === "number" &&
    typeof (position as { lng?: unknown }).lng === "number"
  );
}

export function planMapLibreObjectBinding(
  object: LifeMapRenderableObject,
): MapLibreObjectBinding {
  return {
    objectId: object.objectId,
    layerId: mapLibreObjectLayerId(object.objectId),
    sourceId: mapLibreObjectSourceId(object.objectId),
    productLayerId: String(object.layerId),
    type: object.type,
    assetKey: object.asset?.assetKey,
    label: object.label,
    hasGeo: isGeoPosition(object.position),
  };
}

function colorForType(type: LifeMapRenderableObject["type"]): string {
  switch (type) {
    case "place":
    case "poi":
      return "#c47848";
    case "service":
      return "#c89040";
    case "resource":
      return "#2f8a5a";
    case "community":
    case "experience":
      return "#a070c0";
    case "official":
      return "#5080b0";
    case "housing":
    case "decoration":
      return "#b89870";
    default:
      return "#5a9aaa";
  }
}

export type SyncMapLibreObjectFrontierOptions = {
  /** Hide pin circles (rare — commercial default keeps pins). */
  hidden?: boolean;
  /** Show place-name labels (from ~zoom 16). */
  showPlaceLabels?: boolean;
};

/**
 * Sync Life OS objects as premium MapLibre pins anchored to lat/lng.
 */
export function syncMapLibreObjectFrontier(
  objects: readonly LifeMapRenderableObject[],
  map?: MapLibreMap | null,
  options?: SyncMapLibreObjectFrontierOptions,
): MapLibreObjectBinding[] {
  const bindings = objects.map(planMapLibreObjectBinding);
  const hidden = options?.hidden === true;
  const showPlaceLabels = options?.showPlaceLabels !== false;

  if (!map || !map.getStyle()) {
    return bindings;
  }

  const features = objects
    .filter((o) => isGeoPosition(o.position))
    .map((o) => {
      const pos = o.position as { lat: number; lng: number };
      return {
        type: "Feature" as const,
        id: o.objectId,
        properties: {
          objectId: o.objectId,
          type: o.type,
          label: o.label ?? "",
          color: colorForType(o.type),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [pos.lng, pos.lat] as [number, number],
        },
      };
    });

  const collection = {
    type: "FeatureCollection" as const,
    features,
  };

  if (!map.getSource(MAPLIBRE_OBJECTS_SOURCE_ID)) {
    map.addSource(MAPLIBRE_OBJECTS_SOURCE_ID, {
      type: "geojson",
      data: collection,
      promoteId: "objectId",
    });
  } else {
    const source = map.getSource(MAPLIBRE_OBJECTS_SOURCE_ID) as GeoJSONSource;
    source.setData(collection);
  }

  if (!map.getLayer(MAPLIBRE_OBJECTS_HALO_LAYER_ID)) {
    const halo: CircleLayerSpecification = {
      id: MAPLIBRE_OBJECTS_HALO_LAYER_ID,
      type: "circle",
      source: MAPLIBRE_OBJECTS_SOURCE_ID,
      minzoom: 12,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12,
          8,
          14,
          12,
          16,
          18,
          18,
          22,
        ],
        "circle-color": ["get", "color"],
        "circle-opacity": hidden
          ? 0
          : [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              0.12,
              14,
              0.18,
              16,
              0.22,
            ],
        "circle-blur": 0.85,
      },
      metadata: { lifeMapObjects: true },
    };
    map.addLayer(halo);
  }

  if (!map.getLayer(MAPLIBRE_OBJECTS_LAYER_ID)) {
    const layer: CircleLayerSpecification = {
      id: MAPLIBRE_OBJECTS_LAYER_ID,
      type: "circle",
      source: MAPLIBRE_OBJECTS_SOURCE_ID,
      minzoom: 12,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12,
          3.5,
          14,
          5.5,
          16,
          8.5,
          17.5,
          11,
          19,
          13,
        ],
        "circle-color": ["get", "color"],
        "circle-opacity": hidden
          ? 0
          : [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              0.72,
              14,
              0.85,
              16,
              0.95,
            ],
        "circle-stroke-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12,
          1.2,
          16,
          2.4,
          18,
          3,
        ],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": hidden ? 0 : 0.95,
        "circle-blur": 0.05,
      },
      metadata: { lifeMapObjects: true },
    };
    map.addLayer(layer);
  } else {
    try {
      map.setPaintProperty(
        MAPLIBRE_OBJECTS_LAYER_ID,
        "circle-opacity",
        hidden ? 0 : 0.92,
      );
      map.setPaintProperty(
        MAPLIBRE_OBJECTS_LAYER_ID,
        "circle-stroke-opacity",
        hidden ? 0 : 0.95,
      );
      if (map.getLayer(MAPLIBRE_OBJECTS_HALO_LAYER_ID)) {
        map.setPaintProperty(
          MAPLIBRE_OBJECTS_HALO_LAYER_ID,
          "circle-opacity",
          hidden ? 0 : 0.18,
        );
      }
    } catch {
      // ignore
    }
  }

  if (showPlaceLabels) {
    if (!map.getLayer(MAPLIBRE_OBJECTS_LABEL_LAYER_ID)) {
      const labels: SymbolLayerSpecification = {
        id: MAPLIBRE_OBJECTS_LABEL_LAYER_ID,
        type: "symbol",
        source: MAPLIBRE_OBJECTS_SOURCE_ID,
        minzoom: 15.5,
        layout: {
          "text-field": ["get", "label"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15.5,
            11,
            17,
            14,
            19,
            16,
          ],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.25],
          "text-anchor": "top",
          "text-max-width": 10,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#1a1814",
          "text-halo-color": "rgba(255,250,242,0.94)",
          "text-halo-width": 1.8,
          "text-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15.5,
            0.0,
            16,
            0.95,
          ],
        },
        metadata: { lifeMapObjects: true },
      };
      map.addLayer(labels);
    }
  } else if (map.getLayer(MAPLIBRE_OBJECTS_LABEL_LAYER_ID)) {
    map.removeLayer(MAPLIBRE_OBJECTS_LABEL_LAYER_ID);
  }

  return bindings;
}
