/**
 * Territory Digital Twin frontier — Earth landmarks + soft amenity fabric.
 *
 * LOD (real):
 *  far  — amenity fills + territory-grade landmarks
 *  mid  — landmark markers (entrada, garita, parking, clubhouse, residencial…)
 *  near — detail markers (barrera, piscinas, edificios)
 *
 * No permanent labels. Same MapLibre WGS84 as satellite + Location discovery.
 */

import type { LifeMapRenderableObject } from "@life-community-os/life-map-renderer";
import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
} from "maplibre-gl";

import { LIFE_MAP_COMMERCIAL_LOD } from "./commercial-lod";

export const MAPLIBRE_TERRITORY_AMENITY_SOURCE_ID = "lm-territory-amenities";
export const MAPLIBRE_TERRITORY_POINT_SOURCE_ID = "lm-territory-points";
export const MAPLIBRE_TERRITORY_AMENITY_FILL_LAYER_ID =
  "lm-territory-amenities-fill";
export const MAPLIBRE_TERRITORY_AMENITY_LINE_LAYER_ID =
  "lm-territory-amenities-line";
export const MAPLIBRE_TERRITORY_POINT_HALO_LAYER_ID = "lm-territory-points-halo";
export const MAPLIBRE_TERRITORY_POINT_LAYER_ID = "lm-territory-points-circle";
export const MAPLIBRE_TERRITORY_LANDMARK_LAYER_ID =
  "lm-territory-points-landmark";
export const MAPLIBRE_TERRITORY_DETAIL_LAYER_ID = "lm-territory-points-detail";
/** @deprecated Labels removed from Earth experience. */
export const MAPLIBRE_TERRITORY_LABEL_LAYER_ID = "lm-territory-points-label";

export type TerritoryFabricGeoJson = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id?: string | number;
    properties?: Record<string, unknown>;
    geometry: {
      type: "Polygon" | "Point" | "MultiPolygon";
      coordinates: unknown;
    };
  }>;
};

export type SyncMapLibreTerritoryFrontierOptions = {
  amenities?: TerritoryFabricGeoJson | null;
  points?: TerritoryFabricGeoJson | null;
};

function isGeoPosition(
  position: LifeMapRenderableObject["position"],
): position is { lat: number; lng: number } {
  return (
    typeof (position as { lat?: unknown }).lat === "number" &&
    typeof (position as { lng?: unknown }).lng === "number"
  );
}

function colorForAmenityKind(kind: unknown): string {
  switch (String(kind)) {
    case "golf":
      return "#7cbc5a";
    case "green":
      return "#6aa850";
    case "lake":
      return "#3f8fb8";
    case "pool":
      return "#4eb4d4";
    case "parking":
      return "#b0a898";
    case "sports":
      return "#5aa878";
    default:
      return "#6fa85a";
  }
}

function colorForTerritoryKind(kind: unknown): string {
  switch (String(kind)) {
    case "main_access":
    case "barrier":
      return "#e8d8c0";
    case "security_booth":
      return "#d8d0c4";
    case "main_parking":
      return "#c8c4bc";
    case "clubhouse":
      return "#f0d8b0";
    case "community_pool":
    case "pool":
      return "#90d8f0";
    case "sports_courts":
      return "#a8e0b8";
    case "golf":
      return "#b8e090";
    case "lake":
      return "#88c8e0";
    case "green":
      return "#a8d890";
    case "residential":
      return "#f0e4d0";
    default:
      return "#d0e0c8";
  }
}

function pointsFromTerritoryObjects(
  objects: readonly LifeMapRenderableObject[],
): TerritoryFabricGeoJson {
  const features = objects
    .filter((o) => String(o.layerId) === "territory" && isGeoPosition(o.position))
    .map((o) => {
      const pos = o.position as { lat: number; lng: number };
      return {
        type: "Feature" as const,
        id: o.objectId,
        properties: {
          objectId: o.objectId,
          label: o.label ?? "",
          kind: "territory",
          lod: "landmark",
          color: colorForTerritoryKind("territory"),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [pos.lng, pos.lat],
        },
      };
    });
  return { type: "FeatureCollection", features };
}

function enrichAmenityColors(
  amenities: TerritoryFabricGeoJson,
): TerritoryFabricGeoJson {
  return {
    type: "FeatureCollection",
    features: amenities.features.map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        color: colorForAmenityKind(feature.properties?.kind),
      },
    })),
  };
}

function enrichPointColors(
  points: TerritoryFabricGeoJson,
): TerritoryFabricGeoJson {
  return {
    type: "FeatureCollection",
    features: points.features.map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        color: colorForTerritoryKind(feature.properties?.kind),
      },
    })),
  };
}

function setOrCreateSource(
  map: MapLibreMap,
  sourceId: string,
  data: TerritoryFabricGeoJson,
) {
  const payload = data as unknown as Parameters<GeoJSONSource["setData"]>[0];
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: payload,
      promoteId: sourceId.includes("point") ? "objectId" : "amenityId",
    });
  } else {
    (map.getSource(sourceId) as GeoJSONSource).setData(payload);
  }
}

function ensurePointLayer(
  map: MapLibreMap,
  layerId: string,
  lod: "territory" | "landmark" | "detail",
  minzoom: number,
) {
  if (map.getLayer(layerId)) return;
  const layer: CircleLayerSpecification = {
    id: layerId,
    type: "circle",
    source: MAPLIBRE_TERRITORY_POINT_SOURCE_ID,
    minzoom,
    filter: ["==", ["get", "lod"], lod],
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        minzoom,
        lod === "territory" ? 5 : lod === "landmark" ? 4.5 : 3.5,
        17,
        lod === "territory" ? 8 : 6.5,
        19,
        9,
      ],
      "circle-color": ["coalesce", ["get", "color"], "#d0e0c8"],
      "circle-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        minzoom,
        0.65,
        17,
        0.88,
      ],
      "circle-stroke-width": 1.8,
      "circle-stroke-color": "rgba(20,24,20,0.45)",
      "circle-stroke-opacity": 0.75,
    },
    metadata: { lifeMapTerritory: true, lod },
  };
  map.addLayer(layer);
}

/**
 * Sync territory amenity fills + LOD markers. No permanent labels.
 */
export function syncMapLibreTerritoryFrontier(
  objects: readonly LifeMapRenderableObject[],
  map?: MapLibreMap | null,
  options?: SyncMapLibreTerritoryFrontierOptions,
): void {
  if (!map || !map.getStyle()) return;

  const amenities = options?.amenities
    ? enrichAmenityColors(options.amenities)
    : { type: "FeatureCollection" as const, features: [] };
  const points = enrichPointColors(
    options?.points ?? pointsFromTerritoryObjects(objects),
  );

  setOrCreateSource(map, MAPLIBRE_TERRITORY_AMENITY_SOURCE_ID, amenities);
  setOrCreateSource(map, MAPLIBRE_TERRITORY_POINT_SOURCE_ID, points);

  // Kill any leftover permanent labels from earlier builds.
  if (map.getLayer(MAPLIBRE_TERRITORY_LABEL_LAYER_ID)) {
    map.removeLayer(MAPLIBRE_TERRITORY_LABEL_LAYER_ID);
  }
  if (map.getLayer(MAPLIBRE_TERRITORY_POINT_LAYER_ID)) {
    map.removeLayer(MAPLIBRE_TERRITORY_POINT_LAYER_ID);
  }
  if (map.getLayer(MAPLIBRE_TERRITORY_POINT_HALO_LAYER_ID)) {
    map.removeLayer(MAPLIBRE_TERRITORY_POINT_HALO_LAYER_ID);
  }

  if (!map.getLayer(MAPLIBRE_TERRITORY_AMENITY_FILL_LAYER_ID)) {
    const fill: FillLayerSpecification = {
      id: MAPLIBRE_TERRITORY_AMENITY_FILL_LAYER_ID,
      type: "fill",
      source: MAPLIBRE_TERRITORY_AMENITY_SOURCE_ID,
      minzoom: LIFE_MAP_COMMERCIAL_LOD.territoryFabricMinZoom,
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#6fa85a"],
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12.4,
          0.62,
          14.5,
          0.72,
          16.5,
          0.48,
          18,
          0.28,
        ],
      },
      metadata: { lifeMapTerritory: true },
    };
    map.addLayer(fill);
  }

  if (!map.getLayer(MAPLIBRE_TERRITORY_AMENITY_LINE_LAYER_ID)) {
    map.addLayer({
      id: MAPLIBRE_TERRITORY_AMENITY_LINE_LAYER_ID,
      type: "line",
      source: MAPLIBRE_TERRITORY_AMENITY_SOURCE_ID,
      minzoom: LIFE_MAP_COMMERCIAL_LOD.territoryFabricMinZoom,
      paint: {
        "line-color": "rgba(255,252,245,0.55)",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13,
          0.6,
          16,
          1.3,
        ],
        "line-opacity": 0.55,
      },
      metadata: { lifeMapTerritory: true },
    });
  }

  ensurePointLayer(
    map,
    "lm-territory-points-overview",
    "territory",
    LIFE_MAP_COMMERCIAL_LOD.territoryFabricMinZoom,
  );
  ensurePointLayer(
    map,
    MAPLIBRE_TERRITORY_LANDMARK_LAYER_ID,
    "landmark",
    LIFE_MAP_COMMERCIAL_LOD.landmarkMinZoom,
  );
  ensurePointLayer(
    map,
    MAPLIBRE_TERRITORY_DETAIL_LAYER_ID,
    "detail",
    LIFE_MAP_COMMERCIAL_LOD.detailMinZoom,
  );
}

export const MAPLIBRE_TERRITORY_INTERACTIVE_LAYER_IDS = [
  "lm-territory-points-overview",
  MAPLIBRE_TERRITORY_LANDMARK_LAYER_ID,
  MAPLIBRE_TERRITORY_DETAIL_LAYER_ID,
] as const;
