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
  type MapLibreLifeMapRendererHandle,
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
  MAPLIBRE_OBJECTS_SOURCE_ID,
  MAPLIBRE_OBJECTS_LAYER_ID,
  MAPLIBRE_OBJECTS_LABEL_LAYER_ID,
  type MapLibreObjectBinding,
} from "./object-frontier";

export {
  applyLifeMapCameraToMapLibre,
  distanceToMapLibreZoom,
  type ApplyLifeMapCameraOptions,
} from "./camera-adapter";

export {
  MapLibreLifeMapCanvas,
  type MapLibreLifeMapCanvasProps,
} from "./MapLibreLifeMapCanvas";

export {
  attachLifeMapPremiumInteraction,
  type LifeMapInteractionHandle,
} from "./map-interaction";

export {
  LIFE_MAP_PREMIUM_STYLE,
  LIFE_MAP_EARTH_STYLE,
  resolveLifeMapBasemapStyle,
  LIFE_MAP_PREMIUM_PALETTE,
  LIFE_MAP_PREMIUM_TERRAIN,
  LIFE_MAP_PREMIUM_CAMERA,
  MAPLIBRE_TECHNICAL_PREVIEW_STYLE,
  detectLifeMapRenderQuality,
  lifeMapPixelRatioForQuality,
  computeVolumePresence,
  computeSpatialPitchDegrees,
  premiumPaintForBaseType,
  type LifeMapRenderQuality,
  type LifeMapPremiumBaseLayerType,
} from "./premium-style";
