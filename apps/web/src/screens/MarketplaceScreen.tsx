"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatContentWhen,
  listMarketplaceListings,
  marketplaceKindLabel,
  type MarketplaceListingKind,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  MarketplaceItemCard,
  cn,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

type Filter = "all" | MarketplaceListingKind;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "sell", label: "Se vende" },
  { id: "buy", label: "Se busca" },
  { id: "give", label: "Se regala" },
  { id: "request", label: "Se necesita" },
];

export function MarketplaceScreen() {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    const all = listMarketplaceListings();
    if (filter === "all") return all;
    return all.filter((i) => i.kind === filter);
  }, [filter]);

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
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8">
          Mercado
        </h1>
        <p className="mt-2 text-[16px] leading-6 text-[var(--color-text-secondary)]">
          Compraventa y ayuda entre vecinos — no es una tienda comercial.
        </p>
      </div>

      {hasCapability(CAPABILITIES.marketplaceCreate) ? (
        <button
          type="button"
          onClick={() => undefined}
          className="flex min-h-[52px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)]"
        >
          Publicar anuncio
        </button>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "min-h-[40px] shrink-0 rounded-full px-4 text-[14px] font-semibold",
              filter === f.id
                ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No hay anuncios todavía"
          description="Sé la primera persona en publicar algo útil para el barrio."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              kindLabel={marketplaceKindLabel(item.kind)}
              title={item.title}
              meta={`${item.areaLabel} · ${formatContentWhen(item.publishedAt)}`}
              priceLabel={item.priceLabel}
              imageUrl={item.imageUrl}
              authorName={item.authorName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
