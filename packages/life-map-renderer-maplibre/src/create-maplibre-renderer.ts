/**
 * MapLibre implementation of LifeMapRenderer.
 *
 * Territorial foundation: empty style + base-layer binder + camera.
 * Optional TerritoryDataResolver injects resolved GeoJSON into sources.
 * No OSM fetch, no API keys, no tenant pack imports.
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
import type {
  ResolvedLifeMapBaseLayer,
  TerritoryDataResolver,
} from "@life-community-os/types";
import {
  createNullTerritoryDataResolver,
  resolveLifeMapBaseLayers,
} from "@life-community-os/types";
import {
  Map as MapLibreMap,
  type StyleSpecification,
} from "maplibre-gl";

import {
  type MapLibreBaseLayerBinding,
  syncMapLibreBaseLayers,
} from "./base-layer-binder";
import { applyLifeMapCameraToMapLibre } from "./camera-adapter";
import {
  type MapLibreObjectBinding,
  syncMapLibreObjectFrontier,
} from "./object-frontier";

/** Minimal style — no external basemap tiles, no OSM connection. */
const EMPTY_MAP_STYLE = {
  version: 8 as const,
  name: "life-map-empty",
  sources: {},
  layers: [
    {
      id: "lm-background",
      type: "background" as const,
      paint: {
        "background-color": "#e7e5e4",
      },
    },
  ],
};

function resolveHostElement(host: LifeMapRendererHost): HTMLElement {
  if (host.element instanceof HTMLElement) {
    return host.element;
  }
  if (host.elementId) {
    const el = document.getElementById(host.elementId);
    if (!el) {
      throw new Error(
        `[life-map-renderer-maplibre] Host element #${host.elementId} not found`,
      );
    }
    return el;
  }
  throw new Error(
    "[life-map-renderer-maplibre] mount() requires host.element or host.elementId",
  );
}

export type CreateMapLibreLifeMapRendererOptions = CreateLifeMapRendererOptions & {
  /**
   * Optional MapLibre style override.
   * Default is an empty local style (no remote tiles).
   */
  style?: StyleSpecification | string;
  /**
   * Injectable territory data resolver (`dataRef` → payload).
   * Defaults to null resolver (empty layers until wired).
   */
  territoryDataResolver?: TerritoryDataResolver;
};

/**
 * Create a MapLibre Life Map renderer implementing {@link LifeMapRenderer}.
 */
export function createMapLibreLifeMapRenderer(
  options: CreateMapLibreLifeMapRendererOptions = {},
): LifeMapRenderer {
  let hostEl: HTMLElement | null = null;
  let map: MapLibreMap | null = null;
  let resizeObserver: ResizeObserver | null = null;

  let scene: LifeMapScene | null = null;
  let camera: LifeMapRendererCamera | null = null;
  let objects = new Map<string, LifeMapRenderableObject>();

  let baseBindings: MapLibreBaseLayerBinding[] = [];
  let objectBindings: MapLibreObjectBinding[] = [];
  let lastResolved: ResolvedLifeMapBaseLayer[] = [];
  let syncGeneration = 0;

  const resolver =
    options.territoryDataResolver ?? createNullTerritoryDataResolver();

  const info = {
    id: options.id ?? "life-map.maplibre",
    label: "MapLibre Life Map Renderer",
    capabilities: {
      supportsLocalAnchors: true,
      supportsGeoPositions: true,
      supportsAssetKeys: true,
      supportsLayerVisibility: true,
      supportsRealtimeRender: true,
      supportsBaseLayers: true,
      supportsTerrain: false,
      supportsGeoProjection: true,
    },
  } as const;

  async function syncEngine(): Promise<void> {
    if (!map || !scene) return;
    const generation = ++syncGeneration;
    const currentMap = map;
    const currentScene = scene;

    const run = async () => {
      if (!currentMap || generation !== syncGeneration) return;

      const layers = currentScene.baseLayers ?? [];
      lastResolved = layers.length
        ? await resolveLifeMapBaseLayers(layers, resolver, {
            tenantId: currentScene.tenantId,
            territoryId: currentScene.territoryId,
          })
        : [];

      if (!map || generation !== syncGeneration || map !== currentMap) return;

      baseBindings = syncMapLibreBaseLayers(map, currentScene.baseLayers, {
        resolvedLayers: lastResolved,
      });
      objectBindings = syncMapLibreObjectFrontier([...objects.values()]);
      if (camera) {
        applyLifeMapCameraToMapLibre(map, camera);
      }
    };

    if (currentMap.loaded()) {
      await run();
    } else {
      await new Promise<void>((resolve) => {
        currentMap.once("load", () => {
          void run().finally(resolve);
        });
      });
    }
  }

  function tearDownMap(): void {
    syncGeneration += 1;
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (map) {
      map.remove();
      map = null;
    }
    hostEl = null;
    baseBindings = [];
    objectBindings = [];
    lastResolved = [];
  }

  return {
    info,

    mount(host) {
      tearDownMap();
      hostEl = resolveHostElement(host);
      hostEl.style.position = hostEl.style.position || "relative";
      hostEl.style.overflow = "hidden";

      map = new MapLibreMap({
        container: hostEl,
        style: options.style ?? EMPTY_MAP_STYLE,
        center: [0, 0],
        zoom: 2,
        attributionControl: false,
        interactive: true,
      });

      resizeObserver = new ResizeObserver(() => {
        map?.resize();
      });
      resizeObserver.observe(hostEl);

      if (scene) {
        void syncEngine();
      }
    },

    unmount() {
      tearDownMap();
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
        ...(next.baseLayers ? { baseLayers: [...next.baseLayers] } : {}),
        ...(next.crs ? { crs: next.crs } : {}),
      };
      camera = scene.camera;
      objects = new Map(next.objects.map((o) => [o.objectId, o]));
      void syncEngine();
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
      if (map && camera) {
        applyLifeMapCameraToMapLibre(map, camera);
      }
    },

    updateCamera(update: LifeMapCameraUpdate) {
      if (!camera) return;
      camera = applyLifeMapCameraUpdate(camera, update);
      if (scene) scene = { ...scene, camera };
      if (map) {
        applyLifeMapCameraToMapLibre(map, camera);
      }
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
        objectBindings = syncMapLibreObjectFrontier([...objects.values()]);
      }
    },

    listObjects() {
      return [...objects.values()];
    },

    dispose() {
      tearDownMap();
      scene = null;
      camera = null;
      objects.clear();
    },
  };
}

/** Alias matching product naming. */
export const MapLibreLifeMapRenderer = {
  create: createMapLibreLifeMapRenderer,
};
