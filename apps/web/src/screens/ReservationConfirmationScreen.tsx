"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  EmptyState,
  FlowScreenHeader,
  LoadingState,
  MobileScreen,
  ReservationSummary,
} from "@life-community-os/ui";
import { formatSlotDate } from "@/lib/reservations/presentation";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useReservations } from "@/providers/ReservationProvider";

export function ReservationConfirmationScreen({
  resourceId,
}: {
  resourceId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getResource, reserve, ready } = useReservations();
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirmedStatus, setConfirmedStatus] = useState<"pending" | "reserved">("reserved");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const date = searchParams.get("date") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";
  const resource = getResource(resourceId);

  const previewStatus = useMemo(() => {
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

  if (!ready) {
    return <LoadingState label="Cargando reserva..." />;
  }

  if (!resource || !date || !start || !end) {
    return (
      <EmptyState
        title="Faltan datos de la reserva"
        description="Elige de nuevo el día y la hora."
        actionLabel="Ver disponibilidad"
        onAction={() => router.push(`/resources/${resourceId}/availability`)}
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
        onBack={() => router.push(`/resources/${resource.id}/availability`)}
        onExit={() => router.push("/resources")}
      />

      <ReservationSummary
        resourceName={resource.name}
        imageUrl={resource.images?.[0] ?? resource.imageUrl}
        dateLabel={formatSlotDate(date)}
        timeLabel={`${start}–${end}`}
        location={`${resource.location}${resource.areaLabel ? ` · ${resource.areaLabel}` : ""}`}
        status={confirmed ? confirmedStatus : previewStatus}
      />

      {error ? (
        <p className="text-[15px] text-[var(--color-feedback-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {!confirmed ? (
        <Button
          fullWidth
          disabled={submitting}
          onClick={() => {
            setSubmitting(true);
            void (async () => {
              const result = await reserve({
                resourceId: resource.id,
                date,
                start,
                end,
              });
              setSubmitting(false);
              if (!result) {
                setError("Ese horario ya no está libre. Elige otro.");
                return;
              }
              setConfirmedId(result.id);
              setConfirmedStatus(
                result.status === "pending" ? "pending" : "reserved",
              );
              setError(null);
            })();
          }}
        >
          {submitting
            ? "Reservando…"
            : resource.requiresApproval
              ? "Solicitar reserva"
              : "Confirmar reserva"}
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
