"use client";

/**
 * Location ficha — business / service / facility detail from Location SoT.
 */

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import {
  getLocation,
  locationCategoryLabel,
  openDirectionsUrl,
} from "@/lib/location";
import { useTenant } from "@/providers/TenantProvider";

const TYPE_LABEL: Record<string, string> = {
  business: "Negocio",
  service: "Servicio",
  facility: "Instalación",
  event: "Evento",
  "community-place": "Lugar comunitario",
};

export function LocationDetailScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { configuration } = useTenant();
  const locationId = typeof params.id === "string" ? params.id : "";

  const location = useMemo(
    () => getLocation(configuration.tenantId, locationId),
    [configuration.tenantId, locationId],
  );

  if (!location) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Lugar"
          onBack={() => router.push("/map")}
          onExit={() => router.push("/map")}
        />
        <EmptyState
          title="No encontramos este lugar"
          description="Puede haberse eliminado o pertenecer a otra comunidad."
          actionLabel="Volver al mapa"
          onAction={() => router.push("/map")}
        />
      </MobileScreen>
    );
  }

  const typeLabel = TYPE_LABEL[location.type] ?? "Lugar";
  const categoryLabel = locationCategoryLabel(location.category);

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={location.name}
        subtitle={typeLabel}
        onBack={() =>
          router.push(`/map?focus=${encodeURIComponent(location.id)}`)
        }
        onExit={() => router.push("/map")}
      />

      <section className="mt-4 space-y-4 pb-28">
        <div
          className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]"
          style={{
            background:
              "linear-gradient(135deg, #c4a890 0%, #f5f1e8 72%)",
            minHeight: 140,
          }}
          aria-hidden
        />

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            {categoryLabel}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold text-[var(--color-text-primary)]">
            {location.name}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
            {location.geocodeDisplayName ?? location.address}
          </p>
        </div>

        <div className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
          <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
            Dirección
          </p>
          <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
            {location.address}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
            onClick={() =>
              router.push(`/map?focus=${encodeURIComponent(location.id)}`)
            }
          >
            Ver en el mapa
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
            onClick={() => {
              window.open(
                openDirectionsUrl(location.latitude, location.longitude),
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            Cómo llegar
          </button>
        </div>
      </section>

      <ScreenPrimaryAction
        label="Volver al mapa"
        onClick={() =>
          router.push(`/map?focus=${encodeURIComponent(location.id)}`)
        }
      />
    </MobileScreen>
  );
}
