"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  filterLocationsByLocalKinds,
  locationToLocalEntity,
} from "@life-community-os/types";
import { getNearCategoryBySlug } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  LocalPlaceCard,
  MobileScreen,
  ScreenSearch,
} from "@life-community-os/ui";
import { useTenantLocations } from "@/lib/location";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Cerca de ti — discovery over Location SoT (LocalEntity is a view).
 */
export function NearbyCategoryScreen({ category }: { category: string }) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability, configuration } = useTenant();
  const { allLocations, seedReady } = useTenantLocations(configuration.tenantId);
  const [query, setQuery] = useState("");

  const hub = useMemo(() => getNearCategoryBySlug(category), [category]);

  const canLocal =
    (isFeatureEnabled("localLife") || isFeatureEnabled("localEntities")) &&
    hasCapability(CAPABILITIES.localView);

  const entities = useMemo(() => {
    if (!hub || !canLocal) return [];
    return filterLocationsByLocalKinds(
      allLocations,
      hub.entityKinds,
      query,
    ).map(locationToLocalEntity);
  }, [hub, canLocal, allLocations, query]);

  if (!hub) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Cerca de ti"
          onBack={() => router.push("/")}
          onExit={() => router.push("/discover")}
        />
        <EmptyState
          title="Categoría no encontrada"
          description="Esta categoría no forma parte de tu comunidad."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!canLocal) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title={hub.label}
          onBack={() => router.push("/")}
          onExit={() => router.push("/discover")}
        />
        <EmptyState
          title="No disponible"
          description="La vida local no está activa para tu cuenta ahora mismo."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={hub.label}
        subtitle={hub.problem}
        onBack={() => router.push("/")}
        onExit={() => router.push("/discover")}
      />

      <p className="text-[15px] leading-5 text-[var(--color-text-tertiary)]">
        {seedReady
          ? hub.description
          : "Cargando lugares de tu comunidad…"}
      </p>

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder={`Buscar ${hub.label.toLowerCase()}…`}
        label={`Buscar ${hub.label}`}
      />

      {entities.length === 0 ? (
        <EmptyState
          title={hub.emptyTitle}
          description={hub.emptyDescription}
          actionLabel={query ? "Limpiar búsqueda" : "Ver mapa"}
          onAction={
            query ? () => setQuery("") : () => router.push("/map")
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {entities.map((place) => (
            <LocalPlaceCard
              key={place.id}
              name={place.name}
              categoryLabel={place.categoryLabel}
              areaLabel={place.areaLabel}
              blurb={place.story}
              imageUrl={place.imageUrl}
              recommendedBy={place.recommendedBy}
              verified={place.verified}
              trustNote={place.trustNote}
              className="w-full max-w-none"
              onClick={() => router.push(`/locations/${place.id}`)}
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
