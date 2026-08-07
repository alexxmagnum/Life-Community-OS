"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatResourceDate,
  getResourceById,
} from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  ReservationSummary,
} from "@life-community-os/ui";
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
  const { reserve } = useReservations();
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const date = searchParams.get("date") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  const resource = getResourceById(resourceId);

  const status = useMemo(() => {
    if (!resource) return "available" as const;
    return resource.requiresApproval ? ("pending" as const) : ("reserved" as const);
  }, [resource]);

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Places aren’t available"
        actionLabel="Back home"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!resource || !date || !start || !end) {
    return (
      <EmptyState
        title="Missing reservation details"
        description="Choose a day and time again."
        actionLabel="View availability"
        onAction={() =>
          router.push(`/resources/${resourceId}/availability`)
        }
      />
    );
  }

  if (!hasCapability(CAPABILITIES.resourceReserve)) {
    return (
      <EmptyState
        title="You can’t reserve right now"
        description="Reserving isn’t available for your account."
      />
    );
  }

  const confirmed = Boolean(confirmedId);

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <button
        type="button"
        onClick={() =>
          router.push(`/resources/${resource.id}/availability`)
        }
        className="text-[15px] font-semibold text-[var(--color-action-primary)]"
      >
        ← Change slot
      </button>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold">
          {confirmed ? "You’re booked" : "Confirm reservation"}
        </h1>
        <p className="mt-2 text-[16px] text-[var(--color-text-secondary)]">
          {confirmed
            ? "This place is on your calendar. Treat it with care for the next neighbour."
            : "Double-check the time before you confirm."}
        </p>
      </div>

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
              setError("That slot is no longer available. Pick another time.");
              return;
            }
            setConfirmedId(result.id);
            setError(null);
          }}
        >
          {resource.requiresApproval ? "Request reservation" : "Confirm reservation"}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button fullWidth onClick={() => router.push("/calendar")}>
            View in calendar
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push("/reservations")}
          >
            My reservations
          </Button>
        </div>
      )}
    </div>
  );
}
