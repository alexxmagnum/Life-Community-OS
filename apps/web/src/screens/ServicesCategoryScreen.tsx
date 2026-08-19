"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { asset } from "@life-community-os/assets";
import {
  formatContentWhen,
  getServicesCategoryBySlug,
  PROFESSIONALS_HEADER_ART_URL,
  rankLocalEntitiesForTerritory,
  workPostTypeLabel,
} from "@life-community-os/tenant-life-panoramica";
import {
  filterLocationsByLocalKinds,
  helpRequestTypeLabel,
  isWorkHelpCategory,
  locationToLocalEntity,
  marketplaceListingTypeLabel,
  type HelpRequest,
  type MarketplaceListing,
  type WorkPostType,
} from "@life-community-os/types";
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
import { resolvePlaceHref, useTenantLocations } from "@/lib/location";
import {
  fetchHelpRequests,
  fetchMarketplaceListings,
  listingImageUrl,
  listingPriceLabel,
} from "@/lib/marketplace/commerce-client";

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
    isProductCapabilityEnabled,
    demoPersonId,
    configuration,
  } = useTenant();
  const { allLocations } = useTenantLocations(configuration.tenantId);
  const [query, setQuery] = useState("");
  const [workFilter, setWorkFilter] = useState<WorkPostType | "all">("all");
  const [workPosts, setWorkPosts] = useState<HelpRequest[]>([]);
  const [neighbourHelp, setNeighbourHelp] = useState<HelpRequest[]>([]);
  const [mobility, setMobility] = useState<MarketplaceListing[]>([]);
  const [tips, setTips] = useState<HelpRequest[]>([]);

  const hub = useMemo(() => getServicesCategoryBySlug(category), [category]);

  const featureOk =
    hub?.featureKeys.some((key) => isFeatureEnabled(key)) ?? false;

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);
  const canMarket =
    isFeatureEnabled("marketplace") &&
    isProductCapabilityEnabled("marketplace") &&
    hasCapability(CAPABILITIES.marketplaceView);
  const canWork =
    isModuleEnabled("services") &&
    (isFeatureEnabled("work") || isFeatureEnabled("services")) &&
    hasCapability(CAPABILITIES.localView);

  const entities = useMemo(() => {
    if (!hub || hub.content.kind !== "local-entities") return [];
    if (!canLocal) return [];
    return rankLocalEntitiesForTerritory(
      filterLocationsByLocalKinds(
        allLocations.filter((item) => item.visibility !== "private"),
        hub.content.entityKinds,
        query,
      ).map(locationToLocalEntity),
      demoPersonId,
    );
  }, [hub, canLocal, query, demoPersonId, allLocations]);

  useEffect(() => {
    if (!hub) return;
    let cancelled = false;
    void (async () => {
      if (hub.content.kind === "work" && canWork) {
        const rows = await fetchHelpRequests({
          tenantId: configuration.tenantId,
          board: "work",
        });
        if (cancelled) return;
        const q = query.trim().toLowerCase();
        setWorkPosts(
          rows.filter((item) => {
            if (workFilter === "looking_for_work" && item.type !== "need_help") {
              return false;
            }
            if (workFilter === "offering_work" && item.type !== "offer_help") {
              return false;
            }
            if (!q) return true;
            return (
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q)
            );
          }),
        );
      } else {
        setWorkPosts([]);
      }
      if (hub.content.kind === "neighbour-help" && canMarket) {
        const rows = await fetchHelpRequests({
          tenantId: configuration.tenantId,
          board: "help",
        });
        if (cancelled) return;
        const q = query.trim().toLowerCase();
        setNeighbourHelp(
          rows.filter((item) => {
            if (!q) return true;
            return (
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q)
            );
          }),
        );
      } else {
        setNeighbourHelp([]);
      }
      if (hub.content.kind === "mobility" && canMarket) {
        const rows = await fetchMarketplaceListings({
          tenantId: configuration.tenantId,
          category: "mobility",
        });
        if (cancelled) return;
        setMobility(rows);
      } else {
        setMobility([]);
      }
      if (
        hub.content.kind === "recommendations" &&
        canLocal &&
        isFeatureEnabled("recommendations")
      ) {
        const rows = await fetchHelpRequests({
          tenantId: configuration.tenantId,
          type: "offer_help",
        });
        if (cancelled) return;
        const q = query.trim().toLowerCase();
        setTips(
          rows.filter((item) => {
            if (isWorkHelpCategory(item.category)) return false;
            if (!q) return true;
            return item.description.toLowerCase().includes(q);
          }),
        );
      } else {
        setTips([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    hub,
    canWork,
    canMarket,
    canLocal,
    workFilter,
    query,
    configuration.tenantId,
    isFeatureEnabled,
  ]);

  if (!hub) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Servicios"
          onBack={() => router.push("/services")}
          onExit={() => router.push("/")}
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
          onExit={() => router.push("/")}
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
              onClick={() =>
                router.push(
                  resolvePlaceHref({
                    entityOrLocationId: place.id,
                    tenantId: configuration.tenantId,
                  }),
                )
              }
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
          actionLabel="Publicar anuncio"
          onAction={() => router.push("/services/work/create")}
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
                    {item.type === "need_help"
                      ? workPostTypeLabel("looking_for_work")
                      : workPostTypeLabel("offering_work")}
                  </span>
                  <span className="text-[14px] font-medium text-[var(--color-text-tertiary)]">
                    {item.category}
                  </span>
                </div>
                <p className="mt-2 text-[16px] font-semibold leading-snug text-[var(--color-text-primary)]">
                  {item.title}
                </p>
                <p className="mt-1 text-[14px] leading-snug text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
                <p className="mt-2 text-[15px] leading-5 text-[var(--color-text-secondary)]">
                  {item.authorDisplayName}
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
          actionLabel="Publicar petición"
          onAction={() => router.push("/help/create")}
        />
      );
    } else {
      body = (
        <div className="space-y-4">
          {neighbourHelp.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              title={item.title}
              kindLabel={helpRequestTypeLabel(item.type)}
              authorName={item.authorDisplayName}
              imageUrl=""
              meta={formatContentWhen(item.createdAt)}
              onClick={() => router.push(`/services/work/${item.id}`)}
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
              kindLabel={marketplaceListingTypeLabel(item.type)}
              priceLabel={listingPriceLabel(item.price)}
              authorName={item.authorDisplayName}
              imageUrl={listingImageUrl(item.images)}
              meta={formatContentWhen(item.createdAt)}
              onClick={() => router.push(`/marketplace/${item.id}`)}
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
              quote={tip.description}
              author={tip.authorDisplayName}
              relatedLabel={tip.category}
            />
          ))}
        </div>
      );
    }
  }

  const isWorkHub = hub.content.kind === "work";
  const headerArtUrl =
    hub.slug === "professionals"
      ? PROFESSIONALS_HEADER_ART_URL
      : hub.slug === "mobility"
        ? asset("mobility.car-share.card")
        : hub.slug === "neighbour-help"
          ? asset("community.neighbour-help.card")
          : null;

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={hub.label}
        subtitle={headerArtUrl ? undefined : hub.problem}
        onBack={() => router.push("/services")}
        onExit={() => router.push("/")}
      />

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

      {headerArtUrl ? (
        <div className="-mt-10 flex flex-col gap-1">
          <div className="flex justify-center">
            <img
              src={headerArtUrl}
              alt=""
              draggable={false}
              className="h-[280px] w-auto max-w-full object-contain object-bottom"
            />
          </div>
          <ScreenSearch
            value={query}
            onChange={setQuery}
            placeholder={`Buscar en ${hub.label.toLowerCase()}…`}
            label={`Buscar ${hub.label}`}
          />
        </div>
      ) : (
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
      )}

      {body}

      {isWorkHub && canWork ? (
        <ScreenPrimaryAction
          label="Publicar anuncio"
          onClick={() => router.push("/services/work/create")}
        />
      ) : null}

      {hub.content.kind === "neighbour-help" && canMarket ? (
        <ScreenPrimaryAction
          label="Pedir u ofrecer ayuda"
          onClick={() => router.push("/help/create")}
        />
      ) : null}
    </MobileScreen>
  );
}
