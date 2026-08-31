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
  CommunityFeedItem,
  LifeMapActionKind,
  LifeMapObject,
  LifeMapTerritory,
  Location,
} from "@life-community-os/types";
import {
  buildLifeMapPlaceSheet,
  projectLocationToLifeMapView,
} from "@life-community-os/types";
import { LifeMapContextPanel } from "@/components/life-map/LifeMapContextPanel";
import { LifePlaceHost } from "@/components/life-place/LifePlaceHost";
import { LifeMapViewport } from "@/components/life-map/LifeMapViewport";
import { isLifeMapExperienceUnlocked } from "@/lib/life-map-dev";
import { getCommunityExperienceFeed } from "@/lib/community/community-client";
import {
  filterLifeMapObjectsWithPosition,
  resolveLifeMapTapHref,
  territoryObjectsForTenant,
  bindLifeMapToActiveTerritory,
} from "@/lib/life-map/digital-twin";
import { assembleLifeMapContext, mapObjectsWithFeedLife } from "@/lib/life-map/life-map-context";
import { ensureLifeMapTenantPacksRegistered } from "@/lib/life-map-tenant-registry";
import { resolveLifeMapTenantPack } from "@/lib/life-map-tenant-pack";
import {
  getLocation,
  locationContextEnrichment,
  openDirectionsUrl,
  openLocationContact,
  resolveLifeMapObjectsWithLocations,
  useTenantLocations,
  buildLocationFilterChips,
  locationCategoryLabel,
  cameraPoseFromLocations,
} from "@/lib/location";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useTerritory } from "@/providers/TerritoryProvider";

ensureLifeMapTenantPacksRegistered();

export function LifeMapScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    configuration,
    authenticated,
    hasMembership,
  } = useTenant();
  const { sessionReady } = useCurrentUser();
  const { context: activeTerritory } = useTerritory();

  const featureOn =
    isModuleEnabled("lifeMap") &&
    isFeatureEnabled("lifeMap") &&
    isProductCapabilityEnabled("lifeMap");
  const experienceOn = isLifeMapExperienceUnlocked(featureOn);
  const canView = hasCapability(CAPABILITIES.lifeMapView);

  const pack = useMemo(
    () => resolveLifeMapTenantPack(configuration.tenantId),
    [configuration.tenantId],
  );

  const { locations, seedReady, seedError } = useTenantLocations(
    configuration.tenantId,
    activeTerritory.territoryId,
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
  const [feedItems, setFeedItems] = useState<CommunityFeedItem[]>([]);

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
    const fallbackHeading =
      typeof base.defaultCamera?.headingDegrees === "number"
        ? base.defaultCamera.headingDegrees
        : -18;
    const fallbackPitch =
      typeof base.defaultCamera?.pitchDegrees === "number"
        ? base.defaultCamera.pitchDegrees
        : 52;
    const cluster = cameraPoseFromLocations(
      filteredLocations.length > 0 ? filteredLocations : locations,
      {
        headingDegrees: fallbackHeading,
        pitchDegrees: Math.max(fallbackPitch, 48),
      },
    );
    // Locations always win over territory framing when any exist.
    if (cluster) {
      return bindLifeMapToActiveTerritory(
        {
          ...base,
          defaultCamera: {
            ...base.defaultCamera,
            ...cluster,
            ...(focusLocation && selectedObjectId
              ? {
                  target: {
                    lat: focusLocation.latitude,
                    lng: focusLocation.longitude,
                  },
                  distance: Math.min(cluster.distance, 280),
                }
              : {}),
          },
        },
        activeTerritory,
      );
    }
    return bindLifeMapToActiveTerritory(base, activeTerritory);
  }, [pack, focusLocation, filteredLocations, locations, selectedObjectId, activeTerritory]);

  useEffect(() => {
    if (!sessionReady) return;
    const territoryId = activeTerritory.territoryId;
    if (!authenticated || !hasMembership || !territoryId) {
      setFeedItems([]);
      return;
    }
    let cancelled = false;
    void getCommunityExperienceFeed({
      tenantId: configuration.tenantId,
      territoryId,
    }).then((data) => {
      if (!cancelled) setFeedItems(data.items);
    });
    return () => {
      cancelled = true;
    };
  }, [
    sessionReady,
    authenticated,
    hasMembership,
    configuration.tenantId,
    activeTerritory.territoryId,
  ]);

  const livingContext = useMemo(
    () =>
      assembleLifeMapContext({
        tenantId: configuration.tenantId,
        territoryId: activeTerritory.territoryId ?? "",
        locations: filteredLocations,
        feedItems,
        territoryObjects: pack?.listTerritoryObjects?.() ?? [],
      }),
    [
      configuration.tenantId,
      activeTerritory.territoryId,
      filteredLocations,
      feedItems,
      pack,
    ],
  );

  const objects: LifeMapObject[] = useMemo(() => {
    if (!territory || !pack) return [];
    const fromLocations = resolveLifeMapObjectsWithLocations(
      pack.listObjects(),
      filteredLocations,
      territory.territoryId,
    );
    const fromTerritory = territoryObjectsForTenant(
      pack.listTerritoryObjects?.() ?? [],
      pack.tenantId,
      territory.territoryId,
    );
    return mapObjectsWithFeedLife(
      filterLifeMapObjectsWithPosition([...fromTerritory, ...fromLocations]),
      livingContext.activeFeedItems,
    );
  }, [filteredLocations, territory, pack, livingContext.activeFeedItems]);

  const territoryAmenities = useMemo(
    () => pack?.territoryAmenities?.() ?? null,
    [pack],
  );
  const territoryPoints = useMemo(
    () => pack?.territoryPoints?.() ?? null,
    [pack],
  );

  const locationById = useMemo(() => {
    const map = new Map<string, Location>();
    for (const location of locations) map.set(location.id, location);
    return map;
  }, [locations]);

  const resolveLocationForObject = useCallback(
    (object: LifeMapObject): Location | null => {
      const byObjectId = locationById.get(object.objectId);
      if (byObjectId) return byObjectId;
      const entityId = object.ref?.entityId;
      if (entityId) {
        const byRef = locationById.get(entityId);
        if (byRef) return byRef;
        return getLocation(configuration.tenantId, entityId);
      }
      return getLocation(configuration.tenantId, object.objectId);
    },
    [locationById, configuration.tenantId],
  );

  const selectedObject: LifeMapObject | null = useMemo(() => {
    if (!selectedObjectId) return null;
    return objects.find((o) => o.objectId === selectedObjectId) ?? null;
  }, [objects, selectedObjectId]);

  const selectedPlaceSheet = useMemo(() => {
    if (!selectedObject) return null;
    const location = resolveLocationForObject(selectedObject);
    const view = location ? projectLocationToLifeMapView(location) : null;
    if (!view) return null;
    return buildLifeMapPlaceSheet({
      location: view,
      feedItems: livingContext.activeFeedItems,
    });
  }, [selectedObject, resolveLocationForObject, livingContext.activeFeedItems]);

  const contextModel: LifeMapContextPanelModel | null = useMemo(() => {
    if (!selectedObject) return null;
    const location = resolveLocationForObject(selectedObject);
    const sheet = selectedPlaceSheet;
    const enrichment = location
      ? {
          ...locationContextEnrichment(location),
          availableActions: selectedObject.availableActions,
          ...(sheet?.nowLabel ? { liveNow: sheet.nowLabel } : {}),
          ...(sheet?.availabilityLabel
            ? { liveAvailability: sheet.availabilityLabel }
            : {}),
        }
      : pack?.enrichContext?.(selectedObject) ?? null;
    return buildLifeMapContextPanel(selectedObject, enrichment);
  }, [selectedObject, selectedPlaceSheet, resolveLocationForObject, pack]);

  useEffect(() => {
    if (!pack) return;
    emitLifeMapTelemetry({
      type: "life_map.opened",
      tenantId: pack.tenantId,
      territoryId: activeTerritory.territoryId ?? pack.territory.territoryId,
      dataVersion: `locations:${locations.length}`,
    });
  }, [pack, locations.length, activeTerritory.territoryId]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus && locations.some((l) => l.id === focus)) {
      setSelectedObjectId(focus);
    }
  }, [searchParams, locations]);

  useEffect(() => {
    const qParam = searchParams.get("q");
    if (!qParam) return;
    setQuery(qParam);
    const hit = locations.find((location) =>
      location.name.toLowerCase().includes(qParam.trim().toLowerCase()),
    );
    if (hit) setSelectedObjectId(hit.id);
  }, [searchParams, locations]);

  useEffect(() => {
    if (!selectedObjectId) return;
    const panel = document.querySelector('[aria-label="Información del lugar"]');
    panel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedObjectId]);

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
      const location = resolveLocationForObject(selectedObject);
      if (action === "join") {
        const href = selectedPlaceSheet?.primary.href;
        if (href) router.push(href);
        return;
      }
      if (action === "open" || action === "reserve") {
        if (action === "reserve" && selectedPlaceSheet?.primary.kind === "reserve") {
          router.push(selectedPlaceSheet.primary.href);
          return;
        }
        const tap = resolveLifeMapTapHref({
          object: selectedObject,
          location,
        });
        if (action === "reserve" && tap.intent === "resource" && tap.href) {
          router.push(tap.href);
          return;
        }
        if (action === "open") {
          const href =
            selectedPlaceSheet?.primary.kind === "view"
              ? selectedPlaceSheet.primary.href
              : tap.href;
          if (href) router.push(href);
        }
        return;
      }
      if (!location) return;
      if (action === "navigate") {
        window.open(
          openDirectionsUrl(location.latitude, location.longitude),
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      if (action === "message") {
        openLocationContact(location.contact);
      }
    },
    [selectedObject, selectedPlaceSheet, resolveLocationForObject, router],
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

  const selectedLocation = selectedObject
    ? resolveLocationForObject(selectedObject)
    : null;

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
        dataVersion={`loc-${filteredLocations.length}-life-${livingContext.activeFeedItems.length}-${seedReady ? "ready" : "boot"}`}
        territoryName={pack.territoryName}
        locationsReady={seedReady}
        territoryAmenities={territoryAmenities}
        territoryPoints={territoryPoints}
      />

      {authenticated && hasMembership && selectedLocation ? (
        <LifePlaceHost
          tenantId={configuration.tenantId}
          locationId={selectedLocation.id}
          territoryId={activeTerritory.territoryId}
          onClose={() => setSelectedObjectId(null)}
        />
      ) : contextModel ? (
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
                ? "No pudimos cargar los lugares. Puedes registrar un negocio con su dirección."
                : "Aún no hay lugares. Sé el primero en publicar tu negocio."
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
            {filteredLocations.map((location) => {
              const socialLabel = livingContext.locations.find(
                (item) => item.id === location.id,
              )?.socialLabel;
              return (
              <li key={location.id}>
                <button
                  type="button"
                  className="w-full py-3 text-left"
                  onClick={() => {
                    setSelectedObjectId(location.id);
                  }}
                >
                  <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                    {location.name}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
                    {locationCategoryLabel(location.category)}
                    {socialLabel ? ` · ${socialLabel}` : ""}
                    {location.address ? ` · ${location.address}` : ""}
                  </p>
                </button>
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </MobileScreen>
  );
}
