"use client";

/**
 * React MapLibre Life Map canvas — premium territory + optional Three world.
 */

import type { LifeMapScene } from "@life-community-os/life-map-renderer";
import {
  emitLifeMapTelemetry,
  lifeMapCacheKey,
} from "@life-community-os/life-map-renderer";
import {
  buildingFeaturesFromGeoJson,
  createThreeLifeMap3DLayer,
  greenFeaturesFromGeoJson,
  waterFeaturesFromGeoJson,
  type LifeMap3DAssetResolver,
  type LifeMap3DEnvironmentFeature,
  type LifeMap3DLayer,
  type LifeMap3DSpatialObject,
} from "@life-community-os/life-map-renderer-3d-layer";
import type { TerritoryDataResolver } from "@life-community-os/types";
import {
  isTerritoryGeoJsonPayload,
  resolveLifeMapBaseLayers,
} from "@life-community-os/types";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { useEffect, useRef, type CSSProperties } from "react";

import { createMapLibreLifeMapRenderer } from "./create-maplibre-renderer";
import {
  computeSpatialPitchDegrees,
  computeVolumePresence,
  detectLifeMapRenderQuality,
  LIFE_MAP_PREMIUM_CAMERA,
  LIFE_MAP_PREMIUM_PALETTE,
  LIFE_MAP_PREMIUM_STYLE,
  lifeMapPixelRatioForQuality,
  MAPLIBRE_TECHNICAL_PREVIEW_STYLE,
} from "./premium-style";
import { MAPLIBRE_OBJECTS_LAYER_ID } from "./object-frontier";

/** @deprecated Prefer premium local style; kept for debug demotiles toggle. */
export { MAPLIBRE_TECHNICAL_PREVIEW_STYLE };

export type MapLibreLifeMapCanvasProps = {
  scene: LifeMapScene;
  className?: string;
  style?: CSSProperties;
  technicalBasemap?: boolean;
  territoryDataResolver?: TerritoryDataResolver;
  hybrid3DOverlay?: boolean;
  /** Bridged Life OS spatial objects (geo). */
  spatialObjects?: readonly LifeMap3DSpatialObject[];
  selectedObjectId?: string | null;
  onObjectSelect?: (objectId: string | null) => void;
  /** asset3DKey resolver — registry or procedural. */
  assetResolver?: LifeMap3DAssetResolver;
  /** Run cinematic entrance into the territory (hybrid). Default true. */
  cinematicEntrance?: boolean;
  /** Opaque pack version for cache / telemetry. */
  dataVersion?: string;
};

function readMapLibreView(map: MapLibreMap) {
  const center = map.getCenter();
  return {
    center: { lng: center.lng, lat: center.lat },
    zoom: map.getZoom(),
    pitchDegrees: map.getPitch(),
    bearingDegrees: map.getBearing(),
    viewportHeightPx: map.getCanvas().clientHeight,
  };
}

function eventToNdc(map: MapLibreMap, event: MapMouseEvent) {
  const canvas = map.getCanvas();
  const w = Math.max(canvas.clientWidth, 1);
  const h = Math.max(canvas.clientHeight, 1);
  return {
    ndcX: (event.point.x / w) * 2 - 1,
    ndcY: -((event.point.y / h) * 2) + 1,
  };
}

/**
 * Mounts {@link createMapLibreLifeMapRenderer} into a DOM host.
 * Interactive pan / zoom / pitch come from MapLibre defaults.
 */
export function MapLibreLifeMapCanvas({
  scene,
  className,
  style,
  technicalBasemap = false,
  territoryDataResolver,
  hybrid3DOverlay = false,
  spatialObjects = [],
  selectedObjectId = null,
  onObjectSelect,
  assetResolver,
  cinematicEntrance = true,
  dataVersion = "v1",
}: MapLibreLifeMapCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<ReturnType<
    typeof createMapLibreLifeMapRenderer
  > | null>(null);
  const layer3dRef = useRef<LifeMap3DLayer | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const spatialRef = useRef(spatialObjects);
  spatialRef.current = spatialObjects;
  const onSelectRef = useRef(onObjectSelect);
  onSelectRef.current = onObjectSelect;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const quality = detectLifeMapRenderQuality();

    const renderer = createMapLibreLifeMapRenderer({
      id: "life-map.maplibre.preview",
      style: technicalBasemap
        ? MAPLIBRE_TECHNICAL_PREVIEW_STYLE
        : LIFE_MAP_PREMIUM_STYLE,
      softenBuildingFills: hybrid3DOverlay,
      softenEnvironmentFills: hybrid3DOverlay,
      enablePremiumInteraction: !hybrid3DOverlay,
      ...(territoryDataResolver ? { territoryDataResolver } : {}),
    });
    rendererRef.current = renderer;
    renderer.mount({ element: host });
    renderer.setScene(sceneRef.current);

    let cancelled = false;
    let detachMapListeners: (() => void) | null = null;
    let pitchEaseTimer: ReturnType<typeof setTimeout> | null = null;

    const setupHybrid = async () => {
      if (!hybrid3DOverlay || cancelled) return;
      const map = renderer.getMap();
      const overlayHost = overlayRef.current;
      if (!map || !overlayHost) return;

      const waitForMap = () =>
        new Promise<void>((resolve) => {
          if (map.loaded()) resolve();
          else map.once("load", () => resolve());
        });

      await waitForMap();
      if (cancelled) return;

      // Cinematic entrance — arrive into the community (not "open map").
      const openPitch = LIFE_MAP_PREMIUM_CAMERA.hybridPitchDegrees;
      if (cinematicEntrance) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bearing = map.getBearing();
        map.jumpTo({
          center,
          zoom: Math.max(3, zoom - LIFE_MAP_PREMIUM_CAMERA.entranceStartZoomDelta),
          pitch: LIFE_MAP_PREMIUM_CAMERA.entranceStartPitch,
          bearing:
            bearing + LIFE_MAP_PREMIUM_CAMERA.entranceStartBearingOffset,
        });
        map.easeTo({
          center,
          zoom,
          pitch: openPitch,
          bearing,
          duration: LIFE_MAP_PREMIUM_CAMERA.entranceDurationMs,
          essential: true,
        });
      } else if (map.getPitch() < openPitch - 2) {
        map.easeTo({
          pitch: openPitch,
          duration: LIFE_MAP_PREMIUM_CAMERA.hybridPitchDurationMs,
          essential: true,
        });
      }

      const currentScene = sceneRef.current;
      const wantedTypes = new Set(["buildings", "water", "green"]);
      const envLayers = (currentScene.baseLayers ?? []).filter((layer) =>
        wantedTypes.has(layer.type),
      );

      let buildings = buildingFeaturesFromGeoJson({
        type: "FeatureCollection",
        features: [],
      });
      let water: LifeMap3DEnvironmentFeature[] = [];
      let green: LifeMap3DEnvironmentFeature[] = [];

      if (envLayers.length > 0 && territoryDataResolver) {
        const resolved = await resolveLifeMapBaseLayers(
          envLayers,
          territoryDataResolver,
          {
            tenantId: currentScene.tenantId,
            territoryId: currentScene.territoryId,
          },
        );
        if (cancelled) return;
        for (const item of resolved) {
          if (!item.payload || !isTerritoryGeoJsonPayload(item.payload)) {
            continue;
          }
          const geojson = item.payload.geojson;
          if (item.layer.type === "buildings") {
            buildings = [
              ...buildings,
              ...buildingFeaturesFromGeoJson(geojson),
            ];
          } else if (item.layer.type === "water") {
            water = [...water, ...waterFeaturesFromGeoJson(geojson)];
          } else if (item.layer.type === "green") {
            green = [...green, ...greenFeaturesFromGeoJson(geojson)];
          }
        }
      }

      const cacheHint = {
        territoryId: currentScene.territoryId,
        version: dataVersion,
      };

      const layer3d = createThreeLifeMap3DLayer({
        id: "life-map.3d-layer.hybrid-world",
        selectable: true,
        quality,
        pixelRatio: lifeMapPixelRatioForQuality(quality),
        showTerrain: true,
        showEnvironment: true,
        showSpatialObjects: true,
        ...(assetResolver ? { assetResolver } : {}),
        buildingMaterial: {
          color: LIFE_MAP_PREMIUM_PALETTE.buildings,
          selectedColor: LIFE_MAP_PREMIUM_PALETTE.buildingsSelected,
          hoverColor: LIFE_MAP_PREMIUM_PALETTE.buildingsHover,
          opacity: 0.94,
        },
      });
      layer3dRef.current = layer3d;
      layer3d.mount({ element: overlayHost });

      // Progressive load: volumes first, then environment pads.
      layer3d.setInput({
        buildings,
        water: [],
        green: [],
        spatialObjects: [...spatialRef.current],
        scene: currentScene,
        camera: currentScene.camera,
      });
      emitLifeMapTelemetry({
        type: "life_map.layer_loaded",
        tenantId: currentScene.tenantId,
        layer: "buildings",
        featureCount: buildings.length,
        cacheKey: lifeMapCacheKey(cacheHint, "buildings"),
      });

      if (!cancelled && (water.length > 0 || green.length > 0)) {
        layer3d.setInput({
          buildings,
          water,
          green,
          spatialObjects: [...spatialRef.current],
          scene: currentScene,
          camera: currentScene.camera,
        });
        emitLifeMapTelemetry({
          type: "life_map.layer_loaded",
          tenantId: currentScene.tenantId,
          layer: "environment",
          featureCount: water.length + green.length,
          cacheKey: lifeMapCacheKey(cacheHint, "environment"),
        });
      }
      layer3d.syncMapLibreView?.(readMapLibreView(map));
      layer3d.setVolumePresence?.(
        computeVolumePresence(map.getZoom(), map.getPitch()),
      );
      if (selectedObjectId) {
        layer3d.setSelected(selectedObjectId);
      }

      const syncSpatialCamera = () => {
        const view = readMapLibreView(map);
        layer3d.syncMapLibreView?.(view);
        layer3d.setVolumePresence?.(
          computeVolumePresence(view.zoom, view.pitchDegrees),
        );

        // Fluid 2D→3D: pitch eases toward zoom-dependent spatial target.
        const targetPitch = computeSpatialPitchDegrees(view.zoom);
        if (Math.abs(view.pitchDegrees - targetPitch) > 2.5) {
          if (pitchEaseTimer) clearTimeout(pitchEaseTimer);
          pitchEaseTimer = setTimeout(() => {
            if (cancelled) return;
            map.easeTo({
              pitch: targetPitch,
              duration: quality === "mobile" ? 420 : 650,
              essential: true,
            });
          }, quality === "mobile" ? 120 : 80);
        }
      };

      const onMove = () => {
        const view = readMapLibreView(map);
        layer3d.syncMapLibreView?.(view);
        layer3d.setVolumePresence?.(
          computeVolumePresence(view.zoom, view.pitchDegrees),
        );
      };

      const onZoomEnd = () => {
        syncSpatialCamera();
      };

      const onMouseMove = (event: MapMouseEvent) => {
        if (
          typeof window !== "undefined" &&
          window.matchMedia("(pointer: coarse)").matches
        ) {
          return;
        }
        const { ndcX, ndcY } = eventToNdc(map, event);
        const hit = layer3d.pickAt(ndcX, ndcY);
        layer3d.setHovered?.(hit?.id ?? null);
        map.getCanvas().style.cursor = hit ? "pointer" : "";
      };

      const onMouseLeave = () => {
        layer3d.setHovered?.(null);
        map.getCanvas().style.cursor = "";
      };

      const onClick = (event: MapMouseEvent) => {
        // Prefer Life OS object circles on the territorial map.
        const objectHits = map.queryRenderedFeatures(event.point, {
          layers: map.getLayer(MAPLIBRE_OBJECTS_LAYER_ID)
            ? [MAPLIBRE_OBJECTS_LAYER_ID]
            : [],
        });
        const objectId =
          (objectHits[0]?.properties?.objectId as string | undefined) ?? null;
        if (objectId) {
          layer3d.setSelected(objectId);
          onSelectRef.current?.(objectId);
          return;
        }

        const { ndcX, ndcY } = eventToNdc(map, event);
        const hit = layer3d.pickAt(ndcX, ndcY);
        const nextId = hit?.id ?? null;
        const current = layer3d.getSelected();
        const resolved =
          nextId && nextId === current ? null : nextId;
        layer3d.setSelected(resolved);
        onSelectRef.current?.(resolved);
      };

      map.on("move", onMove);
      map.on("zoomend", onZoomEnd);
      map.on("mousemove", onMouseMove);
      map.on("mouseout", onMouseLeave);
      map.on("click", onClick);
      detachMapListeners = () => {
        map.off("move", onMove);
        map.off("zoomend", onZoomEnd);
        map.off("mousemove", onMouseMove);
        map.off("mouseout", onMouseLeave);
        map.off("click", onClick);
        map.getCanvas().style.cursor = "";
        if (pitchEaseTimer) clearTimeout(pitchEaseTimer);
      };
    };

    void setupHybrid();

    // Non-hybrid: Life OS object taps on territorial map.
    let detachObjectClick: (() => void) | null = null;
    if (!hybrid3DOverlay) {
      const map = renderer.getMap();
      if (map) {
        const onObjectClick = (event: MapMouseEvent) => {
          if (!map.getLayer(MAPLIBRE_OBJECTS_LAYER_ID)) return;
          const hits = map.queryRenderedFeatures(event.point, {
            layers: [MAPLIBRE_OBJECTS_LAYER_ID],
          });
          const objectId =
            (hits[0]?.properties?.objectId as string | undefined) ?? null;
          onSelectRef.current?.(objectId);
        };
        const wait = () => {
          if (map.loaded()) {
            map.on("click", onObjectClick);
            detachObjectClick = () => map.off("click", onObjectClick);
          } else {
            map.once("load", () => {
              map.on("click", onObjectClick);
              detachObjectClick = () => map.off("click", onObjectClick);
            });
          }
        };
        wait();
      }
    }

    return () => {
      cancelled = true;
      detachMapListeners?.();
      detachObjectClick?.();
      layer3dRef.current?.dispose();
      layer3dRef.current = null;
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [technicalBasemap, territoryDataResolver, hybrid3DOverlay, assetResolver, cinematicEntrance, dataVersion]);

  useEffect(() => {
    rendererRef.current?.setScene(scene);
  }, [scene]);

  useEffect(() => {
    layer3dRef.current?.setSelected(selectedObjectId ?? null);
  }, [selectedObjectId]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "inherit",
        ...style,
      }}
      data-life-map-engine="maplibre"
      data-life-map-preview={
        hybrid3DOverlay ? "premium-hybrid-3d-world" : "premium-territory"
      }
      data-life-map-hybrid-3d={hybrid3DOverlay ? "1" : "0"}
    >
      <div
        ref={hostRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {hybrid3DOverlay ? (
        <div
          ref={overlayRef}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 2,
          }}
          data-life-map-3d-overlay="three"
        />
      ) : null}
    </div>
  );
}
