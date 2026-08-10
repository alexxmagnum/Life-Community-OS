"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  expressMarketplaceInterest,
  formatContentWhen,
  getMarketplaceListingById,
  marketplaceKindLabel,
  type MarketplaceListing,
} from "@life-community-os/tenant-life-panoramica";
import {
  Avatar,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ZoomableImage,
} from "@life-community-os/ui";
import { canOpenMarketplaceConversation } from "@/lib/marketplace-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Marketplace listing detail — contextual contact about this specific item.
 */
export function MarketplaceDetailScreen({ listingId }: { listingId: string }) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();
  const [listing, setListing] = useState<MarketplaceListing | undefined>(
    undefined,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setListing(getMarketplaceListingById(listingId));
    setReady(true);
  }, [listingId]);

  if (!isFeatureEnabled("marketplace")) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Mercado"
          onBack={() => router.push("/marketplace")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="El mercado no está disponible"
          actionLabel="Ver servicios"
          onAction={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.marketplaceView)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Mercado"
          onBack={() => router.push("/marketplace")}
          onExit={() => router.push("/services")}
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
          onBack={() => router.push("/marketplace")}
          onExit={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  if (!listing) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Anuncio"
          onBack={() => router.push("/marketplace")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="Anuncio no encontrado"
          description="Puede haberse eliminado o el enlace no es válido."
          actionLabel="Ver mercado"
          onAction={() => router.push("/marketplace")}
        />
      </MobileScreen>
    );
  }

  const showContact = canOpenMarketplaceConversation({
    listing,
    configuration,
    isModuleEnabled,
    hasCapability,
  });

  const openConversation = () => {
    if (!listing.authorPersonId) return;
    expressMarketplaceInterest({
      listingId: listing.id,
      personId: demoMember.personId,
    });
    router.push(`/marketplace/${listing.id}/conversation`);
  };

  return (
    <MobileScreen dense>
      <FlowScreenHeader
        title={marketplaceKindLabel(listing.kind)}
        onBack={() => router.push("/marketplace")}
        onExit={() => router.push("/services")}
      />

      <ZoomableImage
        src={listing.imageUrl}
        alt=""
        zoomable
        fill={false}
        className="aspect-[16/10] w-full rounded-[12px]"
        wrapperClassName="h-auto w-full overflow-hidden rounded-[12px]"
      />

      <article className="space-y-3">
        <div>
          <h2 className="text-[20px] font-semibold leading-snug text-[var(--color-text-primary)]">
            {listing.title}
          </h2>
          {listing.priceLabel ? (
            <p className="mt-1 text-[16px] font-semibold text-[var(--color-action-primary)]">
              {listing.priceLabel}
            </p>
          ) : null}
          <p className="mt-2 text-[15px] leading-6 text-[var(--color-text-secondary)]">
            {listing.description}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--color-border-subtle)] pt-3">
          <Avatar
            src={listing.authorAvatarUrl}
            alt={listing.authorName}
            size="sm"
            zoomable={false}
          />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              {listing.authorName}
            </p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">
              {[listing.areaLabel, formatContentWhen(listing.publishedAt)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {showContact ? (
          <button
            type="button"
            onClick={openConversation}
            className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-action-primary-subtle)] px-4 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[var(--color-action-primary)]">
                Contactar por este anuncio
              </span>
              <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
                Habla con {listing.authorName} sobre “{listing.title}”
              </span>
            </span>
            <span className="text-[var(--color-action-primary)]" aria-hidden>
              ›
            </span>
          </button>
        ) : (
          <p className="rounded-[14px] bg-[var(--color-surface-muted)] px-4 py-3.5 text-[13px] leading-5 text-[var(--color-text-secondary)]">
            El contacto sobre este anuncio no está disponible ahora mismo.
          </p>
        )}
      </article>
    </MobileScreen>
  );
}
