/**
 * LifeMap3DLayer — hybrid overlay contract.
 *
 * MapLibre remains the geographic source of truth.
 * This layer owns volume, materials, atmosphere, and 3D interaction.
 *
 * No tenants, Housing, UI, GIS APIs, or MapLibre replacement.
 * No Core Territory contract changes.
 */

import type {
  LifeMapRendererCamera,
  LifeMapScene,
} from "@life-community-os/life-map-renderer";

import type {
  LifeMap3DBuildingFeature,
  LifeMap3DBuildingMaterialHint,
} from "./buildings";
import type { LifeMap3DEnvironmentFeature } from "./environment";
import type { LifeMap3DMapLibreView } from "./maplibre-sync";
import type { LifeMap3DSpatialObject } from "./spatial-object";
import type { LifeMap3DElevationSource } from "./terrain";

export type { LifeMap3DMapLibreView };

/** Opaque host for the WebGL overlay (typically a transparent canvas parent). */
export type LifeMap3DLayerHost = {
  elementId?: string;
  element?: unknown;
};

export type LifeMap3DRenderableKind =
  | "building-extrusion"
  | "water-pad"
  | "green-pad"
  | "vegetation"
  | "terrain"
  | "spatial-marker";

/**
 * Engine-agnostic descriptor of a mounted 3D object.
 */
export type LifeMap3DRenderableObject = {
  id: string;
  kind: LifeMap3DRenderableKind;
  selectable: boolean;
  selected: boolean;
  heightMeters?: number;
  handle?: unknown;
};

export type LifeMap3DLayerInput = {
  /** Building footprints already resolved by the host. */
  buildings: readonly LifeMap3DBuildingFeature[];
  /** Optional water polygons for 3D depth cue. */
  water?: readonly LifeMap3DEnvironmentFeature[];
  /** Optional green polygons for pads + sparse vegetation. */
  green?: readonly LifeMap3DEnvironmentFeature[];
  /** Future LifeMapObject entry — markers only in Phase 3. */
  spatialObjects?: readonly LifeMap3DSpatialObject[];
  /** Current Life Map scene (territory frame + product objects). */
  scene: LifeMapScene;
  /** Camera / frame used for geo→local projection. */
  camera: LifeMapRendererCamera;
};

export type LifeMap3DLayerOptions = {
  id?: string;
  defaultBuildingHeightMeters?: number;
  buildingMaterial?: LifeMap3DBuildingMaterialHint;
  /**
   * When true, meshes are raycast-selectable via {@link LifeMap3DLayer.pickAt}.
   * Default true.
   */
  selectable?: boolean;
  /** Mobile vs desktop WebGL budget. Default desktop. */
  quality?: "mobile" | "desktop";
  /** Override DPR clamp (quality still applies a max). */
  pixelRatio?: number;
  /**
   * Elevation source. Default: flat (never invent DEM).
   */
  elevationSource?: LifeMap3DElevationSource;
  /** Soften terrain plane under volume. Default true. */
  showTerrain?: boolean;
  /** Environment pads + sparse vegetation. Default true. */
  showEnvironment?: boolean;
  /** Spatial object markers. Default true when input has objects. */
  showSpatialObjects?: boolean;
};

export type LifeMap3DLayerInfo = {
  id: string;
  label: string;
  capabilities: {
    supportsBuildingExtrusion: boolean;
    supportsSelection: boolean;
    supportsRealtimeRender: boolean;
    supportsTerrain: boolean;
    supportsEnvironment: boolean;
    supportsSpatialObjects: boolean;
    supportsLod: boolean;
  };
};

/**
 * Hybrid 3D overlay — volume, environment, and interaction above a territorial map.
 */
export type LifeMap3DLayer = {
  readonly info: LifeMap3DLayerInfo;
  mount(host: LifeMap3DLayerHost): void;
  unmount(): void;
  setInput(input: LifeMap3DLayerInput): void;
  setCamera(camera: LifeMapRendererCamera): void;
  getRenderables(): readonly LifeMap3DRenderableObject[];
  setSelected(objectId: string | null): void;
  getSelected(): string | null;
  setHovered?(objectId: string | null): void;
  getHovered?(): string | null;
  setVolumePresence?(amount: number): void;
  pickAt(ndcX: number, ndcY: number): LifeMap3DRenderableObject | null;
  syncMapLibreView?(view: LifeMap3DMapLibreView): void;
  dispose(): void;
};
