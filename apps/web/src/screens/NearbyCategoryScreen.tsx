"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNearCategoryBySlug,
  listLocalEntitiesForKinds,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  LocalPlaceCard,
  MobileScreen,
  ScreenBack,
  ScreenSearch,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Cerca de ti hub — "What exists around me?"
 * LocalEntity discovery only. Not Servicios (needs solved).
 */
export function NearbyCategoryScreen({ category }: { category: string }) {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();
  const [query, setQuery] = useState("");

  const hub = useMemo(() => getNearCategoryBySlug(category), [category]);

  const canLocal =
    (isFeatureEnabled("localLife") || isFeatureEnabled("localEntities")) &&
    hasCapability(CAPABILITIES.localView);

  const entities = useMemo(() => {
    if (!hub || !canLocal) return [];
    return listLocalEntitiesForKinds(hub.entityKinds, query);
  }, [hub, canLocal, query]);

  if (!hub) {
    return (
      <MobileScreen>
        <ScreenBack onClick={() => router.back()} />
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
        <ScreenBack label="Cerca de ti" onClick={() => router.back()} />
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
      <ScreenBack label="Cerca de ti" onClick={() => router.back()} />

      <header className="space-y-2">
        <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text-tertiary)]">
          {theme.logoText} · Cerca de ti
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-primary)]">
          {hub.label}
        </h1>
        <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
          {hub.problem}
        </p>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          {hub.description}
        </p>
      </header>

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
