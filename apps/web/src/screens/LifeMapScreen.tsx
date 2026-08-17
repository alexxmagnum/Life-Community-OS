"use client";

/**
 * Life Map — community OS surface driven by Location (SoT).
 * Explore → filter → select → ficha / directions → register business.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EmptyState,
  FilterChipRow,
  FlowScreenHeader,
  MobileScreen,
  ScreenSearch,
} from "@life-community-os/ui";
import {
  buildLifeMapContextPanel,
  emitLifeMapTelemetry,
  type LifeMapContextPanelModel,
} from "@life-community-os/life-map-renderer";
import type {
  LifeMapActionKind,
  LifeMapObject,
  LifeMapTerritory,
  Location,
} from "@life-community-os/types";
import { LifeMapContextPanel } from "@/components/life-map/LifeMapContextPanel";
import { LifeMapViewport } from "@/components/life-map/LifeMapViewport";
import { isLifeMapExperienceUnlocked } from "@/lib/life-map-dev";
import { ensureLifeMapTenantPacksRegistered } from "@/lib/life-map-tenant-registry";
import { resolveLifeMapTenantPack } from "@/lib/life-map-tenant-pack";
import {
  buildLocationFilterChips,
  getLocation,
  locationCategoryLabel,
  locationContextEnrichment,
  openDirectionsUrl,
  projectLocationsToLifeMapObjects,
  useTenantLocations,
} from "@/lib/location";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

ensureLifeMapTenantPacksRegistered();

export function LifeMapScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    configuration,
  } = useTenant();

  const featureOn = isModuleEnabled("lifeMap") && isFeatureEnabled("lifeMap");
  const experienceOn = isLifeMapExperienceUnlocked(featureOn);
  const canView = hasCapability(CAPABILITIES.lifeMapView);

  const pack = useMemo(
    () => resolveLifeMapTenantPack(configuration.tenantId),
    [configuration.tenantId],
  );

  const { locations, seedReady, seedError } = useTenantLocations(
    configuration.tenantId,
  );

  const territoryDataResolver = useMemo(
    () => pack?.createTerritoryDataResolver(),
    [pack],
  );

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [filterId, setFilterId] = useState("all");

  const filteredLocations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter((location) => {
      if (filterId !== "all" && location.category.toLowerCase() !== filterId) {
        return false;
      }
      if (!q) return true;
      return (
        location.name.toLowerCase().includes(q) ||
        location.address.toLowerCase().includes(q) ||
        locationCategoryLabel(location.category).toLowerCase().includes(q)
      );
    });
  }, [locations, query, filterId]);

  const filterChips = useMemo(
    () => buildLocationFilterChips(locations.map((l) => l.category)),
    [locations],
  );

  const focusLocation: Location | null = useMemo(() => {
    if (selectedObjectId) {
      return (
        filteredLocations.find((l) => l.id === selectedObjectId) ??
        locations.find((l) => l.id === selectedObjectId) ??
        null
      );
    }
    return filteredLocations[0] ?? locations[0] ?? null;
  }, [selectedObjectId, filteredLocations, locations]);

  const territory: LifeMapTerritory | null = useMemo(() => {
    if (!pack) return null;
    const base = pack.territory;
    if (!focusLocation) return base;
    return {
      ...base,
      defaultCamera: {
        ...base.defaultCamera,
        target: {
          lat: focusLocation.latitude,
          lng: focusLocation.longitude,
        },
        distance: 320,
        headingDegrees: base.defaultCamera?.headingDegrees ?? -22,
        pitchDegrees: base.defaultCamera?.pitchDegrees ?? 58,
      },
    };
  }, [pack, focusLocation]);

  const objects: LifeMapObject[] = useMemo(() => {
    if (!territory) return [];
    return projectLocationsToLifeMapObjects(
      filteredLocations,
      territory.territoryId,
    );
  }, [filteredLocations, territory]);

  const locationById = useMemo(() => {
    const map = new Map<string, Location>();
    for (const location of locations) map.set(location.id, location);
    return map;
  }, [locations]);

  const selectedObject: LifeMapObject | null = useMemo(() => {
    if (!selectedObjectId) return null;
    return objects.find((o) => o.objectId === selectedObjectId) ?? null;
  }, [objects, selectedObjectId]);

  const contextModel: LifeMapContextPanelModel | null = useMemo(() => {
    if (!selectedObject) return null;
    const location = locationById.get(selectedObject.objectId);
    const enrichment = location
      ? locationContextEnrichment(location)
      : null;
    return buildLifeMapContextPanel(selectedObject, enrichment);
  }, [selectedObject, locationById]);

  useEffect(() => {
    if (!pack) return;
    emitLifeMapTelemetry({
      type: "life_map.opened",
      tenantId: pack.tenantId,
      territoryId: pack.territory.territoryId,
      dataVersion: `locations:${locations.length}`,
    });
  }, [pack, locations.length]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus && locations.some((l) => l.id === focus)) {
      setSelectedObjectId(focus);
    }
  }, [searchParams, locations]);

  const onObjectSelect = useCallback(
    (objectId: string | null) => {
      setSelectedObjectId(objectId);
      if (objectId && pack) {
        const obj = objects.find((o) => o.objectId === objectId);
        if (obj) {
          emitLifeMapTelemetry({
            type: "life_map.object_selected",
            tenantId: pack.tenantId,
            objectId: obj.objectId,
            objectType: obj.type,
          });
        }
      }
    },
    [objects, pack],
  );

  const onContextAction = useCallback(
    (action: LifeMapActionKind) => {
      if (!selectedObject) return;
      const location = getLocation(
        configuration.tenantId,
        selectedObject.objectId,
      );
      if (!location) return;

      if (action === "open") {
        router.push(`/locations/${encodeURIComponent(location.id)}`);
        return;
      }
      if (action === "navigate") {
        window.open(
          openDirectionsUrl(location.latitude, location.longitude),
          "_blank",
          "noopener,noreferrer",
        );
      }
    },
    [selectedObject, configuration.tenantId, router],
  );

  if (!experienceOn) {
    return (
      <MobileScreen>
        <EmptyState
          title="El mapa no está disponible"
          description="Esta comunidad aún no ha activado el mapa."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!canView) {
    return (
      <MobileScreen>
        <EmptyState
          title="Sin acceso"
          description="No puedes ver el mapa con tu cuenta actual."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!pack || !territory) {
    return (
      <MobileScreen>
        <EmptyState
          title="Mapa no configurado"
          description="Esta comunidad aún no tiene territorio preparado."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={pack.territoryName}
        subtitle="Tu comunidad en vivo"
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      <div className="mt-3 space-y-3">
        <ScreenSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar negocios, servicios…"
          label="Buscar en el mapa"
        />
        {filterChips.length > 1 ? (
          <FilterChipRow
            items={filterChips}
            activeId={filterId}
            onChange={setFilterId}
          />
        ) : null}
      </div>

      <LifeMapViewport
        territory={territory}
        objects={objects}
        previewUnlocked={experienceOn}
        territoryDataResolver={territoryDataResolver}
        selectedObjectId={selectedObjectId}
        onObjectSelect={onObjectSelect}
        focusLocationId={selectedObjectId}
        dataVersion={`loc-${filteredLocations.length}-${seedReady ? "ready" : "boot"}`}
        territoryName={pack.territoryName}
      />

      {contextModel ? (
        <LifeMapContextPanel
          model={contextModel}
          onAction={onContextAction}
          onClose={() => setSelectedObjectId(null)}
          customerDemo
        />
      ) : null}

      <section className="mt-5" aria-label="Lugares en el mapa">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            En tu comunidad
          </h2>
          <Link
            href="/business/register"
            className="text-[13px] font-medium text-[var(--color-action-primary)] underline-offset-2 hover:underline"
          >
            Registrar negocio
          </Link>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {locations.length === 0
            ? seedReady
              ? seedError
                ? "No pudimos cargar el ejemplo. Registra un negocio con su dirección."
                : "Aún no hay lugares. Sé el primero en publicar."
              : "Preparando el mapa…"
            : filteredLocations.length === 0
              ? "Ningún resultado con este filtro."
              : `${filteredLocations.length} lugar${filteredLocations.length === 1 ? "" : "es"} en el mapa`}
        </p>
      </section>

      <section className="mt-5 pb-6" aria-label="Lista de lugares">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Descubre
        </h2>
        {filteredLocations.length === 0 ? (
          <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
            {locations.length === 0
              ? "Los negocios y servicios aparecen al registrar su dirección."
              : "Prueba otro filtro o búsqueda."}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border-subtle)]">
            {filteredLocations.map((location) => (
              <li key={location.id}>
                <button
                  type="button"
                  className="w-full py-3 text-left"
                  onClick={() => setSelectedObjectId(location.id)}
                >
                  <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                    {location.name}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
                    {locationCategoryLabel(location.category)} ·{" "}
                    {location.address}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MobileScreen>
  );
}
