"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  marketplaceListingTypeLabel,
  type MarketplaceListing,
} from "@life-community-os/types";
import { formatContentWhen } from "@life-community-os/tenant-life-panoramica";
import {
  Avatar,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ZoomableImage,
} from "@life-community-os/ui";
import { canOpenMarketplaceConversation } from "@/lib/marketplace-conversation-access";
import {
  archiveMarketplaceListingRequest,
  fetchMarketplaceListing,
  listingImageUrl,
  listingPriceLabel,
} from "@/lib/marketplace/commerce-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function MarketplaceDetailScreen({ listingId }: { listingId: string }) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    personId,
  } = useTenant();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const row = await fetchMarketplaceListing(
        configuration.tenantId,
        listingId,
      );
      if (cancelled) return;
      setListing(row);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, listingId]);

  if (!isFeatureEnabled("marketplace") || !isProductCapabilityEnabled("marketplace")) {
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

  const authorPersonId = listing.ownerPersonId;
  const showContact = canOpenMarketplaceConversation({
    listing: {
      id: listing.id,
      title: listing.title,
      authorPersonId,
    },
    configuration,
    isModuleEnabled,
    hasCapability,
  });
  const isOwner = Boolean(personId && personId === listing.ownerPersonId);
  const imageUrl = listingImageUrl(listing.images);

  return (
    <MobileScreen dense>
      <FlowScreenHeader
        title={marketplaceListingTypeLabel(listing.type)}
        onBack={() => router.push("/marketplace")}
        onExit={() => router.push("/services")}
      />

      {imageUrl ? (
        <ZoomableImage
          src={imageUrl}
          alt=""
          zoomable
          fill={false}
          className="aspect-[16/10] w-full rounded-[12px]"
          wrapperClassName="h-auto w-full overflow-hidden rounded-[12px]"
        />
      ) : null}

      <article className="space-y-3">
        <div>
          <h2 className="text-[20px] font-semibold leading-snug text-[var(--color-text-primary)]">
            {listing.title}
          </h2>
          {listingPriceLabel(listing.price) ? (
            <p className="mt-1 text-[16px] font-semibold text-[var(--color-action-primary)]">
              {listingPriceLabel(listing.price)}
            </p>
          ) : null}
          <p className="mt-2 text-[15px] leading-6 text-[var(--color-text-secondary)]">
            {listing.description}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--color-border-subtle)] pt-3">
          <Avatar alt={listing.authorDisplayName} size="sm" zoomable={false} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              {listing.authorDisplayName}
            </p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">
              {formatContentWhen(listing.createdAt)}
            </p>
          </div>
        </div>

        {isOwner ? (
          <button
            type="button"
            disabled={saving || listing.status === "archived"}
            onClick={() =>
              void (async () => {
                setSaving(true);
                const result = await archiveMarketplaceListingRequest({
                  tenantId: configuration.tenantId,
                  listingId: listing.id,
                });
                setSaving(false);
                if ("error" in result) return;
                router.push("/marketplace");
              })()
            }
            className="w-full rounded-[14px] border border-[var(--color-border-subtle)] px-4 py-3 text-[14px] font-semibold"
          >
            {listing.status === "archived" ? "Archivado" : "Archivar anuncio"}
          </button>
        ) : showContact ? (
          <button
            type="button"
            onClick={() =>
              router.push(`/marketplace/${listing.id}/conversation`)
            }
            className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-action-primary-subtle)] px-4 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[var(--color-action-primary)]">
                Contactar por este anuncio
              </span>
              <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
                Habla con {listing.authorDisplayName} sobre “{listing.title}”
              </span>
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
