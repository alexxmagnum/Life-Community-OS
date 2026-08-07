"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatResourceDate,
  getResourceById,
  listAvailabilityDates,
} from "@life-community-os/tenant-life-panoramica";
import {
  AvailabilityPicker,
  Button,
  EmptyState,
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
  const { isFeatureEnabled, hasCapability } = useTenant();
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
        title="Places aren’t available"
        actionLabel="Back home"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!resource) {
    return (
      <EmptyState
        title="Place not found"
        actionLabel="Browse places"
        onAction={() => router.push("/resources")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.resourceView)) {
    return <EmptyState title="You don’t have access" />;
  }

  const canReserve = hasCapability(CAPABILITIES.resourceReserve);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <button
        type="button"
        onClick={() => router.push(`/resources/${resource.id}`)}
        className="text-[15px] font-semibold text-[var(--color-action-primary)]"
      >
        ← {resource.name}
      </button>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold">
          Availability
        </h1>
        <p className="mt-2 text-[16px] text-[var(--color-text-secondary)]">
          Pick a day and an open slot. Taken times stay blocked for everyone.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-[14px] font-semibold text-[var(--color-text-secondary)]">
          Day
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

      <section>
        <h2 className="mb-3 text-[14px] font-semibold text-[var(--color-text-secondary)]">
          Time
        </h2>
        <TimeSlotSelector
          slots={slots}
          selectedId={selectedSlotId}
          onSelect={setSelectedSlotId}
        />
      </section>

      <p className="text-[13px] text-[var(--color-text-tertiary)]">
        Slot length · {resource.slotMinutes} minutes
        {resource.requiresApproval
          ? " · May need confirmation"
          : " · Instant confirm"}
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
        Continue
      </Button>
    </div>
  );
}
