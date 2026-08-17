"use client";

/**
 * Location ficha — driven by Location SoT + Experience Resolver.
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
  openDirectionsUrl,
  openLocationContact,
  resolveLocationExperience,
} from "@/lib/location";
import { useTenant } from "@/providers/TenantProvider";

export function LocationDetailScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { configuration } = useTenant();
  const locationId = typeof params.id === "string" ? params.id : "";

  const location = useMemo(
    () => getLocation(configuration.tenantId, locationId),
    [configuration.tenantId, locationId],
  );

  const experience = useMemo(
    () => (location ? resolveLocationExperience(location) : null),
    [location],
  );

  if (!location || !experience) {
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

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={location.name}
        subtitle={experience.typeHint}
        onBack={() =>
          router.push(`/map?focus=${encodeURIComponent(location.id)}`)
        }
        onExit={() => router.push("/map")}
      />

      <section className="mt-4 space-y-4 pb-28">
        <div
          className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]"
          style={{
            background: `linear-gradient(135deg, ${experience.heroTone} 0%, #f5f1e8 72%)`,
            minHeight: 140,
          }}
          aria-hidden
        />

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            {experience.categoryLabel}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold text-[var(--color-text-primary)]">
            {location.name}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
            {experience.summary}
          </p>
        </div>

        <div className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
          <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
            Dirección
          </p>
          <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
            {location.geocodeDisplayName ?? location.address}
          </p>
        </div>

        {location.contact ? (
          <div className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
              Contacto
            </p>
            <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
              {location.contact}
            </p>
          </div>
        ) : null}

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
          {location.contact ? (
            <button
              type="button"
              className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
              onClick={() => openLocationContact(location.contact)}
            >
              Contacto
            </button>
          ) : null}
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
