"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatContentWhen,
  listMarketplaceListings,
  marketplaceKindLabel,
  type MarketplaceListingKind,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FilterChipRow,
  FlowScreenHeader,
  MarketplaceItemCard,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

type Filter = "all" | MarketplaceListingKind;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "sell", label: "Vendo" },
  { id: "buy", label: "Busco" },
  { id: "give", label: "Regalo" },
  { id: "request", label: "Presto" },
];

export function MarketplaceScreen() {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const [filter, setFilter] = useState<Filter>("all");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  const items = useMemo(() => {
    const all = listMarketplaceListings({
      includeSessionCreated: sessionReady,
    });
    if (filter === "all") return all;
    return all.filter((i) => i.kind === filter);
  }, [filter, sessionReady]);

  if (!isFeatureEnabled("marketplace")) {
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
              kindLabel={marketplaceKindLabel(item.kind)}
              title={item.title}
              meta={formatContentWhen(item.publishedAt)}
              priceLabel={item.priceLabel}
              imageUrl={item.imageUrl}
              authorName={item.authorName}
              authorAvatarUrl={item.authorAvatarUrl}
              onClick={() => router.push(`/marketplace/${item.id}`)}
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
