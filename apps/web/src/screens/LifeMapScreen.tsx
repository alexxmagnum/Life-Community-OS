"use client";

/**
 * Life Map — Locations (SoT) projected onto tenant territory + 3D visual layer.
 * Works for any tenant; never hardcodes community places.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import {
  buildLifeMapContextPanel,
  buildLifeMapInteraction,
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
  getLocation,
  locationContextEnrichment,
  projectLocationsToLifeMapObjects,
  useTenantLocations,
} from "@/lib/location";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

ensureLifeMapTenantPacksRegistered();

/**
 * Life Map — living community twin driven by Location domain.
 */
export function LifeMapScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    configuration,
    demoPersonId,
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

  const territory: LifeMapTerritory | null = useMemo(() => {
    if (!pack) return null;
    const base = pack.territory;
    const focus = locations[0];
    if (!focus) return base;
    return {
      ...base,
      defaultCamera: {
        ...base.defaultCamera,
        target: { lat: focus.latitude, lng: focus.longitude },
        distance: 420,
        headingDegrees: base.defaultCamera?.headingDegrees ?? -18,
        pitchDegrees: base.defaultCamera?.pitchDegrees ?? 56,
      },
    };
  }, [pack, locations]);

  const objects: LifeMapObject[] = useMemo(() => {
    if (!territory) return [];
    return projectLocationsToLifeMapObjects(
      locations,
      territory.territoryId,
    );
  }, [locations, territory]);

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
      : pack?.enrichContext?.(selectedObject) ?? null;
    return buildLifeMapContextPanel(selectedObject, enrichment);
  }, [selectedObject, locationById, pack]);

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
    if (focus && objects.some((o) => o.objectId === focus)) {
      setSelectedObjectId(focus);
    }
  }, [searchParams, objects]);

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
      if (location && (action === "open" || action === "navigate")) {
        // Location ficha — stay on map with context card (no local-entity hardwire).
        return;
      }
      const intent = buildLifeMapInteraction({
        object: selectedObject,
        action,
        actorPersonId: demoPersonId,
      });
      if (action === "message" && intent.ref?.entityId) {
        router.push(`/business/register`);
      }
    },
    [selectedObject, demoPersonId, router, configuration.tenantId],
  );

  if (!experienceOn) {
    return (
      <MobileScreen>
        <EmptyState
          title="Life Map no está disponible"
          description="Esta comunidad aún no ha activado el mapa espacial."
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
          description="No puedes ver Life Map con tu cuenta actual."
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
          title="Life Map no configurado"
          description="Este tenant aún no tiene un pack territorial registrado."
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

      <LifeMapViewport
        territory={territory}
        objects={objects}
        previewUnlocked={experienceOn}
        territoryDataResolver={territoryDataResolver}
        selectedObjectId={selectedObjectId}
        onObjectSelect={onObjectSelect}
        dataVersion={`loc-${locations.length}-${seedReady ? "ready" : "boot"}`}
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

      <section className="mt-5" aria-label="Locations en el mapa">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            En el mapa
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
                ? `No se pudo geocodificar el ejemplo (${seedError}). Registra un negocio con su dirección.`
                : "Aún no hay Locations. Registra el primer negocio."
              : "Geocodificando ubicaciones…"
            : `${locations.length} ubicación${locations.length === 1 ? "" : "es"} con coordenadas reales`}
        </p>
      </section>

      <section className="mt-5 pb-6" aria-label="Negocios y lugares">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Descubre
        </h2>
        {locations.length === 0 ? (
          <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
            Los negocios aparecen automáticamente tras geocodificar su dirección.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border-subtle)]">
            {locations.map((location) => (
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
                    {location.category} · {location.address}
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
