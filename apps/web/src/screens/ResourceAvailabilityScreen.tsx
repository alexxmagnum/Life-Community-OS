"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  evaluateDemoResourceAccessForPerson,
  formatResourceDate,
  getResourceById,
  listAvailabilityDates,
} from "@life-community-os/tenant-life-panoramica";
import {
  AvailabilityPicker,
  Button,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  TimeSlotSelector,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useReservations } from "@/providers/ReservationProvider";

export function ResourceAvailabilityScreen({
  resourceId,
}: {
  resourceId: string;
}) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability, demoPersonId, demoMember } =
    useTenant();
  const { getSlots } = useReservations();
  const dates = listAvailabilityDates(7);
  const [selectedDate, setSelectedDate] = useState(dates[0]!);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const resource = getResourceById(resourceId);
  const slots = useMemo(
    () => (resource ? getSlots(resource.id, selectedDate) : []),
    [getSlots, resource, selectedDate],
  );

  const dateOptions = dates.map((value) => ({
    value,
    label: formatResourceDate(value),
  }));

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Los lugares no están disponibles"
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
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

  const roleCanReserve = hasCapability(CAPABILITIES.resourceReserve);
  const access = evaluateDemoResourceAccessForPerson(
    resource.id,
    demoPersonId,
    roleCanReserve,
  );

  if (!access.canReserve) {
    return (
      <EmptyState
        title="Reserva no disponible"
        description="Para reservar este espacio necesitas verificar tu zona. Puedes ver la información pública, pero no reservar todavía."
        actionLabel="Volver al lugar"
        onAction={() => router.push(`/resources/${resource.id}`)}
      />
    );
  }

  const canReserve = roleCanReserve;
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

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
        <TimeSlotSelector
          slots={slots}
          selectedId={selectedSlotId}
          onSelect={setSelectedSlotId}
        />
      </section>

      <p className="text-[15px] text-[var(--color-text-tertiary)]">
        Duración · {resource.slotMinutes} minutos
        {resource.requiresApproval
          ? " · Puede requerir confirmación"
          : " · Confirmación inmediata"}
      </p>

      <Button
        fullWidth
        disabled={!canReserve || !selectedSlot}
        onClick={() => {
          if (!selectedSlot) return;
          const params = new URLSearchParams({
            date: selectedDate,
            start: selectedSlot.start,
            end: selectedSlot.end,
          });
          router.push(
            `/resources/${resource.id}/reserve?${params.toString()}`,
          );
        }}
      >
        Continuar
      </Button>
    </MobileScreen>
  );
}
