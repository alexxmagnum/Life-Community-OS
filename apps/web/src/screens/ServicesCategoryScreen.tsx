"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  formatContentWhen,
  getServicesCategoryBySlug,
  listLocalEntitiesForKinds,
  listMobilityListings,
  listNeighbourHelpListings,
  listRecommendationsForHub,
  listWorkPostsForHub,
  marketplaceKindLabel,
  rankLocalEntitiesForTerritory,
  workPostTypeLabel,
  type WorkPostListing,
} from "@life-community-os/tenant-life-panoramica";
import type { WorkPostType } from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  LocalPlaceCard,
  MarketplaceItemCard,
  MobileScreen,
  NeighbourTipCard,
  ScreenPrimaryAction,
  ScreenSearch,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Servicios hub — "I need something solved."
 * Territory ranks LocalEntity relevance (D.0.7.2.3) — not a directory.
 */
export function ServicesCategoryScreen({ category }: { category: string }) {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoPersonId,
  } = useTenant();
  const [query, setQuery] = useState("");
  const [workFilter, setWorkFilter] = useState<WorkPostType | "all">("all");
  const [workPosts, setWorkPosts] = useState<WorkPostListing[]>([]);

  const hub = useMemo(() => getServicesCategoryBySlug(category), [category]);

  const featureOk =
    hub?.featureKeys.some((key) => isFeatureEnabled(key)) ?? false;

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);
  const canMarket =
    isFeatureEnabled("marketplace") &&
    hasCapability(CAPABILITIES.marketplaceView);
  const canWork =
    isModuleEnabled("services") &&
    (isFeatureEnabled("work") || isFeatureEnabled("services")) &&
    hasCapability(CAPABILITIES.localView);

  const entities = useMemo(() => {
    if (!hub || hub.content.kind !== "local-entities") return [];
    if (!canLocal) return [];
    return rankLocalEntitiesForTerritory(
      listLocalEntitiesForKinds(hub.content.entityKinds, query),
      demoPersonId,
    );
  }, [hub, canLocal, query, demoPersonId]);

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

  useEffect(() => {
    if (!hub || hub.content.kind !== "work" || !canWork) {
      setWorkPosts([]);
      return;
    }
    setWorkPosts(
      listWorkPostsForHub({
        type: workFilter === "all" ? undefined : workFilter,
        query,
        includeSessionCreated: true,
      }),
    );
  }, [hub, canWork, workFilter, query]);

  if (!hub) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Servicios"
          onBack={() => router.push("/services")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="Servicio no encontrado"
          description="Esta categoría no forma parte de tu comunidad."
          actionLabel="Ver servicios"
          onAction={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  if (!featureOk) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Servicios"
          onBack={() => router.push("/services")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="No disponible"
          description="Este módulo no está activo en tu comunidad ahora mismo."
          actionLabel="Ver servicios"
          onAction={() => router.push("/services")}
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
  } else if (hub.content.kind === "work") {
    if (!canWork) {
      body = (
        <EmptyState
          title="Sin acceso"
          description="Los anuncios de trabajo no están disponibles para tu cuenta."
        />
      );
    } else if (workPosts.length === 0) {
      body = (
        <EmptyState
          title={hub.emptyTitle}
          description={hub.emptyDescription}
        />
      );
    } else {
      body = (
        <ul className="space-y-3">
          {workPosts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => router.push(`/services/work/${item.id}`)}
                className="w-full rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-0.5 text-[14px] font-semibold text-[var(--color-text-primary)]">
                    {workPostTypeLabel(item.type)}
                  </span>
                  <span className="text-[14px] font-medium text-[var(--color-text-tertiary)]">
                    {item.categoryLabel}
                  </span>
                </div>
                <p className="mt-2 text-[16px] font-semibold leading-snug text-[var(--color-text-primary)]">
                  {item.title}
                </p>
                <p className="mt-1 text-[14px] leading-snug text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
                <p className="mt-2 text-[15px] leading-5 text-[var(--color-text-secondary)]">
                  {item.authorName}
                  {item.location ? ` · ${item.location}` : ""}
                  {item.availability ? ` · ${item.availability}` : ""}
                </p>
                <p className="mt-1 text-[14px] text-[var(--color-text-tertiary)]">
                  {formatContentWhen(item.createdAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>
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
          actionLabel="Ver compra y venta"
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

  const isWorkHub = hub.content.kind === "work";

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={hub.label}
        subtitle={hub.problem}
        onBack={() => router.push("/services")}
        onExit={() => router.push("/services")}
      />

      <p className="text-[15px] leading-5 text-[var(--color-text-tertiary)]">
        {hub.description}
      </p>

      {isWorkHub ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setWorkFilter((current) =>
                current === "looking_for_work" ? "all" : "looking_for_work",
              )
            }
            aria-pressed={workFilter === "looking_for_work"}
            className={
              workFilter === "looking_for_work"
                ? "rounded-[16px] bg-[var(--color-action-primary-subtle)] px-3 py-3 text-left ring-2 ring-[var(--color-action-primary)]"
                : "rounded-[16px] bg-[var(--color-surface-elevated)] px-3 py-3 text-left shadow-[var(--shadow-elev-1)]"
            }
          >
            <span className="block text-[15px] font-semibold text-[var(--color-text-primary)]">
              Busco trabajo
            </span>
            <span className="mt-1 block text-[14px] leading-snug text-[var(--color-text-secondary)]">
              Quiero trabajar cerca de casa
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              setWorkFilter((current) =>
                current === "offering_work" ? "all" : "offering_work",
              )
            }
            aria-pressed={workFilter === "offering_work"}
            className={
              workFilter === "offering_work"
                ? "rounded-[16px] bg-[var(--color-action-primary-subtle)] px-3 py-3 text-left ring-2 ring-[var(--color-action-primary)]"
                : "rounded-[16px] bg-[var(--color-surface-elevated)] px-3 py-3 text-left shadow-[var(--shadow-elev-1)]"
            }
          >
            <span className="block text-[15px] font-semibold text-[var(--color-text-primary)]">
              Ofrezco trabajo
            </span>
            <span className="mt-1 block text-[14px] leading-snug text-[var(--color-text-secondary)]">
              Necesito a alguien para un trabajo
            </span>
          </button>
        </div>
      ) : null}

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder={
          isWorkHub
            ? "Buscar anuncios de trabajo…"
            : `Buscar en ${hub.label.toLowerCase()}…`
        }
        label={`Buscar ${hub.label}`}
      />

      {body}

      {isWorkHub && canWork ? (
        <ScreenPrimaryAction
          label="Publicar anuncio"
          onClick={() => router.push("/services/work/create")}
        />
      ) : null}
    </MobileScreen>
  );
}
