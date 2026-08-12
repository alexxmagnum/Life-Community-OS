/**
 * Three.js implementation of LifeMapRenderer (experimental prototype).
 * Mounts a WebGL canvas into a host element. No map SDK. No GLB loading.
 */

import {
  applyLifeMapCameraUpdate,
  type CreateLifeMapRendererOptions,
  type LifeMapCameraUpdate,
  type LifeMapObjectRenderOp,
  type LifeMapRenderableObject,
  type LifeMapRenderer,
  type LifeMapRendererCamera,
  type LifeMapRendererHost,
  type LifeMapScene,
} from "@life-community-os/life-map-renderer";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import { applyLifeMapCameraToThree } from "./camera-adapter";
import { THREE_LIFE_MAP_PALETTE as P } from "./palette";
import {
  clearThreeLifeMapObjects,
  ensureTerritoryGround,
  syncThreeSceneFromLifeMap,
} from "./scene-adapter";

function resolveHostElement(host: LifeMapRendererHost): HTMLElement {
  if (host.element instanceof HTMLElement) {
    return host.element;
  }
  if (host.elementId) {
    const el = document.getElementById(host.elementId);
    if (!el) {
      throw new Error(
        `[life-map-renderer-three] Host element #${host.elementId} not found`,
      );
    }
    return el;
  }
  throw new Error(
    "[life-map-renderer-three] mount() requires host.element or host.elementId",
  );
}

/**
 * Create an experimental Three.js Life Map renderer.
 * Implements the shared LifeMapRenderer contract.
 */
export function createThreeLifeMapRenderer(
  options: CreateLifeMapRendererOptions = {},
): LifeMapRenderer {
  let hostEl: HTMLElement | null = null;
  let renderer: WebGLRenderer | null = null;
  let threeScene: Scene | null = null;
  let perspective: PerspectiveCamera | null = null;
  let raf = 0;
  let resizeObserver: ResizeObserver | null = null;

  let scene: LifeMapScene | null = null;
  let camera: LifeMapRendererCamera | null = null;
  let objects = new Map<string, LifeMapRenderableObject>();

  const info = {
    id: options.id ?? "life-map.three",
    label: "Three.js Life Map Renderer (experimental)",
    capabilities: {
      supportsLocalAnchors: true,
      supportsGeoPositions: true,
      supportsAssetKeys: true,
      supportsLayerVisibility: true,
      supportsRealtimeRender: true,
    },
  } as const;

  function rebuildSceneGraph(): void {
    if (!threeScene || !scene) return;
    syncThreeSceneFromLifeMap(threeScene, scene);
  }

  function applyCamera(): void {
    if (!perspective || !camera) return;
    applyLifeMapCameraToThree(perspective, camera);
  }

  function resize(): void {
    if (!hostEl || !renderer || !perspective) return;
    const w = Math.max(hostEl.clientWidth, 1);
    const h = Math.max(hostEl.clientHeight, 1);
    renderer.setSize(w, h, false);
    perspective.aspect = w / h;
    perspective.updateProjectionMatrix();
  }

  function frame(): void {
    if (!renderer || !threeScene || !perspective) return;
    renderer.render(threeScene, perspective);
    raf = requestAnimationFrame(frame);
  }

  function stopLoop(): void {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function tearDownGl(): void {
    stopLoop();
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
      renderer = null;
    }
    if (threeScene) {
      clearThreeLifeMapObjects(threeScene);
      threeScene.clear();
      threeScene = null;
    }
    perspective = null;
    hostEl = null;
  }

  return {
    info,

    mount(host) {
      tearDownGl();
      hostEl = resolveHostElement(host);
      hostEl.style.position = hostEl.style.position || "relative";
      hostEl.style.overflow = "hidden";

      threeScene = new Scene();
      threeScene.background = new Color(P.background);
      threeScene.fog = new Fog(P.fog, 40, 160);

      perspective = new PerspectiveCamera(42, 1, 0.1, 500);
      ensureTerritoryGround(threeScene);

      const ambient = new AmbientLight(P.ambient, 0.42);
      const hemi = new HemisphereLight(P.keyLight, P.ground, 0.35);
      const key = new DirectionalLight(P.keyLight, 1.05);
      key.position.set(18, 28, 12);
      key.castShadow = true;
      const fill = new DirectionalLight(P.fillLight, 0.35);
      fill.position.set(-14, 10, -8);
      const rim = new DirectionalLight(P.rimLight, 0.28);
      rim.position.set(-6, 8, 20);
      threeScene.add(ambient, hemi, key, fill, rim);

      renderer = new WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      hostEl.appendChild(renderer.domElement);

      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(hostEl);
      resize();

      if (scene) {
        rebuildSceneGraph();
        applyCamera();
      }
      frame();
    },

    unmount() {
      tearDownGl();
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
      rebuildSceneGraph();
      applyCamera();
    },

    getScene() {
      return scene;
    },

    setCamera(next) {
      camera = {
        pose: { ...next.pose },
        frame: next.frame ? { ...next.frame } : undefined,
      };
      if (scene) scene = { ...scene, camera };
      applyCamera();
    },

    updateCamera(update: LifeMapCameraUpdate) {
      if (!camera) return;
      camera = applyLifeMapCameraUpdate(camera, update);
      if (scene) scene = { ...scene, camera };
      applyCamera();
    },

    getCamera() {
      return camera;
    },

    applyObjectOp(op: LifeMapObjectRenderOp) {
      if (op.kind === "clear") {
        objects.clear();
      } else if (op.kind === "remove") {
        objects.delete(op.objectId);
      } else {
        objects.set(op.object.objectId, op.object);
      }
      if (scene) {
        scene = { ...scene, objects: [...objects.values()] };
        rebuildSceneGraph();
      }
    },

    listObjects() {
      return [...objects.values()];
    },

    dispose() {
      tearDownGl();
      scene = null;
      camera = null;
      objects.clear();
    },
  };
}

/** Alias matching product naming. */
export const ThreeLifeMapRenderer = {
  create: createThreeLifeMapRenderer,
};
