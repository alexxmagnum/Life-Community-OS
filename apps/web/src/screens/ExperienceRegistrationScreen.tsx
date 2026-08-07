"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
  getExperienceById,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  ExperienceMeta,
  ParticipationStatus,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

export function ExperienceRegistrationScreen({
  experienceId,
}: {
  experienceId: string;
}) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState, join, getParticipation, setReminders } =
    useExperienceParticipation();
  const [reminders, setRemindersLocal] = useState(true);
  const [justJoined, setJustJoined] = useState(false);

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Experiences aren’t available"
        actionLabel="Back home"
        onAction={() => router.push("/")}
      />
    );
  }

  const experience = getExperienceById(experienceId);

  if (!experience) {
    return (
      <EmptyState
        title="Experience not found"
        actionLabel="Browse experiences"
        onAction={() => router.push("/discover?segment=experiences")}
      />
    );
  }

  const viewer = getViewerState(experience);
  const participation = getParticipation(experience.id);
  const alreadyJoined = viewer === "joined" || justJoined;
  const remaining = spotsLeft(experience);
  const isFull = viewer === "full" || remaining <= 0;
  const canJoin = hasCapability(CAPABILITIES.experienceJoin);

  if (!canJoin && !alreadyJoined) {
    return (
      <EmptyState
        title="You can’t join right now"
        description="Joining isn’t available for your account."
        actionLabel="Back"
        onAction={() => router.push(`/experiences/${experience.id}`)}
      />
    );
  }

  if (viewer === "cancelled" || viewer === "expired") {
    return (
      <EmptyState
        title={
          viewer === "cancelled"
            ? "This experience was cancelled"
            : "This experience has ended"
        }
        actionLabel="Find something else"
        onAction={() => router.push("/discover?segment=experiences")}
      />
    );
  }

  const confirmJoin = () => {
    const record = join(experience.id, {
      reminders,
      waitlist: isFull && !alreadyJoined,
    });
    if (record) {
      setJustJoined(true);
      setReminders(experience.id, reminders);
    }
  };

  const confirmed = alreadyJoined || justJoined;

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <button
        type="button"
        onClick={() => router.push(`/experiences/${experience.id}`)}
        className="text-[15px] font-semibold text-[var(--color-action-primary)]"
      >
        ← Back to details
      </button>

      <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={experience.imageUrl}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
        <div className="space-y-3 p-5">
          <ParticipationStatus
            status={
              confirmed
                ? isFull && participation?.state === "waitlisted"
                  ? "waitlisted"
                  : "joined"
                : isFull
                  ? "full"
                  : "available"
            }
          />
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-8">
            {confirmed
              ? isFull && participation?.state === "waitlisted"
                ? "You’re on the waitlist"
                : "You’re going"
              : isFull
                ? "Join the waitlist?"
                : "Confirm you want to join"}
          </h1>
          <p className="text-[16px] leading-6 text-[var(--color-text-secondary)]">
            {confirmed
              ? "We’ve added this to your calendar in Life Panoramica. You’ll see it under My activities."
              : `Join “${experience.title}” with neighbours in ${experience.areaLabel}.`}
          </p>
        </div>
      </div>

      <ExperienceMeta
        when={formatExperienceWhen(experience.startsAt)}
        location={experience.location}
        areaLabel={experience.areaLabel}
        capacityLabel={
          isFull
            ? "Currently full"
            : `${remaining} spots left of ${experience.capacity}`
        }
      />

      {!confirmed ? (
        <label className="flex min-h-[52px] items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 shadow-[var(--shadow-elev-1)]">
          <input
            type="checkbox"
            checked={reminders}
            onChange={(e) => setRemindersLocal(e.target.checked)}
            className="h-5 w-5 accent-[var(--color-action-primary)]"
          />
          <span className="text-[16px]">
            Remind me before it starts
            <span className="block text-[13px] text-[var(--color-text-tertiary)]">
              Notifications will connect later (placeholder)
            </span>
          </span>
        </label>
      ) : (
        <label className="flex min-h-[52px] items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 shadow-[var(--shadow-elev-1)]">
          <input
            type="checkbox"
            checked={participation?.reminders ?? reminders}
            onChange={(e) => {
              setRemindersLocal(e.target.checked);
              setReminders(experience.id, e.target.checked);
            }}
            className="h-5 w-5 accent-[var(--color-action-primary)]"
          />
          <span className="text-[16px]">Reminder preference</span>
        </label>
      )}

      {!confirmed ? (
        <Button fullWidth onClick={confirmJoin}>
          {isFull ? "Join waitlist" : "Confirm & join"}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button fullWidth onClick={() => router.push("/calendar")}>
            View in calendar
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push(`/experiences/${experience.id}`)}
          >
            Back to experience
          </Button>
        </div>
      )}
    </div>
  );
}
