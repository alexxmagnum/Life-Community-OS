"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  HousingListingCard,
  MobileScreen,
} from "@life-community-os/ui";
import {
  getHousingListingById,
} from "@/lib/housing/catalog";
import {
  housingCategoryLabel,
  housingCoverUrl,
  housingLocationLabel,
  housingPriceLabel,
  housingStatusLabel,
} from "@/lib/housing/labels";
import { useHousingSaves } from "@/providers/HousingSavesProvider";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Saved housing listings — uses housing.save capability + local saves store.
 */
export function HousingSavedScreen() {
  const router = useRouter();
  const { isFeatureEnabled, isModuleEnabled, hasCapability, isProductCapabilityEnabled } = useTenant();
  const { savedIds } = useHousingSaves();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  const moduleOn =
    isModuleEnabled("housing") &&
    isFeatureEnabled("housing") &&
    isProductCapabilityEnabled("housing");

  const items = useMemo(() => {
    if (!sessionReady) return [];
    return savedIds
      .map((id) => getHousingListingById(id))
      .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing));
  }, [savedIds, sessionReady]);

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
          description="No puedes guardar anuncios con tu cuenta actual."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Guardados"
        subtitle="Anuncios que quieres revisar"
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Nada guardado todavía"
          description="Desde el detalle de un anuncio puedes guardarlo para más tarde."
          actionLabel="Explorar anuncios"
          onAction={() => router.push("/housing")}
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
