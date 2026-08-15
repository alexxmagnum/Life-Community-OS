/**
 * @life-community-os/life-map-renderer-maplibre
 *
 * MapLibre adapter for Life Map — implements LifeMapRenderer.
 * Consumes LifeMapScene / LifeMapBaseLayer only.
 * No tenant packs, no OSM fetch, no API keys.
 */

export {
  createMapLibreLifeMapRenderer,
  MapLibreLifeMapRenderer,
  type CreateMapLibreLifeMapRendererOptions,
} from "./create-maplibre-renderer";

export {
  MAPLIBRE_BOUND_BASE_LAYER_TYPES,
  isMapLibreBoundBaseLayerType,
  planMapLibreBaseLayerBinding,
  syncMapLibreBaseLayers,
  syncMapLibreResolvedBaseLayers,
  mapLibreSourceIdForBaseLayer,
  mapLibreLayerIdForBaseLayer,
  type MapLibreBoundBaseLayerType,
  type MapLibreBaseLayerBinding,
  type SyncMapLibreBaseLayersOptions,
} from "./base-layer-binder";

export {
  planMapLibreObjectBinding,
  syncMapLibreObjectFrontier,
  mapLibreObjectSourceId,
  mapLibreObjectLayerId,
  type MapLibreObjectBinding,
} from "./object-frontier";

export {
  applyLifeMapCameraToMapLibre,
  distanceToMapLibreZoom,
} from "./camera-adapter";

export {
  MapLibreLifeMapCanvas,
  MAPLIBRE_TECHNICAL_PREVIEW_STYLE,
  type MapLibreLifeMapCanvasProps,
} from "./MapLibreLifeMapCanvas";
