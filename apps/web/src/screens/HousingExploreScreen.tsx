"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  housingAvailabilityLabel,
  housingPropertyTypeLabel,
  type HousingAvailability,
  type PropertyPublicView,
} from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  HousingFilterBar,
  HousingListingCard,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { fetchHousingProperties, propertyCoverUrl } from "@/lib/housing/housing-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

type Filter = "all" | HousingAvailability;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "rent", label: "Alquiler" },
  { id: "sale", label: "Venta" },
  { id: "private", label: "Privadas" },
];

export function HousingExploreScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    configuration,
  } = useTenant();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<PropertyPublicView[]>([]);
  const [ready, setReady] = useState(false);

  const moduleOn =
    isModuleEnabled("housing") &&
    isFeatureEnabled("housing") &&
    isProductCapabilityEnabled("housing");

  useEffect(() => {
    if (!moduleOn) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const rows = await fetchHousingProperties({
        tenantId: configuration.tenantId,
      });
      if (cancelled) return;
      setItems(rows);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, moduleOn]);

  const visible = useMemo(() => {
    if (filter === "all") {
      return items.filter((item) => item.availability !== "private" || item.viewerRole);
    }
    if (filter === "private") {
      return items.filter((item) => item.availability === "private" && item.viewerRole);
    }
    return items.filter((item) => item.availability === filter);
  }, [filter, items]);

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
        description="No puedes ver viviendas con tu cuenta actual."
      />
    );
  }

  const canCreate = hasCapability(CAPABILITIES.housingCreateOwnListing);

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Vivienda"
        subtitle="Hogares de la comunidad"
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push("/housing/mine")}
          className="min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
        >
          Mis viviendas
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
          label="Registrar vivienda"
          onClick={() => router.push("/housing/create")}
        />
      ) : null}

      <HousingFilterBar
        items={filters}
        activeId={filter}
        onChange={(id) => setFilter(id as Filter)}
      />

      {!ready ? (
        <p className="mt-6 text-[15px] text-[var(--color-text-secondary)]">
          Cargando viviendas…
        </p>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No hay viviendas para mostrar"
          description="Las viviendas privadas solo las ves si formas parte del hogar. El alquiler y la venta aparecen a la comunidad."
          actionLabel={canCreate ? "Registrar vivienda" : undefined}
          onAction={
            canCreate ? () => router.push("/housing/create") : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <HousingListingCard
              key={item.id}
              categoryLabel={housingPropertyTypeLabel(item.propertyType)}
              title={item.title}
              meta={[
                item.areaLabel,
                housingAvailabilityLabel(item.availability),
                item.viewerRole ? "Tu hogar" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              statusLabel={item.viewerRole ? "Tu relación" : undefined}
              imageUrl={propertyCoverUrl(item)}
              onClick={() => router.push(`/housing/${item.id}`)}
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
