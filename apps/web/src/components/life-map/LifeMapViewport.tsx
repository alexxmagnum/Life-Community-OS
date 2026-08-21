"use client";

/**
 * Spatial viewport — real community map (MapLibre) + optional street-level accents.
 * Commercial product surface: "mi comunidad digital", not a technical diorama.
 */

import dynamic from "next/dynamic";
import { useMemo } from "react";
import {
  bridgeLifeMapObjectsToSpatial,
  buildLifeMapScene,
} from "@life-community-os/life-map-renderer";
import type { TerritoryFabricGeoJson } from "@life-community-os/life-map-renderer-maplibre";
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
        className="flex h-full min-h-[inherit] items-center justify-center text-[14px] text-white/80"
        style={{
          background:
            "linear-gradient(165deg, #1a2820 0%, #243a30 45%, #1c2834 100%)",
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
  /**
   * Selected Location id for framing — camera target is applied via
   * territory.defaultCamera on the scene (product discovery).
   */
  focusLocationId?: string | null;
  dataVersion?: string;
  territoryName?: string;
  /** Wait for Location seed before cinematic open (avoids empty GIS frame). */
  locationsReady?: boolean;
  territoryAmenities?: TerritoryFabricGeoJson | null;
  territoryPoints?: TerritoryFabricGeoJson | null;
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
  focusLocationId = null,
  dataVersion = "v1",
  territoryName,
  locationsReady = true,
  territoryAmenities = null,
  territoryPoints = null,
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
    return bridgeLifeMapObjectsToSpatial(objects, origin)
      .filter((o) => Boolean(o.asset3DKey))
      .map((o) => ({
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

  const focusCameraTarget = useMemo(() => {
    if (!focusLocationId) return null;
    const hit = objects.find((o) => o.objectId === focusLocationId);
    const pos = hit?.position;
    if (
      pos &&
      typeof (pos as { lat?: unknown }).lat === "number" &&
      typeof (pos as { lng?: unknown }).lng === "number"
    ) {
      return {
        lat: (pos as { lat: number }).lat,
        lng: (pos as { lng: number }).lng,
      };
    }
    return null;
  }, [focusLocationId, objects]);

  const assetResolver = useMemo(
    () => createWebLifeMapAssetResolver(territory.tenantId),
    [territory.tenantId],
  );

  const communityLabel = territoryName ?? "Tu comunidad";
  const waitForPlaces = !locationsReady && objects.length === 0;

  return (
    <section
      aria-label={`Mapa de ${communityLabel}`}
      className="relative mt-2 overflow-hidden rounded-[24px] border border-black/[0.04]"
      style={{
        minHeight: "min(82vh, 760px)",
        height: "min(82vh, 760px)",
        boxShadow: "0 12px 40px rgba(18, 22, 18, 0.14)",
      }}
    >
      {waitForPlaces ? (
        <div
          className="absolute inset-0 flex items-center justify-center text-[14px] text-white/80"
          style={{
            background:
              "linear-gradient(165deg, #1a2820 0%, #243a30 45%, #1c2834 100%)",
          }}
        >
          Cargando lugares de tu comunidad…
        </div>
      ) : engine === "maplibre" ? (
        <MapLibreLifeMapCanvas
          scene={scene}
          territoryDataResolver={territoryDataResolver}
          hybrid3DOverlay={hybrid3D}
          spatialObjects={spatialObjects}
          selectedObjectId={selectedObjectId}
          onObjectSelect={onObjectSelect}
          assetResolver={assetResolver}
          cinematicEntrance
          dataVersion={dataVersion}
          focusCameraTarget={focusCameraTarget}
          territoryAmenities={territoryAmenities}
          territoryPoints={territoryPoints}
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,transparent_0%,rgba(16,18,16,0.45)_100%)] px-4 pb-5 pt-16">
        <p className="text-[13px] font-medium tracking-wide text-white/90">
          {objects.length > 0
            ? "Explora tu comunidad"
            : "Tu comunidad, en vivo"}
        </p>
      </div>
    </section>
  );
}
