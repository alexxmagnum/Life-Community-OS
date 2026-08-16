/**
 * LifeMap3DLayer — hybrid overlay contract.
 *
 * MapLibre (or any 2D territorial renderer) remains the geographic source.
 * This layer only turns territory footprints into volume + selection.
 *
 * No tenants, Housing, UI, GIS APIs, or MapLibre replacement.
 */

import type {
  LifeMapRendererCamera,
  LifeMapScene,
} from "@life-community-os/life-map-renderer";

import type {
  LifeMap3DBuildingFeature,
  LifeMap3DBuildingMaterialHint,
} from "./buildings";
import type { LifeMap3DMapLibreView } from "./maplibre-sync";

export type { LifeMap3DMapLibreView };

/** Opaque host for the WebGL overlay (typically a transparent canvas parent). */
export type LifeMap3DLayerHost = {
  elementId?: string;
  element?: unknown;
};

/**
 * Engine-agnostic descriptor of a mounted 3D object.
 * Concrete engines attach an opaque `handle` (e.g. THREE.Object3D).
 */
export type LifeMap3DRenderableObject = {
  id: string;
  kind: "building-extrusion";
  selectable: boolean;
  selected: boolean;
  heightMeters: number;
  handle?: unknown;
};

export type LifeMap3DLayerInput = {
  /** Building footprints already resolved by the host (e.g. from TerritoryDataResolver). */
  buildings: readonly LifeMap3DBuildingFeature[];
  /** Current Life Map scene (territory frame + product objects — 3D layer may ignore products). */
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
};

export type LifeMap3DLayerInfo = {
  id: string;
  label: string;
  capabilities: {
    supportsBuildingExtrusion: boolean;
    supportsSelection: boolean;
    supportsRealtimeRender: boolean;
  };
};

/**
 * Hybrid 3D overlay — volume and interaction above a territorial map.
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
  /** Soft hover highlight (desktop). Optional on engines without hover. */
  setHovered?(objectId: string | null): void;
  getHovered?(): string | null;
  /**
   * 0..1 volume presence for 2D→3D approach (zoom / pitch driven by host).
   */
  setVolumePresence?(amount: number): void;
  /**
   * Pick by normalized device coordinates in the overlay
   * (x,y in [-1, 1], origin center, y up) — host maps pointer events.
   */
  pickAt(ndcX: number, ndcY: number): LifeMap3DRenderableObject | null;
  /**
   * Sync overlay camera with a live MapLibre view (hybrid mode).
   * Optional — engines without MapLibre bridge may omit.
   */
  syncMapLibreView?(view: LifeMap3DMapLibreView): void;
  dispose(): void;
};
