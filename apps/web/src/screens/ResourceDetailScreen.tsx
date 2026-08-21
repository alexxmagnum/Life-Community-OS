"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  EmptyState,
  FlowScreenHeader,
  LoadingState,
  MobileScreen,
  ReservationStatusBadge,
  ResourceHero,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useReservations } from "@/providers/ReservationProvider";

export function ResourceDetailScreen({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getResource, ready } = useReservations();

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Los lugares no están disponibles"
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!ready) {
    return <LoadingState label="Cargando lugar..." />;
  }

  const resource = getResource(resourceId);

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

  const canReserve =
    hasCapability(CAPABILITIES.resourceReserve) &&
    resource.bookable !== false &&
    resource.status === "active";
  const rules = resource.bookingRules ?? resource.rules ?? [];

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={resource.name}
        onBack={() => router.push("/resources")}
        onExit={() => router.push("/services")}
      />

      <ResourceHero
        imageUrl={resource.images?.[0] ?? resource.imageUrl ?? ""}
        name={resource.name}
      />

      <div className="flex flex-wrap items-center gap-3">
        {canReserve ? (
          <ReservationStatusBadge status="available" />
        ) : (
          <span className="inline-flex min-h-[32px] items-center rounded-full bg-[var(--color-surface-muted)] px-3 text-[15px] font-semibold text-[var(--color-text-secondary)]">
            No disponible para ti
          </span>
        )}
      </div>

      <p className="text-[17px] leading-7 text-[var(--color-text-secondary)]">
        {resource.description}
      </p>

      <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
        <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Dónde
        </h2>
        <p className="mt-1 text-[17px] font-semibold">{resource.location}</p>
        {resource.areaLabel ? (
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            {resource.areaLabel}
          </p>
        ) : null}
      </section>

      {rules.length > 0 ? (
        <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
          <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Normas de la comunidad
          </h2>
          <ul className="mt-3 space-y-2">
            {rules.map((rule) => (
              <li
                key={rule}
                className="text-[15px] leading-6 text-[var(--color-text-secondary)]"
              >
                · {rule}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
