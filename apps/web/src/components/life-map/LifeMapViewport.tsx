"use client";

/**
 * Spatial viewport — territory → MapLibre premium + hybrid Three world.
 * Customer demo surface: immersive community, not technical preview chrome.
 */

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
        className="flex h-full min-h-[inherit] items-center justify-center text-[14px] text-[var(--color-text-secondary)]"
        style={{
          background:
            "linear-gradient(160deg, #ebe4d4 0%, #d9e0d2 48%, #c9d6d8 100%)",
        }}
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
        Preparando la experiencia…
      </div>
    ),
  },
);

export type LifeMapViewportProps = {
  territory: LifeMapTerritory;
  objects: readonly LifeMapObject[];
  /** Unlock when tenant feature is on or local demo gate is set. */
  previewUnlocked?: boolean;
  engine?: LifeMapDevEngine;
  territoryDataResolver?: TerritoryDataResolver;
  selectedObjectId?: string | null;
  onObjectSelect?: (objectId: string | null) => void;
  dataVersion?: string;
  territoryName?: string;
};

function territoryGeoOrigin(territory: LifeMapTerritory) {
  const bounds = territory.bounds;
  if (!bounds) return null;
  return {
    lat: (bounds.south + bounds.north) / 2,
    lng: (bounds.west + bounds.east) / 2,
  };
}

export function LifeMapViewport({
  territory,
  objects,
  previewUnlocked = false,
  engine: engineProp,
  territoryDataResolver,
  selectedObjectId = null,
  onObjectSelect,
  dataVersion = "v1",
  territoryName,
}: LifeMapViewportProps) {
  const engine = engineProp ?? getLifeMapDevEngine();
  const hybrid3D =
    engine === "maplibre" && isLifeMapHybrid3DPreviewEnabled();

  const scene = useMemo(() => {
    const frame: LifeMapTerritory =
      previewUnlocked || territory.moduleEnabled
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

  const communityLabel = territoryName ?? "Tu comunidad";

  return (
    <section
      aria-label={`Mapa de ${communityLabel}`}
      className="relative mt-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-[0_12px_40px_rgba(40,36,28,0.08)]"
      style={{ minHeight: "min(72vh, 640px)", height: "min(72vh, 640px)" }}
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
          dataVersion={dataVersion}
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,transparent,rgba(28,26,22,0.55))] px-4 pb-4 pt-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
          {communityLabel}
        </p>
        <p className="mt-1 max-w-[22rem] text-[14px] leading-snug text-white">
          Explora lugares, actividades y servicios de tu comunidad.
        </p>
      </div>
    </section>
  );
}
