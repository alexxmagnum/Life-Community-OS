"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { buildLifeMapScene } from "@life-community-os/life-map-renderer";
import type { TerritoryDataResolver } from "@life-community-os/types";
import type { LifeMapObject, LifeMapTerritory } from "@life-community-os/types";
import {
  getLifeMapDevEngine,
  isLifeMapHybrid3DPreviewEnabled,
  type LifeMapDevEngine,
} from "@/lib/life-map-dev";
import "maplibre-gl/dist/maplibre-gl.css";

const MapLibreLifeMapCanvas = dynamic(
  () =>
    import("@life-community-os/life-map-renderer-maplibre").then(
      (mod) => mod.MapLibreLifeMapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full min-h-[inherit] items-center justify-center text-[14px] text-[var(--color-text-tertiary)]"
        style={{ background: "#e8e4d8" }}
      >
        Entrando en tu comunidad…
      </div>
    ),
  },
);

const ThreeLifeMapCanvas = dynamic(
  () =>
    import("@life-community-os/life-map-renderer-three").then(
      (mod) => mod.ThreeLifeMapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full min-h-[inherit] items-center justify-center text-[14px] text-[var(--color-text-tertiary)]"
        style={{ background: "#070B0E" }}
      >
        Preparando superficie espacial…
      </div>
    ),
  },
);

export type LifeMapViewportProps = {
  territory: LifeMapTerritory;
  objects: readonly LifeMapObject[];
  /** When true, force moduleEnabled for local preview without flipping product flags. */
  previewUnlocked?: boolean;
  /** Override engine; defaults to `getLifeMapDevEngine()`. */
  engine?: LifeMapDevEngine;
  /** Tenant-injected territory data resolver (roads GeoJSON, …). */
  territoryDataResolver?: TerritoryDataResolver;
};

/**
 * Spatial viewport — territory → scene → MapLibre premium (default) or Three.
 */
export function LifeMapViewport({
  territory,
  objects,
  previewUnlocked = false,
  engine: engineProp,
  territoryDataResolver,
}: LifeMapViewportProps) {
  const engine = engineProp ?? getLifeMapDevEngine();
  const hybrid3D =
    engine === "maplibre" &&
    previewUnlocked &&
    isLifeMapHybrid3DPreviewEnabled();
  const hasRoads = (territory.baseLayers ?? []).some((l) => l.type === "roads");
  const hasBuildings = (territory.baseLayers ?? []).some(
    (l) => l.type === "buildings",
  );

  const scene = useMemo(() => {
    const frame: LifeMapTerritory = previewUnlocked
      ? { ...territory, moduleEnabled: true }
      : territory;
    return buildLifeMapScene({
      territory: frame,
      objects: [...objects],
    });
  }, [territory, objects, previewUnlocked]);

  return (
    <section
      aria-label="Superficie espacial Life Map"
      className="relative mt-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]"
      style={{ minHeight: "min(62vh, 520px)", height: "min(62vh, 520px)" }}
    >
      {engine === "maplibre" ? (
        <MapLibreLifeMapCanvas
          scene={scene}
          territoryDataResolver={territoryDataResolver}
          hybrid3DOverlay={hybrid3D}
          className="absolute inset-0"
          style={{ minHeight: "100%", height: "100%" }}
        />
      ) : (
        <ThreeLifeMapCanvas
          scene={scene}
          className="absolute inset-0"
          style={{ minHeight: "100%", height: "100%" }}
        />
      )}

      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[85%] rounded-md border border-black/10 bg-[rgba(255,255,255,0.82)] px-2.5 py-1.5 text-[11px] leading-snug text-[var(--color-text-secondary)] shadow-sm backdrop-blur-sm">
        <p className="font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
          Life Map
          {hybrid3D ? " · volumen" : ""}
          {hasRoads || hasBuildings ? " · tu comunidad" : " · preview"}
        </p>
        <p className="mt-0.5">
          {hasRoads && hasBuildings
            ? hybrid3D
              ? "Acerca el mapa: el volumen y el ambiente 3D cobran presencia."
              : "Territorio real: caminos, agua, verde y edificios."
            : hasRoads
              ? "Capa territorial real: caminos OSM."
              : "Preview técnico del renderer."}
        </p>
      </div>
    </section>
  );
}
