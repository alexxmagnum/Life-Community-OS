"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  HousingListingCard,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import {
  canCreateHousingListing,
  canPerformHousingListingAction,
  housingActionTargetStatus,
  type HousingListing,
  type HousingListingAction,
} from "@life-community-os/types";
import {
  getHousingModuleConfig,
  listHousingListingsByOwner,
  updateHousingListingStatus,
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

const OWNER_ACTIONS: {
  action: HousingListingAction;
  label: string;
}[] = [
  { action: "publish", label: "Publicar" },
  { action: "submit_for_review", label: "Enviar a revisión" },
  { action: "approve_publish", label: "Aprobar" },
  { action: "reject_to_draft", label: "Devolver a borrador" },
  { action: "mark_reserved", label: "Marcar reservado" },
  { action: "unreserve", label: "Quitar reserva" },
  { action: "close", label: "Cerrar" },
  { action: "archive", label: "Archivar" },
  { action: "reopen_to_draft", label: "Reabrir borrador" },
];

/**
 * Own listings — lifecycle actions gated by permissions.
 */
export function HousingMineScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();
  const [sessionReady, setSessionReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  const moduleOn =
    isModuleEnabled("housing") && isFeatureEnabled("housing");
  const config = useMemo(() => getHousingModuleConfig(), []);
  const actor = useMemo(
    () =>
      buildHousingActionActor({
        personId: demoMember.personId,
        moduleEnabled: moduleOn,
        hasCapability,
        config,
      }),
    [demoMember.personId, moduleOn, hasCapability, config],
  );

  const items = useMemo(() => {
    void tick;
    return listHousingListingsByOwner(demoMember.personId, {
      includeSessionCreated: sessionReady,
    });
  }, [demoMember.personId, sessionReady, tick]);

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Mis anuncios"
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
          title="Mis anuncios"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState title="Sin acceso" />
      </MobileScreen>
    );
  }

  const runAction = (listing: HousingListing, action: HousingListingAction) => {
    const target = housingActionTargetStatus(action);
    if (!target) return;
    const ctx = { actor, listing };
    if (!canPerformHousingListingAction(ctx, action)) return;
    updateHousingListingStatus(listing.id, target, demoMember.personId);
    setTick((t) => t + 1);
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Mis anuncios"
        subtitle="Solo los tuyos"
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />

      {canCreateHousingListing(actor) ? (
        <ScreenPrimaryAction
          label="Crear anuncio"
          onClick={() => router.push("/housing/create")}
        />
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Aún no tienes anuncios"
          description="Crea un anuncio para alquiler, venta, terreno o local."
          actionLabel={
            canCreateHousingListing(actor) ? "Crear anuncio" : undefined
          }
          onAction={
            canCreateHousingListing(actor)
              ? () => router.push("/housing/create")
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const ctx = { actor, listing: item };
            const actions = OWNER_ACTIONS.filter(({ action }) =>
              canPerformHousingListingAction(ctx, action),
            );
            return (
              <div key={item.id} className="space-y-2">
                <HousingListingCard
                  categoryLabel={housingCategoryLabel(item.type)}
                  title={item.title}
                  meta={housingLocationLabel(item)}
                  priceLabel={housingPriceLabel(item)}
                  statusLabel={housingStatusLabel(item.status)}
                  imageUrl={housingCoverUrl(item)}
                  onClick={() => router.push(`/housing/${item.id}`)}
                />
                {actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 px-1">
                    {actions.map(({ action, label }) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => runAction(item, action)}
                        className="min-h-[36px] rounded-full bg-[var(--color-surface-muted)] px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </MobileScreen>
  );
}
