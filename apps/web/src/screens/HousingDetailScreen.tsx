"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  HousingDetail,
  MobileScreen,
} from "@life-community-os/ui";
import { canPerformHousingListingAction } from "@life-community-os/types";
import {
  getHousingListingById,
  getHousingModuleConfig,
  submitHousingContactIntent,
} from "@/lib/housing/catalog";
import { buildHousingActionActor } from "@/lib/housing/actor";
import {
  housingCategoryLabel,
  housingListingFacts,
  housingLocationLabel,
  housingPriceLabel,
  housingStatusLabel,
} from "@/lib/housing/labels";
import { useHousingSaves } from "@/providers/HousingSavesProvider";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Housing listing detail — media, status, contact CTA (no CE wiring yet).
 */
export function HousingDetailScreen({ listingId }: { listingId: string }) {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    demoMember,
    configuration,
  } = useTenant();
  const { isSaved, toggleSave } = useHousingSaves();
  const [ready, setReady] = useState(false);
  const [contactDone, setContactDone] = useState(false);
  const [listingVersion, setListingVersion] = useState(0);

  const moduleOn =
    isModuleEnabled("housing") &&
    isFeatureEnabled("housing") &&
    isProductCapabilityEnabled("housing");
  const config = useMemo(
    () => getHousingModuleConfig(configuration),
    [configuration],
  );

  const listing = useMemo(() => {
    void listingVersion;
    return getHousingListingById(listingId);
  }, [listingId, listingVersion]);

  useEffect(() => {
    setReady(true);
    setListingVersion((v) => v + 1);
  }, [listingId]);

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Vivienda"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Vivienda no está disponible"
          actionLabel="Volver"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.housingView)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Vivienda"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState title="Sin acceso" />
      </MobileScreen>
    );
  }

  if (!ready) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Anuncio"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!listing) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Anuncio"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Anuncio no encontrado"
          description="Puede haberse eliminado o el enlace no es válido."
          actionLabel="Explorar vivienda"
          onAction={() => router.push("/housing")}
        />
      </MobileScreen>
    );
  }

  const actor = buildHousingActionActor({
    personId: demoMember.personId,
    moduleEnabled: moduleOn,
    hasCapability,
    configuration,
    config,
  });
  const actionCtx = { actor, listing };
  const canView = canPerformHousingListingAction(actionCtx, "view");
  const canContact = canPerformHousingListingAction(actionCtx, "contact");
  const canSave = canPerformHousingListingAction(actionCtx, "save");
  const saved = isSaved(listing.id);

  if (!canView) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Anuncio"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Anuncio no disponible"
          description="Este anuncio no es visible con tu cuenta actual."
          actionLabel="Explorar vivienda"
          onAction={() => router.push("/housing")}
        />
      </MobileScreen>
    );
  }

  const media = [...(listing.media ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({ id: m.id, url: m.url, alt: m.alt }));

  const onContact = () => {
    submitHousingContactIntent({
      listingId: listing.id,
      fromPersonId: demoMember.personId,
      message: `Interés en “${listing.title}”`,
    });
    setContactDone(true);
  };

  return (
    <MobileScreen dense>
      <FlowScreenHeader
        title={housingCategoryLabel(listing.type)}
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />

      <HousingDetail
        categoryLabel={housingCategoryLabel(listing.type)}
        statusLabel={housingStatusLabel(listing.status)}
        title={listing.title}
        description={listing.description}
        priceLabel={housingPriceLabel(listing)}
        locationLabel={housingLocationLabel(listing)}
        facts={housingListingFacts(listing)}
        amenities={listing.property.amenities}
        media={media}
        actions={
          <>
            {canContact ? (
              contactDone ? (
                <p className="rounded-[14px] bg-[var(--color-surface-muted)] px-4 py-3.5 text-[13px] leading-5 text-[var(--color-text-secondary)]">
                  Hemos registrado tu interés. El contacto conversacional se
                  activará cuando el adaptador de vivienda esté disponible.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={onContact}
                  className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-action-primary-subtle)] px-4 py-3.5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[var(--color-action-primary)]">
                      Contactar por este anuncio
                    </span>
                    <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
                      Envía tu interés al anunciante
                    </span>
                  </span>
                  <span
                    className="text-[var(--color-action-primary)]"
                    aria-hidden
                  >
                    ›
                  </span>
                </button>
              )
            ) : null}

            {canSave ? (
              <button
                type="button"
                onClick={() => toggleSave(listing.id)}
                className="flex w-full items-center justify-center rounded-[14px] border border-[var(--color-border-subtle)] px-4 py-3 text-[14px] font-semibold text-[var(--color-text-primary)]"
              >
                {saved ? "Quitar de guardados" : "Guardar anuncio"}
              </button>
            ) : null}
          </>
        }
      />
    </MobileScreen>
  );
}
