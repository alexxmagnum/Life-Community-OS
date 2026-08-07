"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
  listDiscoverableExperiences,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  ExperienceCard,
  cn,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

function statusLabelFor(
  viewer: ReturnType<
    ReturnType<typeof useExperienceParticipation>["getViewerState"]
  >,
  remaining: number,
): string {
  if (viewer === "joined") return "You’re going";
  if (viewer === "full") return "Full";
  if (viewer === "cancelled") return "Cancelled";
  if (viewer === "expired") return "Ended";
  if (remaining <= 3) return `${remaining} spots left`;
  return "Open";
}

export function ExperienceListScreen() {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState } = useExperienceParticipation();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    return listDiscoverableExperiences().filter((e) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.areaLabel.toLowerCase().includes(q)
      );
    });
  }, [query]);

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Experiences aren’t available"
        description="This community hasn’t enabled experiences yet."
      />
    );
  }

  if (!hasCapability(CAPABILITIES.experienceView)) {
    return (
      <EmptyState
        title="You don’t have access"
        description="Experiences aren’t available for your account right now."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Discover
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8">
          Experiences
        </h1>
        <p className="mt-2 text-[16px] text-[var(--color-text-secondary)]">
          Find something to join in your community.
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Search experiences</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search walks, classes, gatherings…"
          className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 text-[16px] outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["This week", "Outdoors", "Wellbeing"].map((chip) => (
          <span
            key={chip}
            className={cn(
              "rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[13px] font-semibold text-[var(--color-text-secondary)]",
            )}
          >
            {chip}
          </span>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No experiences match"
          description="Try another search or check back soon."
          actionLabel="Clear search"
          onAction={() => setQuery("")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((exp) => {
            const viewer = getViewerState(exp);
            const remaining = spotsLeft(exp);
            const href = `/experiences/${exp.id}`;
            return (
              <ExperienceCard
                key={exp.id}
                title={exp.title}
                when={formatExperienceWhen(exp.startsAt)}
                where={exp.location}
                meta={`${exp.participantCount} going · ${remaining} left`}
                imageUrl={exp.imageUrl}
                organizerName={exp.organizer.name}
                statusLabel={statusLabelFor(viewer, remaining)}
                ctaLabel={viewer === "joined" ? "View" : "View & join"}
                onClick={() => router.push(href)}
                onCta={() => router.push(href)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
