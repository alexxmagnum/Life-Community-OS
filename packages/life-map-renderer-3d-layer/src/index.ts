/**
 * @life-community-os/life-map-renderer-3d-layer
 *
 * Hybrid 3D world: MapLibre stays territorial SoT;
 * this package adds terrain foundation, building volume, environment,
 * atmosphere, LOD, and spatial-object markers via Three.js.
 *
 * No tenants, Housing, UI, GIS APIs, or MapLibre replacement.
 * No invented DEM heights.
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
  LifeMap3DBuildingHeightSource,
  LifeMap3DBuildingHeightResult,
} from "./building-height";
export {
  LIFE_MAP_3D_VISUAL_FALLBACK_HEIGHT_METERS,
  buildingHeightFromProperties,
  resolveBuildingHeight,
} from "./building-height";

export type {
  LifeMap3DEnvironmentKind,
  LifeMap3DEnvironmentFeature,
} from "./environment";
export { LIFE_MAP_3D_VEGETATION } from "./environment";

export { buildingFeaturesFromGeoJson } from "./geojson-buildings";

export {
  waterFeaturesFromGeoJson,
  greenFeaturesFromGeoJson,
} from "./geojson-environment";

export type {
  LifeMap3DLodLevel,
  LifeMap3DLodPolicy,
} from "./lod";
export {
  LIFE_MAP_3D_DEFAULT_LOD_POLICY,
  LIFE_MAP_3D_MOBILE_LOD_POLICY,
  resolveLifeMap3DLod,
  horizontalDistanceMeters,
} from "./lod";

export type {
  LifeMap3DElevationSourceKind,
  LifeMap3DElevationSource,
  LifeMap3DTerrainBoundsMeters,
} from "./terrain";
export {
  createFlatElevationSource,
  createPreparedDemElevationSource,
  terrainBoundsFromCamera,
} from "./terrain";

export type {
  LifeMap3DSpatialInteractionType,
  LifeMap3DSpatialObject,
} from "./spatial-object";
export { spatialObjectsFromSceneObjects } from "./spatial-object";

export type {
  LifeMap3DLayerHost,
  LifeMap3DRenderableKind,
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

export type {
  LifeMap3DAssetVisualKind,
  LifeMap3DAssetResolveResult,
  LifeMap3DAssetResolver,
} from "./asset-visual";
export {
  inferLifeMap3DAssetVisualKind,
  createProceduralLifeMap3DAssetResolver,
  resolveLifeMap3DAssetVisual,
  isLifeMapGltfModelPath,
} from "./asset-visual";

export {
  applyMapLibreViewToPerspective,
  type LifeMap3DMapLibreView,
} from "./maplibre-sync";

export { createThreeLifeMap3DLayer } from "./three/create-three-3d-layer";
export { shouldBindGltfToMarker, loadLifeMapGltfModel, clearLifeMapGltfCache } from "./three/gltf-asset";
