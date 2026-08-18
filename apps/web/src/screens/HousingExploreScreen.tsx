"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  HousingFilterBar,
  HousingListingCard,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { canCreateHousingListing } from "@life-community-os/types";
import {
  getHousingModuleConfig,
  hydrateHousingFromServer,
  listPublishedHousingListings,
} from "@/lib/housing/catalog";
import { buildHousingActionActor } from "@/lib/housing/actor";
import {
  housingCategoryLabel,
  housingCoverUrl,
  housingLocationLabel,
  housingPriceLabel,
  housingStatusLabel,
} from "@/lib/housing/labels";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

type CategoryFilter = "all" | "rent" | "sale" | "land" | "commercial";

const categoryFilters: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "rent", label: "Alquiler" },
  { id: "sale", label: "Venta" },
  { id: "land", label: "Terreno" },
  { id: "commercial", label: "Local" },
];

/**
 * Housing explore — published listings with basic category filters.
 */
export function HousingExploreScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
    configuration,
  } = useTenant();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [sessionReady, setSessionReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await hydrateHousingFromServer();
      if (cancelled) return;
      setSessionReady(true);
      setTick((n) => n + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const moduleOn =
    isModuleEnabled("housing") && isFeatureEnabled("housing");
  const config = useMemo(
    () => getHousingModuleConfig(configuration),
    [configuration],
  );
  const actor = useMemo(
    () =>
      buildHousingActionActor({
        personId: demoMember.personId,
        moduleEnabled: moduleOn,
        hasCapability,
        configuration,
        config,
      }),
    [demoMember.personId, moduleOn, hasCapability, configuration, config],
  );

  const items = useMemo(() => {
    return listPublishedHousingListings({
      includeSessionCreated: sessionReady,
      type: filter,
    });
  }, [filter, sessionReady, tick]);

  if (!moduleOn) {
    return (
      <EmptyState
        title="Vivienda no está disponible"
        description="Esta comunidad aún no ha activado el módulo de vivienda."
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.housingView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="No puedes ver anuncios de vivienda con tu cuenta actual."
      />
    );
  }

  const canCreate = canCreateHousingListing(actor);

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Vivienda"
        subtitle="Explora anuncios publicados"
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push("/housing/mine")}
          className="min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
        >
          Mis anuncios
        </button>
        {hasCapability(CAPABILITIES.housingSave) ? (
          <button
            type="button"
            onClick={() => router.push("/housing/saved")}
            className="min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
          >
            Guardados
          </button>
        ) : null}
      </div>

      {canCreate ? (
        <ScreenPrimaryAction
          label="Crear anuncio"
          onClick={() => router.push("/housing/create")}
        />
      ) : null}

      <HousingFilterBar
        items={categoryFilters}
        activeId={filter}
        onChange={(id) => setFilter(id as CategoryFilter)}
      />

      {items.length === 0 ? (
        <EmptyState
          title="No hay anuncios publicados"
          description="Cuando haya ofertas de alquiler, venta, terreno o local, las verás aquí."
          actionLabel={canCreate ? "Crear anuncio" : undefined}
          onAction={
            canCreate ? () => router.push("/housing/create") : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <HousingListingCard
              key={item.id}
              categoryLabel={housingCategoryLabel(item.type)}
              title={item.title}
              meta={housingLocationLabel(item)}
              priceLabel={housingPriceLabel(item)}
              statusLabel={housingStatusLabel(item.status)}
              imageUrl={housingCoverUrl(item)}
              onClick={() => router.push(`/housing/${item.id}`)}
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
