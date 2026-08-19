"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatResourceDate,
  getResourceById,
  type CommunityResource,
} from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ReservationSummary,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCatalogDomain } from "@/providers/CatalogProvider";
import { useReservations } from "@/providers/ReservationProvider";

export function ReservationConfirmationScreen({
  resourceId,
}: {
  resourceId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureEnabled, hasCapability, tenantSlug, homeMode } = useTenant();
  const { items: catalogResources } =
    useCatalogDomain<CommunityResource>("resources");
  const { reserve } = useReservations();
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const date = searchParams.get("date") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  const resource =
    catalogResources.find((r) => r.id === resourceId) ??
    (homeMode === "premium"
      ? getResourceById(resourceId)
      : undefined);

  const status = useMemo(() => {
    if (!resource) return "available" as const;
    return resource.requiresApproval ? ("pending" as const) : ("reserved" as const);
  }, [resource]);

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Los lugares no están disponibles"
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!resource || !date || !start || !end) {
    return (
      <EmptyState
        title="Faltan datos de la reserva"
        description="Elige de nuevo el día y la hora."
        actionLabel="Ver disponibilidad"
        onAction={() =>
          router.push(`/resources/${resourceId}/availability`)
        }
      />
    );
  }

  if (!hasCapability(CAPABILITIES.resourceReserve)) {
    return (
      <EmptyState
        title="No puedes reservar ahora"
        description="Reservar no está disponible para tu cuenta."
      />
    );
  }

  const confirmed = Boolean(confirmedId);

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={confirmed ? "Reserva hecha" : "Confirmar reserva"}
        subtitle={
          confirmed
            ? "Este espacio está en tu agenda. Cuídalo para el siguiente vecino."
            : "Revisa la hora antes de confirmar."
        }
        onBack={() =>
          router.push(`/resources/${resource.id}/availability`)
        }
        onExit={() => router.push("/resources")}
      />

      <ReservationSummary
        resourceName={resource.name}
        imageUrl={resource.imageUrl}
        dateLabel={formatResourceDate(date)}
        timeLabel={`${start}–${end}`}
        location={`${resource.location} · ${resource.areaLabel}`}
        status={confirmed ? status : undefined}
      />

      {error ? (
        <p className="text-[15px] text-[var(--color-feedback-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {!confirmed ? (
        <Button
          fullWidth
          onClick={() => {
            const result = reserve({
              resourceId: resource.id,
              date,
              start,
              end,
            });
            if (!result) {
              setError("Ese horario ya no está libre. Elige otro.");
              return;
            }
            setConfirmedId(result.id);
            setError(null);
          }}
        >
          {resource.requiresApproval ? "Solicitar reserva" : "Confirmar reserva"}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button fullWidth onClick={() => router.push("/calendar")}>
            Ver en la agenda
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push("/reservations")}
          >
            Mis reservas
          </Button>
        </div>
      )}
    </MobileScreen>
  );
}
