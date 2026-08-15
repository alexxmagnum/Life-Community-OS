"use client";

/**
 * React MapLibre Life Map canvas — technical renderer preview.
 * Not Panoramica territory data. No invented GeoJSON / buildings.
 */

import type { LifeMapScene } from "@life-community-os/life-map-renderer";
import { useEffect, useRef, type CSSProperties } from "react";

import { createMapLibreLifeMapRenderer } from "./create-maplibre-renderer";

/**
 * Public MapLibre demo style — technical basemap only.
 * Not tenant territory, not Panoramica geometry, not a product SoT.
 */
export const MAPLIBRE_TECHNICAL_PREVIEW_STYLE =
  "https://demotiles.maplibre.org/style.json";

export type MapLibreLifeMapCanvasProps = {
  scene: LifeMapScene;
  className?: string;
  style?: CSSProperties;
  /**
   * When true (dev preview), use MapLibre demotiles as a neutral basemap
   * so pan/zoom are visible. Territory baseLayers stay empty until real dataRef.
   */
  technicalBasemap?: boolean;
};

/**
 * Mounts {@link createMapLibreLifeMapRenderer} into a DOM host.
 * Interactive pan / zoom / pitch come from MapLibre defaults.
 */
export function MapLibreLifeMapCanvas({
  scene,
  className,
  style,
  technicalBasemap = true,
}: MapLibreLifeMapCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<ReturnType<
    typeof createMapLibreLifeMapRenderer
  > | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = createMapLibreLifeMapRenderer({
      id: "life-map.maplibre.preview",
      ...(technicalBasemap
        ? { style: MAPLIBRE_TECHNICAL_PREVIEW_STYLE }
        : {}),
    });
    rendererRef.current = renderer;
    renderer.mount({ element: host });
    renderer.setScene(sceneRef.current);

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [technicalBasemap]);

  useEffect(() => {
    rendererRef.current?.setScene(scene);
  }, [scene]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "inherit",
        ...style,
      }}
      data-life-map-engine="maplibre"
      data-life-map-preview="technical"
    />
  );
}
