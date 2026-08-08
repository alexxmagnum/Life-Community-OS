"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  formatContentWhen,
  getServicesCategoryBySlug,
  listLocalEntitiesForKinds,
  listMobilityListings,
  listNeighbourHelpListings,
  listRecommendationsForHub,
  marketplaceKindLabel,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  LocalPlaceCard,
  MarketplaceItemCard,
  MobileScreen,
  NeighbourTipCard,
  ScreenBack,
  ScreenSearch,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Servicios hub — "I need something solved."
 * Not a directory; not Cerca de ti.
 */
export function ServicesCategoryScreen({ category }: { category: string }) {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();
  const [query, setQuery] = useState("");

  const hub = useMemo(() => getServicesCategoryBySlug(category), [category]);

  const featureOk =
    hub?.featureKeys.some((key) => isFeatureEnabled(key)) ?? false;

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);
  const canMarket =
    isFeatureEnabled("marketplace") &&
    hasCapability(CAPABILITIES.marketplaceView);

  const entities = useMemo(() => {
    if (!hub || hub.content.kind !== "local-entities") return [];
    if (!canLocal) return [];
    return listLocalEntitiesForKinds(hub.content.entityKinds, query);
  }, [hub, canLocal, query]);

  const neighbourHelp = useMemo(() => {
    if (!hub || hub.content.kind !== "neighbour-help") return [];
    if (!canMarket) return [];
    return listNeighbourHelpListings(query);
  }, [hub, canMarket, query]);

  const mobility = useMemo(() => {
    if (!hub || hub.content.kind !== "mobility") return [];
    if (!canMarket) return [];
    return listMobilityListings(query);
  }, [hub, canMarket, query]);

  const tips = useMemo(() => {
    if (!hub || hub.content.kind !== "recommendations") return [];
    if (!canLocal || !isFeatureEnabled("recommendations")) return [];
    return listRecommendationsForHub(query);
  }, [hub, canLocal, isFeatureEnabled, query]);

  if (!hub) {
    return (
      <MobileScreen>
        <ScreenBack onClick={() => router.back()} />
        <EmptyState
          title="Servicio no encontrado"
          description="Esta categoría no forma parte de tu comunidad."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!featureOk) {
    return (
      <MobileScreen>
        <ScreenBack label="Servicios" onClick={() => router.back()} />
        <EmptyState
          title="No disponible"
          description="Este módulo no está activo en tu comunidad ahora mismo."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  let body: ReactNode = null;

  if (hub.content.kind === "local-entities") {
    if (!canLocal) {
      body = (
        <EmptyState
          title="Sin acceso"
          description="No puedes ver profesionales con tu cuenta actual."
        />
      );
    } else if (entities.length === 0) {
      body = (
        <EmptyState
          title={hub.emptyTitle}
          description={hub.emptyDescription}
        />
      );
    } else {
      body = (
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
      );
    }
  } else if (hub.content.kind === "neighbour-help") {
    if (!canMarket) {
      body = (
        <EmptyState
          title="Sin acceso"
          description="La ayuda entre vecinos no está disponible para tu cuenta."
        />
      );
    } else if (neighbourHelp.length === 0) {
      body = (
        <EmptyState
          title={hub.emptyTitle}
          description={hub.emptyDescription}
          actionLabel="Ver mercado"
          onAction={() => router.push("/marketplace")}
        />
      );
    } else {
      body = (
        <div className="space-y-4">
          {neighbourHelp.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              title={item.title}
              kindLabel={marketplaceKindLabel(item.kind)}
              priceLabel={item.priceLabel}
              authorName={item.authorName}
              authorAvatarUrl={item.authorAvatarUrl}
              imageUrl={item.imageUrl}
              meta={`${item.areaLabel} · ${formatContentWhen(item.publishedAt)}`}
              onClick={() => router.push("/marketplace")}
            />
          ))}
        </div>
      );
    }
  } else if (hub.content.kind === "mobility") {
    if (mobility.length === 0) {
      body = (
        <EmptyState
          title={hub.emptyTitle}
          description={hub.emptyDescription}
        />
      );
    } else {
      body = (
        <div className="space-y-4">
          {mobility.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              title={item.title}
              kindLabel={marketplaceKindLabel(item.kind)}
              priceLabel={item.priceLabel}
              authorName={item.authorName}
              authorAvatarUrl={item.authorAvatarUrl}
              imageUrl={item.imageUrl}
              meta={`${item.areaLabel} · ${formatContentWhen(item.publishedAt)}`}
              onClick={() => router.push("/marketplace")}
            />
          ))}
        </div>
      );
    }
  } else if (hub.content.kind === "recommendations") {
    if (!canLocal) {
      body = (
        <EmptyState
          title="Sin acceso"
          description="No puedes ver recomendaciones con tu cuenta actual."
        />
      );
    } else if (tips.length === 0) {
      body = (
        <EmptyState
          title={hub.emptyTitle}
          description={hub.emptyDescription}
        />
      );
    } else {
      body = (
        <div className="space-y-3">
          {tips.map((tip) => (
            <NeighbourTipCard
              key={tip.id}
              quote={tip.body}
              author={tip.authorName}
              relatedLabel={tip.relatedLabel}
              imageUrl={tip.imageUrl}
            />
          ))}
        </div>
      );
    }
  }

  return (
    <MobileScreen>
      <ScreenBack label="Servicios" onClick={() => router.back()} />

      <header className="space-y-2">
        <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text-tertiary)]">
          {theme.logoText} · Servicios
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
        placeholder={`Buscar en ${hub.label.toLowerCase()}…`}
        label={`Buscar ${hub.label}`}
      />

      {body}
    </MobileScreen>
  );
}
