"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import {
  bridgeLifeMapObjectsToSpatial,
  buildLifeMapScene,
} from "@life-community-os/life-map-renderer";
import type { TerritoryDataResolver } from "@life-community-os/types";
import type { LifeMapObject, LifeMapTerritory } from "@life-community-os/types";
import { createWebLifeMapAssetResolver } from "@/lib/life-map-asset-resolver";
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
  previewUnlocked?: boolean;
  engine?: LifeMapDevEngine;
  territoryDataResolver?: TerritoryDataResolver;
  selectedObjectId?: string | null;
  onObjectSelect?: (objectId: string | null) => void;
};

function territoryGeoOrigin(territory: LifeMapTerritory) {
  const bounds = territory.bounds;
  if (!bounds) return null;
  return {
    lat: (bounds.south + bounds.north) / 2,
    lng: (bounds.west + bounds.east) / 2,
  };
}

/**
 * Spatial viewport — territory → scene → MapLibre premium (+ optional Three world).
 */
export function LifeMapViewport({
  territory,
  objects,
  previewUnlocked = false,
  engine: engineProp,
  territoryDataResolver,
  selectedObjectId = null,
  onObjectSelect,
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

  const spatialObjects = useMemo(() => {
    const origin = territoryGeoOrigin(territory);
    return bridgeLifeMapObjectsToSpatial(objects, origin).map((o) => ({
      id: o.id,
      position: o.position,
      asset3DKey: o.asset3DKey,
      interactionType: o.interactionType,
      category: o.category,
      objectType: o.type,
      availableActions: o.availableActions,
      label: o.label,
    }));
  }, [objects, territory]);

  const assetResolver = useMemo(
    () => createWebLifeMapAssetResolver(territory.tenantId),
    [territory.tenantId],
  );

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
          spatialObjects={spatialObjects}
          selectedObjectId={selectedObjectId}
          onObjectSelect={onObjectSelect}
          assetResolver={assetResolver}
          cinematicEntrance={hybrid3D}
          className="absolute inset-0"
          style={{ minHeight: "100%", height: "100%" }}
        />
      ) : (
        <ThreeLifeMapCanvas
          scene={scene}
          className="absolute inset-0"
          style={{ minHeight: "100%", height: "100%" }}
          onObjectOpen={
            onObjectSelect
              ? (event) => onObjectSelect(event.object.objectId)
              : undefined
          }
        />
      )}

      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[85%] rounded-md border border-black/10 bg-[rgba(255,255,255,0.82)] px-2.5 py-1.5 text-[11px] leading-snug text-[var(--color-text-secondary)] shadow-sm backdrop-blur-sm">
        <p className="font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
          Life Map
          {hybrid3D ? " · twin 3D" : ""}
          {hasRoads || hasBuildings ? " · tu comunidad" : " · preview"}
        </p>
        <p className="mt-0.5">
          {hasRoads && hasBuildings
            ? hybrid3D
              ? "Entra en tu comunidad. Toca un lugar vivo para abrirlo."
              : "Territorio real + objetos Life OS."
            : hasRoads
              ? "Capa territorial real: caminos OSM."
              : "Preview técnico del renderer."}
        </p>
      </div>
    </section>
  );
}
