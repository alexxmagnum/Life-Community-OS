"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  housingAvailabilityLabel,
  housingPropertyTypeLabel,
  propertyMembershipRoleLabel,
  type PropertyPublicView,
} from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  HousingListingCard,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { fetchHousingProperties, propertyCoverUrl } from "@/lib/housing/housing-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function HousingMineScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    configuration,
    personId,
  } = useTenant();
  const [items, setItems] = useState<PropertyPublicView[]>([]);
  const [ready, setReady] = useState(false);

  const moduleOn =
    isModuleEnabled("housing") &&
    isFeatureEnabled("housing") &&
    isProductCapabilityEnabled("housing");

  useEffect(() => {
    if (!moduleOn || !personId) {
      setReady(true);
      setItems([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const rows = await fetchHousingProperties({
        tenantId: configuration.tenantId,
        mine: true,
      });
      if (cancelled) return;
      setItems(rows);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, moduleOn, personId]);

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Mis viviendas"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState title="Vivienda no está disponible" />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.housingView)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Mis viviendas"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState title="Sin acceso" />
      </MobileScreen>
    );
  }

  const canCreate = hasCapability(CAPABILITIES.housingCreateOwnListing);

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Mis viviendas"
        subtitle="Solo las tuyas"
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />

      {canCreate ? (
        <ScreenPrimaryAction
          label="Registrar vivienda"
          onClick={() => router.push("/housing/create")}
        />
      ) : null}

      {!ready ? (
        <p className="mt-6 text-[15px] text-[var(--color-text-secondary)]">
          Cargando…
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aún no tienes viviendas"
          description="Registra tu hogar o espera a que te añadan como residente."
          actionLabel={canCreate ? "Registrar vivienda" : undefined}
          onAction={
            canCreate ? () => router.push("/housing/create") : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <HousingListingCard
              key={item.id}
              categoryLabel={housingPropertyTypeLabel(item.propertyType)}
              title={item.title}
              meta={[
                item.viewerRole
                  ? propertyMembershipRoleLabel(
                      item.viewerRole as "owner" | "resident" | "tenant" | "family_member",
                    )
                  : null,
                housingAvailabilityLabel(item.availability),
                item.areaLabel,
              ]
                .filter(Boolean)
                .join(" · ")}
              imageUrl={propertyCoverUrl(item)}
              onClick={() => router.push(`/housing/${item.id}`)}
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
