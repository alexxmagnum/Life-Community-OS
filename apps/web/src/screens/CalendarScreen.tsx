"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceDay,
  formatExperienceTime,
  formatResourceDayHeading,
} from "@life-community-os/tenant-life-panoramica";
import {
  CalendarEventCard,
  CalendarReservationCard,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { useReservations } from "@/providers/ReservationProvider";
import { reservationBadgeStatus } from "@/lib/reservations/presentation";

export function CalendarScreen() {
  const router = useRouter();
  const { isFeatureEnabled } = useTenant();
  const { joinedExperiences } = useExperienceParticipation();
  const { upcoming: upcomingReservations } = useReservations();

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
        imageUrl: exp.imageUrl ?? "",
        href: `/experiences/${exp.id}`,
      }));
  }, [joinedExperiences]);

  const reservationAgenda = useMemo(() => {
    return upcomingReservations.map((r) => ({
      id: r.id,
      day: formatResourceDayHeading(r.date),
      time: r.start,
      title: r.resourceName ?? "Reserva",
      place: r.location ?? "",
      status:
        reservationBadgeStatus(r.status) === "pending"
          ? "Pendiente"
          : reservationBadgeStatus(r.status) === "cancelled"
            ? "Cancelado"
            : reservationBadgeStatus(r.status) === "expired"
              ? "Pasado"
              : "Reservado",
      kind: "reservation" as const,
      imageUrl: r.resourceImageUrl ?? "",
      href: `/resources/${r.resourceId}`,
    }));
  }, [upcomingReservations]);

  const allItems = useMemo(() => {
    return [...joinedAgenda, ...reservationAgenda].sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      return a.time.localeCompare(b.time);
    });
  }, [joinedAgenda, reservationAgenda]);

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
    <MobileScreen>
      <FlowScreenHeader
        title="Mi agenda"
        subtitle="Lo que tienes apuntado en la comunidad."
        onBack={() => router.push("/")}
        onExit={() => router.push("/me")}
      />

      <button
        type="button"
        onClick={() => router.push("/reservations")}
        className="self-start text-[14px] font-semibold text-[var(--color-action-primary)]"
      >
        Reservas
      </button>

      {allItems.length === 0 ? (
        <EmptyState
          title="Tu semana está libre"
          description="Únete a una experiencia o reserva un espacio y aparecerá aquí."
          actionLabel="Ver experiencias"
          onAction={() => router.push("/experiences")}
        />
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <section key={day} className="space-y-3">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                {day}
              </h2>
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
                          imageUrl={item.imageUrl ?? ""}
                          onClick={() => router.push(item.href)}
                        />
                      ) : (
                        <CalendarEventCard
                          time={item.time}
                          title={item.title}
                          place={item.place}
                          statusLabel={item.status}
                          imageUrl={item.imageUrl ?? ""}
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
      )}
    </MobileScreen>
  );
}
