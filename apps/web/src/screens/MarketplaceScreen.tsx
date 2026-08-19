"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  marketplaceListingTypeLabel,
  type MarketplaceListing,
  type MarketplaceListingType,
} from "@life-community-os/types";
import {
  EmptyState,
  FilterChipRow,
  FlowScreenHeader,
  LoadingState,
  MarketplaceItemCard,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { formatContentWhen } from "@life-community-os/tenant-life-panoramica";
import {
  fetchMarketplaceListings,
  listingImageUrl,
  listingPriceLabel,
} from "@/lib/marketplace/commerce-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

type Filter = "all" | MarketplaceListingType;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "sale", label: "Vendo" },
  { id: "rent", label: "Alquilo" },
  { id: "giveaway", label: "Regalo" },
  { id: "exchange", label: "Intercambio" },
];

export function MarketplaceScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    configuration,
  } = useTenant();
  const [filter, setFilter] = useState<Filter>("all");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await fetchMarketplaceListings({
        tenantId: configuration.tenantId,
      });
      if (cancelled) return;
      setListings(rows);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId]);

  const items = useMemo(() => {
    if (filter === "all") return listings;
    return listings.filter((item) => item.type === filter);
  }, [filter, listings]);

  if (!isFeatureEnabled("marketplace") || !isProductCapabilityEnabled("marketplace")) {
    return (
      <EmptyState
        title="El mercado no está disponible"
        description="Esta comunidad aún no ha activado el intercambio entre vecinos."
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.marketplaceView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="No puedes ver el mercado con tu cuenta actual."
      />
    );
  }

  if (!ready) {
    return <LoadingState label="Cargando mercado…" />;
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Mercado"
        subtitle="¿Qué ofrecen o necesitan tus vecinos?"
        onBack={() => router.push("/services")}
        onExit={() => router.push("/")}
      />

      {hasCapability(CAPABILITIES.marketplaceCreate) ? (
        <ScreenPrimaryAction
          label="Publicar anuncio"
          onClick={() => router.push("/marketplace/create")}
        />
      ) : null}

      <FilterChipRow
        items={filters}
        activeId={filter}
        onChange={(id) => setFilter(id as Filter)}
      />

      {items.length === 0 ? (
        <EmptyState
          title="No hay anuncios todavía"
          description="Sé la primera persona en publicar algo útil para el barrio."
          actionLabel={
            hasCapability(CAPABILITIES.marketplaceCreate)
              ? "Publicar anuncio"
              : undefined
          }
          onAction={
            hasCapability(CAPABILITIES.marketplaceCreate)
              ? () => router.push("/marketplace/create")
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              kindLabel={marketplaceListingTypeLabel(item.type)}
              title={item.title}
              meta={formatContentWhen(item.createdAt)}
              priceLabel={listingPriceLabel(item.price)}
              imageUrl={listingImageUrl(item.images)}
              authorName={item.authorDisplayName}
              onClick={() => router.push(`/marketplace/${item.id}`)}
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
