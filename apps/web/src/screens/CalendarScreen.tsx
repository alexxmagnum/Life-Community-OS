"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceDay,
  formatExperienceTime,
  formatResourceDayHeading,
  reservationStatusLabel,
} from "@life-community-os/tenant-life-panoramica";
import {
  CalendarEventCard,
  CalendarReservationCard,
  EmptyState,
  SectionHeader,
  cn,
} from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { useReservations } from "@/providers/ReservationProvider";

export function CalendarScreen() {
  const router = useRouter();
  const { isFeatureEnabled } = useTenant();
  const { joinedExperiences } = useExperienceParticipation();
  const { upcoming: upcomingReservations } = useReservations();
  const [view, setView] = useState<"agenda" | "month">("agenda");
  const [filter, setFilter] = useState<"all" | "mine">("all");

  const joinedAgenda = useMemo(() => {
    return joinedExperiences
      .filter((e) => e.status !== "cancelled" && e.status !== "expired")
      .map((exp) => ({
        id: exp.id,
        day: formatExperienceDay(exp.startsAt),
        time: formatExperienceTime(exp.startsAt),
        title: exp.title,
        place: exp.location,
        status: "Vas a ir" as const,
        kind: "experience" as const,
        imageUrl: exp.imageUrl,
        href: `/experiences/${exp.id}`,
      }));
  }, [joinedExperiences]);

  const reservationAgenda = useMemo(() => {
    return upcomingReservations.map((r) => ({
      id: r.id,
      day: formatResourceDayHeading(r.date),
      time: r.start,
      title: r.resourceName,
      place: r.location,
      status: reservationStatusLabel(r.status),
      kind: "reservation" as const,
      imageUrl: r.resourceImageUrl,
      href: `/resources/${r.resourceId}`,
    }));
  }, [upcomingReservations]);

  const allItems = useMemo(() => {
    const merged = [...joinedAgenda, ...reservationAgenda];
    return merged.sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      return a.time.localeCompare(b.time);
    });
  }, [joinedAgenda, reservationAgenda, filter]);

  const days = [...new Set(allItems.map((i) => i.day))];

  if (!isFeatureEnabled("calendar")) {
    return (
      <EmptyState
        title="La agenda no está disponible"
        description="Esta comunidad aún no ha activado la agenda."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold">
          Agenda
        </h1>
        <div className="flex rounded-full bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-elev-1)]">
          {(
            [
              { id: "agenda" as const, label: "Lista" },
              { id: "month" as const, label: "Mes" },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "min-h-[36px] rounded-full px-3 text-[13px] font-semibold",
                view === v.id
                  ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                  : "text-[var(--color-text-secondary)]",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter("mine")}
          className={cn(
            "min-h-[40px] rounded-full px-4 text-[13px] font-semibold",
            filter === "mine"
              ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
          )}
        >
          Mis planes
        </button>
        <button
          type="button"
          onClick={() => router.push("/reservations")}
          className="min-h-[40px] rounded-full bg-[var(--color-surface-elevated)] px-4 text-[13px] font-semibold text-[var(--color-text-secondary)]"
        >
          Mis reservas
        </button>
      </div>

      {reservationAgenda.length > 0 ? (
        <section className="rounded-[var(--radius-xl)] bg-[var(--color-sea-subtle)] p-4">
          <SectionHeader title="Mis reservas" />
          <ul className="space-y-3">
            {reservationAgenda.map((item) => (
              <li key={`res-${item.id}`}>
                <CalendarReservationCard
                  time={item.time}
                  title={item.title}
                  place={item.place}
                  statusLabel={item.status}
                  imageUrl={item.imageUrl}
                  onClick={() => router.push(item.href)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {joinedAgenda.length > 0 ? (
        <section className="rounded-[var(--radius-xl)] bg-[var(--color-action-primary-subtle)] p-4">
          <SectionHeader title="Mis actividades" />
          <ul className="space-y-3">
            {joinedAgenda.map((item) => (
              <li key={`mine-${item.id}`}>
                <CalendarEventCard
                  time={item.time}
                  title={item.title}
                  place={item.place}
                  statusLabel="Vas a ir"
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
          <p className="text-[16px] font-semibold">Este mes</p>
          <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
            Tus actividades y reservas aparecen arriba. La lista mantiene el día
            a día claro y calmado.
          </p>
        </div>
      ) : null}

      {view === "agenda" ? (
        allItems.length === 0 ? (
          <EmptyState
            title="Tu semana está libre"
            description="Únete a un plan o reserva un espacio y aparecerá aquí."
            actionLabel="Descubrir lugares"
            onAction={() => router.push("/resources")}
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
                        {item.kind === "reservation" ? (
                          <CalendarReservationCard
                            time={item.time}
                            title={item.title}
                            place={item.place}
                            statusLabel={item.status}
                            imageUrl={item.imageUrl}
                            onClick={() => router.push(item.href)}
                          />
                        ) : (
                          <CalendarEventCard
                            time={item.time}
                            title={item.title}
                            place={item.place}
                            statusLabel={item.status}
                            imageUrl={item.imageUrl}
                            kind="experience"
                            onClick={() => router.push(item.href)}
                          />
                        )}
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
