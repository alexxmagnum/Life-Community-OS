"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calendarItems,
  formatExperienceDay,
  formatExperienceTime,
} from "@life-community-os/tenant-life-panoramica";
import {
  CalendarEventCard,
  EmptyState,
  SectionHeader,
  cn,
} from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

export function CalendarScreen() {
  const router = useRouter();
  const { isFeatureEnabled } = useTenant();
  const { joinedExperiences } = useExperienceParticipation();
  const [view, setView] = useState<"agenda" | "month">("agenda");
  const [registeredOnly, setRegisteredOnly] = useState(false);

  const joinedAgenda = useMemo(() => {
    return joinedExperiences
      .filter((e) => e.status !== "cancelled" && e.status !== "expired")
      .map((exp) => ({
        id: exp.id,
        day: formatExperienceDay(exp.startsAt),
        time: formatExperienceTime(exp.startsAt),
        title: exp.title,
        place: exp.location,
        status: "Going" as const,
        kind: "experience" as const,
        imageUrl: exp.imageUrl,
        href: `/experiences/${exp.id}`,
        sortAt: new Date(exp.startsAt).getTime(),
      }));
  }, [joinedExperiences]);

  const staticItems = useMemo(() => {
    return calendarItems
      .filter((i) => i.kind !== "experience")
      .map((item) => ({
        id: item.id,
        day: item.day,
        time: item.time.includes("–")
          ? item.time.split("–")[0] ?? item.time
          : item.time,
        title: item.title,
        place: item.place,
        status: item.status,
        kind: item.kind,
        imageUrl: "imageUrl" in item ? item.imageUrl : undefined,
        href: "/calendar",
        sortAt: 0,
      }));
  }, []);

  const allItems = useMemo(() => {
    const merged = [...joinedAgenda, ...staticItems];
    if (registeredOnly) {
      return merged.filter(
        (i) => i.status === "Going" || i.status === "Reserved",
      );
    }
    // Also show open community experiences? Keep calendar personal + reservations.
    return merged.sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      return a.time.localeCompare(b.time);
    });
  }, [joinedAgenda, staticItems, registeredOnly]);

  const days = [...new Set(allItems.map((i) => i.day))];

  if (!isFeatureEnabled("calendar")) {
    return (
      <EmptyState
        title="Calendar is not available"
        description="This community hasn’t enabled the calendar yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold">
          Calendar
        </h1>
        <div className="flex rounded-full bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-elev-1)]">
          {(["agenda", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "min-h-[36px] rounded-full px-3 text-[13px] font-semibold capitalize",
                view === v
                  ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                  : "text-[var(--color-text-secondary)]",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setRegisteredOnly((v) => !v)}
          className={cn(
            "min-h-[40px] rounded-full px-4 text-[13px] font-semibold",
            registeredOnly
              ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
          )}
        >
          My activities
        </button>
        <span className="min-h-[40px] rounded-full bg-[var(--color-surface-elevated)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-secondary)]">
          All areas
        </span>
      </div>

      {joinedAgenda.length > 0 ? (
        <section className="rounded-[var(--radius-xl)] bg-[var(--color-action-primary-subtle)] p-4">
          <SectionHeader title="My activities" />
          <ul className="space-y-3">
            {joinedAgenda.map((item) => (
              <li key={`mine-${item.id}`}>
                <CalendarEventCard
                  time={item.time}
                  title={item.title}
                  place={item.place}
                  statusLabel="Going"
                  imageUrl={item.imageUrl}
                  kind="experience"
                  onClick={() => router.push(item.href)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view === "month" ? (
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
          <p className="text-[16px] font-semibold">This month</p>
          <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
            Your joined experiences appear in My activities above. Agenda keeps
            the day-by-day view human and calm.
          </p>
        </div>
      ) : null}

      {view === "agenda" ? (
        allItems.length === 0 ? (
          <EmptyState
            title="Your week is open"
            description="Join an experience and it will show up here."
            actionLabel="Discover experiences"
            onAction={() => router.push("/discover?segment=experiences")}
          />
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <section key={day}>
                <h2 className="mb-3 text-[18px] font-semibold">{day}</h2>
                <ul className="space-y-3">
                  {allItems
                    .filter((i) => i.day === day)
                    .map((item) => (
                      <li key={`${item.kind}-${item.id}`}>
                        <CalendarEventCard
                          time={item.time}
                          title={item.title}
                          place={item.place}
                          statusLabel={item.status}
                          imageUrl={item.imageUrl}
                          kind={
                            item.kind === "reservation"
                              ? "reservation"
                              : "experience"
                          }
                          onClick={() => {
                            if (item.href.startsWith("/experiences")) {
                              router.push(item.href);
                            }
                          }}
                        />
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
