"use client";

import { useRouter } from "next/navigation";
import { formatResourceDate } from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  MobileScreen,
  ReservationStatusBadge,
  ReservationSummary,
  ScreenHeader,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useReservations } from "@/providers/ReservationProvider";

export function MyReservationsScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();
  const { upcoming, past, cancel } = useReservations();

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Las reservas no están disponibles"
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.resourceView)) {
    return <EmptyState title="Sin acceso" />;
  }

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Mis reservas"
        subtitle="Espacios que has reservado en la comunidad."
      />

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
          Próximas
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No hay reservas próximas"
            description="Reserva una pista, sala o terraza cuando la necesites."
            actionLabel="Ver lugares"
            onAction={() => router.push("/resources")}
          />
        ) : (
          upcoming.map((r) => (
            <div key={r.id} className="space-y-3">
              <ReservationSummary
                resourceName={r.resourceName}
                imageUrl={r.resourceImageUrl}
                dateLabel={formatResourceDate(r.date)}
                timeLabel={`${r.start}–${r.end}`}
                location={`${r.location} · ${r.areaLabel}`}
                status={r.status}
              />
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => router.push(`/resources/${r.resourceId}`)}
                >
                  Ver lugar
                </Button>
                {(r.status === "reserved" || r.status === "pending") && (
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => cancel(r.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
          Pasadas
        </h2>
        {past.length === 0 ? (
          <p className="text-[15px] text-[var(--color-text-secondary)]">
            Las reservas pasadas aparecerán aquí.
          </p>
        ) : (
          past.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => router.push(`/resources/${r.resourceId}`)}
              className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 text-left shadow-[var(--shadow-elev-1)]"
            >
              <span>
                <span className="block text-[16px] font-semibold">
                  {r.resourceName}
                </span>
                <span className="block text-[15px] text-[var(--color-text-tertiary)]">
                  {formatResourceDate(r.date)} · {r.start}–{r.end}
                </span>
              </span>
              <ReservationStatusBadge status={r.status} />
            </button>
          ))
        )}
      </section>
    </MobileScreen>
  );
}
