"use client";

import { useState } from "react";
import { calendarItems } from "@life-community-os/tenant-life-panoramica";
import { EmptyState } from "@life-community-os/ui";
import { cn } from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";

export function CalendarScreen() {
  const { isFeatureEnabled } = useTenant();
  const [view, setView] = useState<"agenda" | "month">("agenda");
  const [registeredOnly, setRegisteredOnly] = useState(false);

  if (!isFeatureEnabled("calendar")) {
    return (
      <EmptyState
        title="Calendar is not available"
        description="This community hasn’t enabled the calendar yet."
      />
    );
  }

  const items = registeredOnly
    ? calendarItems.filter((i) => i.status === "Going" || i.status === "Reserved")
    : calendarItems;

  const days = [...new Set(items.map((i) => i.day))];

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
          Registered only
        </button>
        <span className="min-h-[40px] rounded-full bg-[var(--color-surface-elevated)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-secondary)]">
          All areas
        </span>
      </div>

      {view === "month" ? (
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
          <p className="text-[16px] font-semibold">This month</p>
          <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
            Days with activity show a soft pine mark. Open Agenda for details —
            keeping the calendar human, not corporate.
          </p>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[13px]">
            {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
              <span key={d} className="text-[var(--color-text-tertiary)]">
                {d}
              </span>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 2;
              const has = day === 11 || day === 12 || day === 14;
              return (
                <span
                  key={i}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-full",
                    has && "bg-[var(--color-action-primary-subtle)] font-semibold text-[var(--color-action-primary)]",
                  )}
                >
                  {day > 0 && day <= 31 ? day : ""}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "agenda" ? (
        items.length === 0 ? (
          <EmptyState
            title="Your week is open"
            description="Discover something nearby to fill the days."
            actionLabel="Discover"
            onAction={() => {
              window.location.href = "/discover";
            }}
          />
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <section key={day}>
                <h2 className="mb-3 text-[18px] font-semibold">{day}</h2>
                <ul className="space-y-3">
                  {items
                    .filter((i) => i.day === day)
                    .map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 text-left shadow-[var(--shadow-elev-1)]"
                        >
                          <span
                            className={cn(
                              "h-2.5 w-2.5 shrink-0 rounded-full",
                              item.kind === "reservation"
                                ? "bg-[var(--color-sea)]"
                                : "bg-[var(--color-action-primary)]",
                            )}
                            aria-hidden
                          />
                          {"imageUrl" in item && item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-10 w-10 rounded-[var(--radius-sm)] object-cover"
                            />
                          ) : null}
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                              {item.time}
                            </span>
                            <span className="block truncate text-[16px] font-semibold">
                              {item.title}
                            </span>
                            <span className="block text-[13px] text-[var(--color-text-tertiary)]">
                              {item.place} · {item.status}
                            </span>
                          </span>
                        </button>
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
