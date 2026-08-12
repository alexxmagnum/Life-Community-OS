/**
 * Life Map renderer — replaceable engine boundary.
 *
 * Implementations may later use WebGL, canvas, or a map vendor.
 * This package only defines the contract + a null prototype.
 */

import type { LifeMapCameraUpdate, LifeMapRendererCamera } from "./camera";
import { applyLifeMapCameraUpdate } from "./camera";
import type { LifeMapObjectRenderOp, LifeMapRenderableObject } from "./object";
import type { LifeMapScene } from "./scene";

/** Opaque host element — DOM in web apps; never required to be a canvas yet. */
export type LifeMapRendererHost = {
  /** CSS selector or element id when mounting into the document. */
  elementId?: string;
  /** Direct element reference when available (browser). */
  element?: unknown;
};

export type LifeMapRendererCapabilities = {
  supportsLocalAnchors: boolean;
  supportsGeoPositions: boolean;
  supportsAssetKeys: boolean;
  supportsLayerVisibility: boolean;
  /** True only when a real mesh/map engine is wired. */
  supportsRealtimeRender: boolean;
};

export type LifeMapRendererInfo = {
  id: string;
  /** Human label for diagnostics — not UI copy. */
  label: string;
  capabilities: LifeMapRendererCapabilities;
};

/**
 * Replaceable spatial renderer.
 * Product shells call this; engines implement it.
 */
export type LifeMapRenderer = {
  readonly info: LifeMapRendererInfo;
  mount(host: LifeMapRendererHost): void;
  unmount(): void;
  setScene(scene: LifeMapScene): void;
  getScene(): LifeMapScene | null;
  setCamera(camera: LifeMapRendererCamera): void;
  updateCamera(update: LifeMapCameraUpdate): void;
  getCamera(): LifeMapRendererCamera | null;
  applyObjectOp(op: LifeMapObjectRenderOp): void;
  listObjects(): readonly LifeMapRenderableObject[];
  dispose(): void;
};

export type CreateLifeMapRendererOptions = {
  /** Override renderer id for diagnostics. */
  id?: string;
};

const NULL_CAPABILITIES: LifeMapRendererCapabilities = {
  supportsLocalAnchors: true,
  supportsGeoPositions: true,
  supportsAssetKeys: true,
  supportsLayerVisibility: true,
  supportsRealtimeRender: false,
};

/**
 * Null / prototype renderer — holds scene state, draws nothing.
 * Use until a real engine is selected and integrated.
 */
export function createNullLifeMapRenderer(
  options: CreateLifeMapRendererOptions = {},
): LifeMapRenderer {
  let scene: LifeMapScene | null = null;
  let camera: LifeMapRendererCamera | null = null;
  let objects = new Map<string, LifeMapRenderableObject>();
  let mounted = false;

  const info: LifeMapRendererInfo = {
    id: options.id ?? "life-map.null",
    label: "Null Life Map Renderer (prototype frontier)",
    capabilities: NULL_CAPABILITIES,
  };

  return {
    info,

    mount(_host) {
      mounted = true;
    },

    unmount() {
      mounted = false;
    },

    setScene(next) {
      scene = {
        ...next,
        layers: [...next.layers],
        objects: [...next.objects],
        camera: {
          pose: { ...next.camera.pose },
          frame: next.camera.frame ? { ...next.camera.frame } : undefined,
        },
      };
      camera = scene.camera;
      objects = new Map(next.objects.map((o) => [o.objectId, o]));
      void mounted;
    },

    getScene() {
      return scene;
    },

    setCamera(next) {
      camera = {
        pose: { ...next.pose },
        frame: next.frame ? { ...next.frame } : undefined,
      };
      if (scene) {
        scene = { ...scene, camera };
      }
    },

    updateCamera(update) {
      if (!camera) return;
      camera = applyLifeMapCameraUpdate(camera, update);
      if (scene) {
        scene = { ...scene, camera };
      }
    },

    getCamera() {
      return camera;
    },

    applyObjectOp(op) {
      if (op.kind === "clear") {
        objects.clear();
      } else if (op.kind === "remove") {
        objects.delete(op.objectId);
      } else {
        objects.set(op.object.objectId, op.object);
      }
      if (scene) {
        scene = { ...scene, objects: [...objects.values()] };
      }
    },

    listObjects() {
      return [...objects.values()];
    },

    dispose() {
      mounted = false;
      scene = null;
      camera = null;
      objects.clear();
    },
  };
}
