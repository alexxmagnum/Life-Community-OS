"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNearCategoryBySlug,
  listLocalEntitiesForKinds,
  rankLocalEntitiesForTerritory,
  territoryDiscoveryAreaLabels,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  LocalPlaceCard,
  MobileScreen,
  ScreenSearch,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Cerca de ti hub — "What exists around me?"
 * Territory Access ranks relevance (D.0.7.2.3). LocalEntity only.
 */
export function NearbyCategoryScreen({ category }: { category: string }) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability, demoPersonId } = useTenant();
  const [query, setQuery] = useState("");

  const hub = useMemo(() => getNearCategoryBySlug(category), [category]);

  const canLocal =
    (isFeatureEnabled("localLife") || isFeatureEnabled("localEntities")) &&
    hasCapability(CAPABILITIES.localView);

  const areaLabels = useMemo(
    () => territoryDiscoveryAreaLabels(demoPersonId),
    [demoPersonId],
  );

  const entities = useMemo(() => {
    if (!hub || !canLocal) return [];
    return rankLocalEntitiesForTerritory(
      listLocalEntitiesForKinds(hub.entityKinds, query),
      demoPersonId,
    );
  }, [hub, canLocal, query, demoPersonId]);

  if (!hub) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Cerca de ti"
          onBack={() => router.push("/")}
          onExit={() => router.push("/")}
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
          onExit={() => router.push("/")}
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
        onExit={() => router.push("/")}
      />

      <p className="text-[15px] leading-5 text-[var(--color-text-tertiary)]">
        {areaLabels.length > 0
          ? `Priorizado cerca de ${areaLabels.join(", ")} — relevancia, no un directorio.`
          : hub.description}
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
          actionLabel={query ? "Limpiar búsqueda" : undefined}
          onAction={query ? () => setQuery("") : undefined}
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
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
