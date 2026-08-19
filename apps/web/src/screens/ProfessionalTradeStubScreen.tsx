"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessProfile } from "@life-community-os/types";
import { getProfessionalTradeById } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  LocalPlaceCard,
  MobileScreen,
} from "@life-community-os/ui";
import { fetchBusinesses } from "@/lib/business/business-client";
import { businessCategoriesForTrade } from "@/lib/business/professional-categories";
import { locationFichaHref } from "@/lib/location";
import { useTenant } from "@/providers/TenantProvider";

/**
 * Professional trade listings — Business Profile + category.
 * No ProfessionalEntity.
 */
export function ProfessionalTradeStubScreen({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const { configuration } = useTenant();
  const trade = useMemo(() => getProfessionalTradeById(tradeId), [tradeId]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!trade) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const rows = await fetchBusinesses({
        tenantId: configuration.tenantId,
        categories: businessCategoriesForTrade(trade.id),
        status: "published",
      });
      if (cancelled) return;
      setBusinesses(rows);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [trade, configuration.tenantId]);

  if (!trade) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Profesionales"
          onBack={() => router.push("/services/professionals")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Categoría no encontrada"
          description="Esta profesión no forma parte de tu comunidad."
          actionLabel="Ver profesionales"
          onAction={() => router.push("/services/professionals")}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={trade.label}
        subtitle={trade.description}
        onBack={() => router.push("/services/professionals")}
        onExit={() => router.push("/")}
      />
      {!ready ? (
        <p className="mt-8 text-[15px] text-[var(--color-text-secondary)]">
          Cargando profesionales…
        </p>
      ) : businesses.length === 0 ? (
        <EmptyState
          title={`Aún no hay ${trade.label.toLowerCase()}`}
          description="Cuando un vecino publique un negocio de esta categoría, aparecerá aquí."
          actionLabel="Registrar un negocio"
          onAction={() => router.push("/business/register")}
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {businesses.map((item) => (
            <LocalPlaceCard
              key={item.id}
              name={item.name}
              categoryLabel={item.category}
              areaLabel={configuration.branding.name}
              blurb={item.description}
              imageUrl={item.imageUrl ?? ""}
              onClick={() => router.push(locationFichaHref(item.locationId))}
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
