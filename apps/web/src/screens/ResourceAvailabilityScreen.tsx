"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AvailabilityPicker,
  Button,
  EmptyState,
  FlowScreenHeader,
  LoadingState,
  MobileScreen,
  TimeSlotSelector,
} from "@life-community-os/ui";
import { formatSlotDate, upcomingDates } from "@/lib/reservations/presentation";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useReservations } from "@/providers/ReservationProvider";

export function ResourceAvailabilityScreen({
  resourceId,
}: {
  resourceId: string;
}) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getResource, getSlots, loadSlots, ready } = useReservations();
  const dates = upcomingDates(7);
  const [selectedDate, setSelectedDate] = useState(dates[0]!);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const resource = getResource(resourceId);
  const slots = getSlots(resourceId, selectedDate);

  useEffect(() => {
    if (!resource) return;
    let cancelled = false;
    setLoadingSlots(true);
    void loadSlots(resource.id, selectedDate).finally(() => {
      if (!cancelled) setLoadingSlots(false);
    });
    return () => {
      cancelled = true;
    };
  }, [resource, selectedDate, loadSlots]);

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
    return <LoadingState label="Cargando disponibilidad..." />;
  }

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
    return <EmptyState title="Sin acceso" />;
  }

  const canReserve = hasCapability(CAPABILITIES.resourceReserve);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const dateOptions = dates.map((value) => ({
    value,
    label: formatSlotDate(value),
  }));

  if (!canReserve) {
    return (
      <EmptyState
        title="Reserva no disponible"
        description="Puedes ver la información pública, pero no reservar con esta cuenta."
        actionLabel="Volver al lugar"
        onAction={() => router.push(`/resources/${resource.id}`)}
      />
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Disponibilidad"
        subtitle="Elige un día y un hueco libre. Los ocupados quedan bloqueados para todos."
        onBack={() => router.push(`/resources/${resource.id}`)}
        onExit={() => router.push("/resources")}
      />

      <section className="space-y-3">
        <h2 className="text-[14px] font-semibold text-[var(--color-text-secondary)]">
          Día
        </h2>
        <AvailabilityPicker
          dates={dateOptions}
          selected={selectedDate}
          onSelect={(d) => {
            setSelectedDate(d);
            setSelectedSlotId(null);
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-[14px] font-semibold text-[var(--color-text-secondary)]">
          Hora
        </h2>
        {loadingSlots ? (
          <LoadingState label="Consultando huecos..." />
        ) : (
          <TimeSlotSelector
            slots={slots}
            selectedId={selectedSlotId}
            onSelect={setSelectedSlotId}
          />
        )}
      </section>

      <p className="text-[15px] text-[var(--color-text-tertiary)]">
        Duración · {resource.slotMinutes ?? 60} minutos
        {resource.requiresApproval
          ? " · Puede requerir confirmación"
          : " · Confirmación inmediata"}
      </p>

      <Button
        fullWidth
        disabled={!selectedSlot}
        onClick={() => {
          if (!selectedSlot) return;
          const params = new URLSearchParams({
            date: selectedDate,
            start: selectedSlot.start,
            end: selectedSlot.end,
          });
          router.push(`/resources/${resource.id}/reserve?${params.toString()}`);
        }}
      >
        Continuar
      </Button>
    </MobileScreen>
  );
}
