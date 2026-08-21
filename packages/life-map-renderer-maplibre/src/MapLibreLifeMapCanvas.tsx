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
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { useEffect, useRef, type CSSProperties } from "react";

import { createMapLibreLifeMapRenderer } from "./create-maplibre-renderer";
import {
  shouldShowGrounded3dAccents,
} from "./commercial-lod";
import {
  computeVolumePresence,
  detectLifeMapRenderQuality,
  LIFE_MAP_PREMIUM_CAMERA,
  lifeMapPixelRatioForQuality,
  MAPLIBRE_TECHNICAL_PREVIEW_STYLE,
  resolveLifeMapBasemapStyle,
} from "./premium-style";
import { MAPLIBRE_OBJECTS_LAYER_ID, MAPLIBRE_OBJECTS_CLUSTER_LAYER_ID, MAPLIBRE_OBJECTS_SOURCE_ID } from "./object-frontier";
import {
  MAPLIBRE_TERRITORY_INTERACTIVE_LAYER_IDS,
  type TerritoryFabricGeoJson,
} from "./territory-frontier";

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
  /** Territory amenity polygons (golf, lakes, greens). */
  territoryAmenities?: TerritoryFabricGeoJson | null;
  /** Territory landmark points (gate, clubhouse, parking…). */
  territoryPoints?: TerritoryFabricGeoJson | null;
};

/** First frame: territory camera — never spawn on a single object. */
function resolveFocusCenter(
  scene: LifeMapScene,
  map: MapLibreMap,
): { lat: number; lng: number } {
  const focus = scene.camera.pose;
  if (
    typeof (focus.target as { lng?: number }).lng === "number" &&
    typeof (focus.target as { lat?: number }).lat === "number"
  ) {
    return {
      lng: (focus.target as { lng: number }).lng,
      lat: (focus.target as { lat: number }).lat,
    };
  }
  const center = map.getCenter();
  return { lng: center.lng, lat: center.lat };
}

function existingMapLayers(map: MapLibreMap, ids: readonly string[]): string[] {
  return ids.filter((id) => Boolean(map.getLayer(id)));
}

/** Tap Location pins, clusters, or territory fabric. Returns true when handled. */
function handleLifeMapPointer(
  map: MapLibreMap,
  event: MapMouseEvent,
  onSelect?: (objectId: string | null) => void,
): boolean {
  const clusterLayers = existingMapLayers(map, [MAPLIBRE_OBJECTS_CLUSTER_LAYER_ID]);
  if (clusterLayers.length > 0) {
    const clusters = map.queryRenderedFeatures(event.point, {
      layers: clusterLayers,
    });
    const clusterId = clusters[0]?.properties?.cluster_id;
    if (typeof clusterId === "number") {
      const source = map.getSource(MAPLIBRE_OBJECTS_SOURCE_ID) as
        | GeoJSONSource
        | undefined;
      const geometry = clusters[0]?.geometry;
      if (!source) return true;
      const expand = (
        source as GeoJSONSource & {
          getClusterExpansionZoom: (
            id: number,
            cb?: (err?: Error | null, zoom?: number) => void,
          ) => unknown;
        }
      ).getClusterExpansionZoom;
      const applyZoom = (zoom: number) => {
        if (geometry?.type !== "Point") return;
        const [lng, lat] = geometry.coordinates as [number, number];
        map.easeTo({ center: [lng, lat], zoom });
      };
      const maybePromise = expand.call(
        source,
        clusterId,
        (error, zoom) => {
          if (error || zoom == null) return;
          applyZoom(zoom);
        },
      );
      if (
        maybePromise &&
        typeof (maybePromise as Promise<number>).then === "function"
      ) {
        void (maybePromise as Promise<number>).then(applyZoom);
      }
      return true;
    }
  }

  const objectLayers = existingMapLayers(map, [MAPLIBRE_OBJECTS_LAYER_ID]);
  if (objectLayers.length > 0) {
    const hits = map.queryRenderedFeatures(event.point, { layers: objectLayers });
    const objectId = hits[0]?.properties?.objectId as string | undefined;
    if (objectId) {
      onSelect?.(objectId);
      return true;
    }
  }

  const territoryLayers = existingMapLayers(map, [
    ...MAPLIBRE_TERRITORY_INTERACTIVE_LAYER_IDS,
  ]);
  if (territoryLayers.length > 0) {
    const hits = map.queryRenderedFeatures(event.point, {
      layers: territoryLayers,
    });
    const objectId = hits[0]?.properties?.objectId as string | undefined;
    if (objectId) {
      onSelect?.(objectId);
      return true;
    }
  }

  return false;
}

function runCommercialEntrance(
  map: MapLibreMap,
  focusCenter: { lat: number; lng: number },
  focusBearing: number,
): number {
  const cam = LIFE_MAP_PREMIUM_CAMERA;
  // Stage A — territory overview
  map.jumpTo({
    center: focusCenter,
    zoom: cam.territoryOverviewZoom,
    pitch: cam.territoryOverviewPitch,
    bearing: focusBearing + cam.entranceStartBearingOffset,
  });
  // Stage B — community
  map.easeTo({
    center: focusCenter,
    zoom: cam.communityFocusZoom,
    pitch: cam.communityFocusPitch,
    bearing: focusBearing,
    duration: cam.communityFocusDurationMs,
    essential: true,
  });
  // Stage C — social living zone
  return window.setTimeout(() => {
    try {
      if (!map.getContainer()) return;
    } catch {
      return;
    }
    map.easeTo({
      center: focusCenter,
      zoom: cam.socialZoneZoom,
      pitch: cam.socialZonePitch,
      bearing: focusBearing,
      duration: cam.socialZoneDurationMs,
      essential: true,
    });
  }, cam.communityFocusDurationMs + 80);
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
  territoryAmenities = null,
  territoryPoints = null,
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
      // Commercial lock: real map dominates — never mute territory for toys.
      softenBuildingFills: false,
      softenEnvironmentFills: false,
      enablePremiumInteraction: true,
      hideObjectCircles: false,
      deferInitialCamera: cinematicEntrance,
      ...(territoryDataResolver ? { territoryDataResolver } : {}),
      ...(territoryAmenities ? { territoryAmenities } : {}),
      ...(territoryPoints ? { territoryPoints } : {}),
    });
    rendererRef.current = renderer;
    renderer.mount({ element: host });
    renderer.setScene(sceneRef.current);

    let cancelled = false;
    let detachMapListeners: (() => void) | null = null;
    let entranceTimer: number | undefined;

    const waitForMap = (map: MapLibreMap) =>
      new Promise<void>((resolve) => {
        if (map.loaded()) resolve();
        else map.once("load", () => resolve());
      });

    const startCommercialEntrance = async () => {
      if (!cinematicEntrance || cancelled) return;
      const map = renderer.getMap();
      if (!map) return;
      await waitForMap(map);
      if (cancelled) return;
      const focus = sceneRef.current.camera.pose;
      const focusCenter = resolveFocusCenter(sceneRef.current, map);
      const focusBearing =
        focus.headingDegrees ?? LIFE_MAP_PREMIUM_CAMERA.communityFocusBearing;
      entranceTimer = runCommercialEntrance(map, focusCenter, focusBearing);
    };

    void startCommercialEntrance();

    const setupHybrid = async () => {
      if (!hybrid3DOverlay || cancelled) return;
      const map = renderer.getMap();
      const overlayHost = overlayRef.current;
      if (!map || !overlayHost) return;

      await waitForMap(map);
      if (cancelled) return;

      // Cinematic entrance owns camera — hybrid only syncs optional accents.
      if (!cinematicEntrance) {
        const focus = sceneRef.current.camera.pose;
        const focusCenter = resolveFocusCenter(sceneRef.current, map);
        map.jumpTo({
          center: focusCenter,
          zoom: LIFE_MAP_PREMIUM_CAMERA.socialZoneZoom,
          pitch:
            focus.pitchDegrees ?? LIFE_MAP_PREMIUM_CAMERA.hybridPitchDegrees,
          bearing:
            focus.headingDegrees ?? LIFE_MAP_PREMIUM_CAMERA.communityFocusBearing,
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

      // Keep snapshot for telemetry; MapLibre fill-extrusion owns building mass.
      envSnapshotRef.current = { buildings, water, green };

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
        // Commercial lock: MapLibre pins own places — no procedural toys.
        showSpatialObjects: false,
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
      map.getCanvas().style.opacity = "1";
      map.getCanvas().style.filter = "";

      const pushSpatialForZoom = (zoom: number) => {
        const show3d = shouldShowGrounded3dAccents(zoom);
        layer3d.setInput({
          // MapLibre owns city fabric — never reintroduce Three building toys.
          buildings: [],
          water: [],
          green: [],
          spatialObjects: show3d ? [...spatialRef.current] : [],
          scene: currentScene,
          camera: currentScene.camera,
        });
      };

      pushSpatialForZoom(map.getZoom());
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
        pushSpatialForZoom(view.zoom);
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
        if (handleLifeMapPointer(map, event, onSelectRef.current)) {
          return;
        }
        const { ndcX, ndcY } = eventToNdc(map, event);
        const hit = layer3d.pickAt(ndcX, ndcY);
        const nextId = hit?.id ?? null;
        const current = layer3d.getSelected();
        const resolved = nextId && nextId === current ? null : nextId;
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
          handleLifeMapPointer(map, event, onSelectRef.current);
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
      if (entranceTimer !== undefined) window.clearTimeout(entranceTimer);
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
    rendererRef.current?.setTerritoryFrontier({
      amenities: territoryAmenities,
      points: territoryPoints,
    });
  }, [territoryAmenities, territoryPoints]);

  // Keep optional 3D accents in sync — never fight the commercial camera.
  useEffect(() => {
    const layer = layer3dRef.current;
    const map = rendererRef.current?.getMap();
    const env = envSnapshotRef.current;
    if (!layer || !env) return;
    const zoom = map?.getZoom() ?? 0;
    layer.setInput({
      buildings: [],
      water: [],
      green: [],
      spatialObjects: shouldShowGrounded3dAccents(zoom)
        ? [...spatialObjects]
        : [],
      scene,
      camera: scene.camera,
    });
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
