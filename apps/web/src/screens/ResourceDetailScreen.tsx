"use client";

import { useRouter } from "next/navigation";
import { getResourceById } from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  MobileScreen,
  ReservationStatusBadge,
  ResourceHero,
  ScreenBack,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function ResourceDetailScreen({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Los lugares no están disponibles"
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  const resource = getResourceById(resourceId);

  if (!resource) {
    return (
      <EmptyState
        title="Lugar no encontrado"
        actionLabel="Ver lugares"
        onAction={() => router.push("/resources")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.resourceView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="No puedes ver este lugar ahora mismo."
      />
    );
  }

  const canReserve = hasCapability(CAPABILITIES.resourceReserve);

  return (
    <MobileScreen>
      <ScreenBack onClick={() => router.back()} />

      <ResourceHero
        imageUrl={resource.imageUrl}
        name={resource.name}
        overline={theme.logoText}
      />

      <div className="flex flex-wrap items-center gap-3">
        <ReservationStatusBadge status="available" />
        <span className="text-[14px] text-[var(--color-text-secondary)]">
          Próximo hueco · {resource.availabilityPreview}
        </span>
      </div>

      <p className="text-[17px] leading-7 text-[var(--color-text-secondary)]">
        {resource.description}
      </p>

      <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Dónde
        </h2>
        <p className="mt-1 text-[17px] font-semibold">{resource.location}</p>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          {resource.areaLabel}
        </p>
      </section>

      <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Normas de la comunidad
        </h2>
        <ul className="mt-3 space-y-2">
          {resource.rules.map((rule) => (
            <li
              key={rule}
              className="text-[15px] leading-6 text-[var(--color-text-secondary)]"
            >
              · {rule}
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-[88px] z-20 space-y-3 rounded-[var(--radius-xl)] bg-[var(--color-surface-app)]/95 p-3 backdrop-blur">
        {canReserve ? (
          <Button
            fullWidth
            onClick={() =>
              router.push(`/resources/${resource.id}/availability`)
            }
          >
            Reservar
          </Button>
        ) : (
          <Button fullWidth disabled>
            Reserva no disponible
          </Button>
        )}
      </div>
    </MobileScreen>
  );
}
