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
  computeVolumePresence,
  detectLifeMapRenderQuality,
  LIFE_MAP_PREMIUM_CAMERA,
  lifeMapPixelRatioForQuality,
  MAPLIBRE_TECHNICAL_PREVIEW_STYLE,
  resolveLifeMapBasemapStyle,
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
  /** Ease camera to this WGS84 point when selection/focus changes. */
  focusCameraTarget?: { lat: number; lng: number } | null;
};

/** Composition: first frame locks onto IKON (primary place). */
function heroSpatialForFirstFrame(
  objects: readonly LifeMap3DSpatialObject[],
): readonly LifeMap3DSpatialObject[] {
  const ikon =
    objects.find((item) => (item.label ?? "").toLowerCase().includes("ikon")) ??
    objects.find((item) =>
      (item.asset3DKey ?? "").toLowerCase().includes("restaurant"),
    );
  if (ikon) return [ikon];
  const pool = objects.find((item) =>
    (item.asset3DKey ?? "").toLowerCase().includes("pool"),
  );
  if (pool) return [pool];
  return objects.slice(0, 1);
}

function averageSpatialCenter(
  objects: readonly LifeMap3DSpatialObject[],
): { lat: number; lng: number } | null {
  if (objects.length === 0) return null;
  const anchor = objects[0]!;
  return { lat: anchor.position.lat, lng: anchor.position.lng };
}

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
  focusCameraTarget = null,
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
  const focusSkipFirst = useRef(true);
  const envSnapshotRef = useRef<{
    buildings: ReturnType<typeof buildingFeaturesFromGeoJson>;
    water: LifeMap3DEnvironmentFeature[];
    green: LifeMap3DEnvironmentFeature[];
  } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const quality = detectLifeMapRenderQuality();

    const renderer = createMapLibreLifeMapRenderer({
      id: "life-map.maplibre.preview",
      style: technicalBasemap
        ? MAPLIBRE_TECHNICAL_PREVIEW_STYLE
        : resolveLifeMapBasemapStyle(),
      softenBuildingFills: hybrid3DOverlay,
      softenEnvironmentFills: hybrid3DOverlay,
      enablePremiumInteraction: !hybrid3DOverlay,
      hideObjectCircles: hybrid3DOverlay,
      ...(territoryDataResolver ? { territoryDataResolver } : {}),
    });
    rendererRef.current = renderer;
    renderer.mount({ element: host });
    renderer.setScene(sceneRef.current);

    let cancelled = false;
    let detachMapListeners: (() => void) | null = null;

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

      // Prefer Location cluster from scene camera (set by product), not territory bounds.
      const focus = sceneRef.current.camera.pose;
      const spatial = spatialRef.current;
      const openPitch =
        focus.pitchDegrees ?? LIFE_MAP_PREMIUM_CAMERA.hybridPitchDegrees;
      let focusCenter =
        typeof (focus.target as { lng?: number }).lng === "number" &&
        typeof (focus.target as { lat?: number }).lat === "number"
          ? {
              lng: (focus.target as { lng: number }).lng,
              lat: (focus.target as { lat: number }).lat,
            }
          : map.getCenter();
      if (spatial.length > 0) {
        const heroCenter = averageSpatialCenter(heroSpatialForFirstFrame(spatial));
        if (heroCenter) focusCenter = heroCenter;
      }
      const focusZoom = LIFE_MAP_PREMIUM_CAMERA.communityFocusZoom;
      const focusBearing =
        focus.headingDegrees ?? LIFE_MAP_PREMIUM_CAMERA.communityFocusBearing;

      if (cinematicEntrance) {
        map.jumpTo({
          center: focusCenter,
          zoom: Math.max(
            LIFE_MAP_PREMIUM_CAMERA.explorationMinZoom - 0.35,
            focusZoom - LIFE_MAP_PREMIUM_CAMERA.entranceStartZoomDelta,
          ),
          pitch: LIFE_MAP_PREMIUM_CAMERA.entranceStartPitch,
          bearing:
            focusBearing + LIFE_MAP_PREMIUM_CAMERA.entranceStartBearingOffset,
        });
        map.easeTo({
          center: focusCenter,
          zoom: focusZoom,
          pitch: openPitch,
          bearing: focusBearing,
          duration: LIFE_MAP_PREMIUM_CAMERA.entranceDurationMs,
          essential: true,
        });
      } else {
        map.jumpTo({
          center: focusCenter,
          zoom: focusZoom,
          pitch: openPitch,
          bearing: focusBearing,
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

      envSnapshotRef.current = { buildings: [], water: [], green: [] };

      const cacheHint = {
        territoryId: currentScene.territoryId,
        version: dataVersion,
      };

      const layer3d = createThreeLifeMap3DLayer({
        id: "life-map.3d-layer.hybrid-world",
        selectable: true,
        quality,
        pixelRatio: lifeMapPixelRatioForQuality(quality),
        showTerrain: false,
        showEnvironment: false,
        showSpatialObjects: true,
        ...(assetResolver ? { assetResolver } : {}),
        buildingMaterial: {
          color: "#5a564c",
          selectedColor: "#2f9aa0",
          hoverColor: "#6a665c",
          opacity: 0.12,
        },
      });
      layer3dRef.current = layer3d;
      layer3d.mount({ element: overlayHost });
      // Real Earth is the product surface — never mute the basemap.
      map.getCanvas().style.opacity = "1";
      map.getCanvas().style.filter = "";

      // Premium 3D places sit on real coordinates; MapLibre owns the world.
      layer3d.setInput({
        buildings: [],
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
      layer3d.syncMapLibreView?.(readMapLibreView(map));
      layer3d.setVolumePresence?.(
        Math.max(0.92, computeVolumePresence(map.getZoom(), map.getPitch())),
      );
      if (selectedObjectId) {
        layer3d.setSelected(selectedObjectId);
      }

      const onMove = () => {
        const view = readMapLibreView(map);
        layer3d.syncMapLibreView?.(view);
        layer3d.setVolumePresence?.(
          Math.max(0.85, computeVolumePresence(view.zoom, view.pitchDegrees)),
        );
      };

      const onZoomEnd = () => {
        const view = readMapLibreView(map);
        layer3d.syncMapLibreView?.(view);
        layer3d.setVolumePresence?.(
          Math.max(0.85, computeVolumePresence(view.zoom, view.pitchDegrees)),
        );
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

  // Keep 3D place heroes in sync when Locations arrive/change.
  useEffect(() => {
    const layer = layer3dRef.current;
    const map = rendererRef.current?.getMap();
    const env = envSnapshotRef.current;
    if (!layer || !env) return;
    layer.setInput({
      buildings: [],
      water: [],
      green: [],
      spatialObjects: [...spatialObjects],
      scene,
      camera: scene.camera,
    });
    if (map && spatialObjects.length > 0) {
      const heroCenter = averageSpatialCenter(
        heroSpatialForFirstFrame(spatialObjects),
      );
      if (!heroCenter) return;
      map.easeTo({
        center: [heroCenter.lng, heroCenter.lat],
        zoom: LIFE_MAP_PREMIUM_CAMERA.communityFocusZoom,
        pitch:
          scene.camera.pose.pitchDegrees ??
          LIFE_MAP_PREMIUM_CAMERA.hybridPitchDegrees,
        bearing:
          scene.camera.pose.headingDegrees ??
          LIFE_MAP_PREMIUM_CAMERA.communityFocusBearing,
        duration: 900,
        essential: true,
      });
    }
  }, [spatialObjects, scene]);

  useEffect(() => {
    layer3dRef.current?.setSelected(selectedObjectId ?? null);
  }, [selectedObjectId]);

  useEffect(() => {
    if (!focusCameraTarget) return;
    if (focusSkipFirst.current) {
      focusSkipFirst.current = false;
      return;
    }
    const map = rendererRef.current?.getMap();
    if (!map) return;
    map.easeTo({
      center: [focusCameraTarget.lng, focusCameraTarget.lat],
      zoom: Math.max(map.getZoom(), LIFE_MAP_PREMIUM_CAMERA.communityFocusZoom),
      duration: 900,
      essential: true,
    });
  }, [focusCameraTarget]);

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
