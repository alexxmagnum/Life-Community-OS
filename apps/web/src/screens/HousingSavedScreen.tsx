"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  housingAvailabilityLabel,
  housingPropertyTypeLabel,
  type PropertyPublicView,
} from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  HousingListingCard,
  MobileScreen,
} from "@life-community-os/ui";
import { fetchHousingProperties, propertyCoverUrl } from "@/lib/housing/housing-client";
import { useHousingSaves } from "@/providers/HousingSavesProvider";
import { useEntityMediaIndex } from "@/lib/media/use-entity-media";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function HousingSavedScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    configuration,
  } = useTenant();
  const { savedIds } = useHousingSaves();
  const [items, setItems] = useState<PropertyPublicView[]>([]);
  const [ready, setReady] = useState(false);
  const mediaById = useEntityMediaIndex("property");

  const moduleOn =
    isModuleEnabled("housing") &&
    isFeatureEnabled("housing") &&
    isProductCapabilityEnabled("housing");

  useEffect(() => {
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
  }, [configuration.tenantId]);

  const saved = useMemo(
    () => items.filter((item) => savedIds.includes(item.id)),
    [items, savedIds],
  );

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Guardados"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState title="Vivienda no está disponible" />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.housingSave)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Guardados"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Sin acceso"
          description="No puedes guardar viviendas con tu cuenta actual."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Guardados"
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />
      {!ready ? (
        <p className="mt-6 text-[15px] text-[var(--color-text-secondary)]">
          Cargando…
        </p>
      ) : saved.length === 0 ? (
        <EmptyState
          title="Nada guardado"
          description="Cuando guardes una vivienda visible, aparecerá aquí."
          actionLabel="Explorar"
          onAction={() => router.push("/housing")}
        />
      ) : (
        <div className="space-y-3">
          {saved.map((item) => (
            <HousingListingCard
              key={item.id}
              categoryLabel={housingPropertyTypeLabel(item.propertyType)}
              title={item.title}
              meta={[item.areaLabel, housingAvailabilityLabel(item.availability)]
                .filter(Boolean)
                .join(" · ")}
              imageUrl={propertyCoverUrl(item, mediaById[item.id])}
              onClick={() => router.push(`/housing/${item.id}`)}
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
