"use client";

import { useRouter } from "next/navigation";
import { getLocalEntityById } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ZoomableImage,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Local place detail — story + useful next actions (not a directory stub).
 */
export function LocalPlaceDetailScreen({ placeId }: { placeId: string }) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const place = getLocalEntityById(placeId);

  if (!isFeatureEnabled("localLife") || !hasCapability(CAPABILITIES.localView)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Cerca"
          onBack={() => router.back()}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Sin acceso"
          description="Este lugar no está disponible para tu cuenta."
        />
      </MobileScreen>
    );
  }

  if (!place) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Lugar"
          onBack={() => router.back()}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Lugar no encontrado"
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen dense>
      <FlowScreenHeader
        title={place.categoryLabel}
        onBack={() => router.back()}
        onExit={() => router.push("/")}
      />

      <ZoomableImage
        src={place.imageUrl}
        alt=""
        zoomable
        fill={false}
        className="aspect-[4/3] w-full rounded-[12px]"
        wrapperClassName="h-auto w-full overflow-hidden rounded-[12px]"
      />

      <article className="space-y-3">
        <div>
          <h2 className="text-[22px] font-semibold leading-snug text-[var(--color-text-primary)]">
            {place.name}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
            {[place.areaLabel, place.verified ? "Verificado" : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-2 text-[15px] leading-6 text-[var(--color-text-secondary)]">
            {place.story}
          </p>
          {place.recommendedBy ? (
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
              Recomendado por {place.recommendedBy}
            </p>
          ) : null}
          {place.trustNote ? (
            <p className="mt-1 text-[13px] font-medium text-[var(--color-text-primary)]">
              {place.trustNote}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-[var(--color-border-subtle)] pt-3">
          <button
            type="button"
            onClick={() => router.push("/community")}
            className="w-full rounded-[14px] bg-[var(--color-action-primary)] px-4 py-3.5 text-left text-[15px] font-semibold text-white"
          >
            Preguntar a vecinos
          </button>
          <button
            type="button"
            onClick={() => router.push("/discover")}
            className="w-full rounded-[14px] bg-[var(--color-surface-muted)] px-4 py-3 text-left text-[14px] font-semibold text-[var(--color-text-primary)]"
          >
            Seguir explorando cerca
          </button>
        </div>
      </article>
    </MobileScreen>
  );
}
