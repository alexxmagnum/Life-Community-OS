/**
 * Life OS object frontier for MapLibre.
 *
 * Soft geo presence + readable labels — not classic pins.
 * Local anchors without geo are skipped until projected by the host.
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
export const MAPLIBRE_OBJECTS_LABEL_LAYER_ID = "lm-life-os-objects-label";

/**
 * Planned object binding — hook for marker / symbol / custom layer.
 */
export type MapLibreObjectBinding = {
  objectId: string;
  layerId: string;
  sourceId: string;
  productLayerId: string;
  type: LifeMapRenderableObject["type"];
  /** Opaque asset key if present — not loaded. */
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
      return "#6b8f94";
    case "service":
      return "#9a8458";
    case "resource":
      return "#5f8a6e";
    case "community":
    case "experience":
      return "#7a6b8f";
    case "official":
      return "#8a7a68";
    case "housing":
    case "decoration":
      return "#8a7d6a";
    default:
      return "#7a7870";
  }
}

/**
 * Sync Life OS objects onto MapLibre as soft territorial markers + labels.
 * Geo positions only — host must project local→geo before renderable sync if needed.
 */
export function syncMapLibreObjectFrontier(
  objects: readonly LifeMapRenderableObject[],
  map?: MapLibreMap | null,
): MapLibreObjectBinding[] {
  const bindings = objects.map(planMapLibreObjectBinding);

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

  if (!map.getLayer(MAPLIBRE_OBJECTS_LAYER_ID)) {
    const layer: CircleLayerSpecification = {
      id: MAPLIBRE_OBJECTS_LAYER_ID,
      type: "circle",
      source: MAPLIBRE_OBJECTS_SOURCE_ID,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13,
          6,
          15.5,
          11,
        ],
        "circle-color": ["get", "color"],
        "circle-opacity": 0.78,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#f7f3ea",
        "circle-stroke-opacity": 0.95,
      },
      metadata: { lifeMapObjects: true },
    };
    map.addLayer(layer);
  }

  if (!map.getLayer(MAPLIBRE_OBJECTS_LABEL_LAYER_ID)) {
    const labels: SymbolLayerSpecification = {
      id: MAPLIBRE_OBJECTS_LABEL_LAYER_ID,
      type: "symbol",
      source: MAPLIBRE_OBJECTS_SOURCE_ID,
      layout: {
        "text-field": ["get", "label"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13,
          11,
          15.5,
          13,
        ],
        "text-offset": [0, 1.15],
        "text-anchor": "top",
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-max-width": 10,
        "text-allow-overlap": false,
        "text-optional": true,
      },
      paint: {
        "text-color": "#3d3a34",
        "text-halo-color": "rgba(247, 243, 234, 0.92)",
        "text-halo-width": 1.4,
        "text-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13.2,
          0,
          13.8,
          0.95,
        ],
      },
      metadata: { lifeMapObjects: true },
    };
    map.addLayer(labels);
  }

  return bindings;
}
