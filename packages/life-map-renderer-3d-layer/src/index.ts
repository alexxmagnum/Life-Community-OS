/**
 * @life-community-os/life-map-renderer-3d-layer
 *
 * Hybrid 3D overlay: territorial map (MapLibre) stays 2D source of truth;
 * this package adds building extrusion + selection via Three.js.
 *
 * No tenants, Housing, UI, GIS APIs, or MapLibre replacement.
 */

export type {
  LifeMap3DFootprintRing,
  LifeMap3DBuildingFeature,
  LifeMap3DBuildingMaterialHint,
} from "./buildings";
export {
  LIFE_MAP_3D_DEFAULT_BUILDING_HEIGHT_METERS,
  LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL,
} from "./buildings";

export type {
  LifeMap3DLayerHost,
  LifeMap3DRenderableObject,
  LifeMap3DLayerInput,
  LifeMap3DLayerOptions,
  LifeMap3DLayerInfo,
  LifeMap3DLayer,
} from "./contract";

export type {
  LifeMap3DLocalPoint,
  LifeMap3DProjectionOrigin,
} from "./projection";
export {
  resolveProjectionOrigin,
  lngLatToLocalMeters,
} from "./projection";

export { buildingFeaturesFromGeoJson } from "./geojson-buildings";

export {
  applyMapLibreViewToPerspective,
  type LifeMap3DMapLibreView,
} from "./maplibre-sync";

export { createThreeLifeMap3DLayer } from "./three/create-three-3d-layer";
