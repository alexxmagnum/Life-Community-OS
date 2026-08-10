"use client";

import { useRouter } from "next/navigation";
import { getLocalEntityById } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ZoomableImage,
} from "@life-community-os/ui";
import { canOpenPlaceConversation } from "@/lib/place-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Local place detail — story + contextual neighbour questions (not a directory stub).
 */
export function LocalPlaceDetailScreen({ placeId }: { placeId: string }) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
  } = useTenant();
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

  const showAsk = canOpenPlaceConversation({
    placeId: place.id,
    configuration,
    isModuleEnabled,
    hasCapability,
  });

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
          {showAsk ? (
            <button
              type="button"
              onClick={() =>
                router.push(`/near/place/${place.id}/conversation`)
              }
              className="flex w-full flex-col rounded-[14px] bg-[var(--color-action-primary)] px-4 py-3.5 text-left"
            >
              <span className="text-[15px] font-semibold text-white">
                Preguntar sobre este lugar
              </span>
              <span className="mt-0.5 text-[13px] font-medium text-white/85">
                Habla con vecinos sobre “{place.name}”
              </span>
            </button>
          ) : (
            <p className="rounded-[14px] bg-[var(--color-surface-muted)] px-4 py-3.5 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              Las preguntas sobre este lugar no están disponibles ahora mismo.
            </p>
          )}
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
