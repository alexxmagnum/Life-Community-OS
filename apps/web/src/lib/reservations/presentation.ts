import type { ReservationStatus } from "@life-community-os/types";

export function reservationBadgeStatus(
  status: ReservationStatus,
): "available" | "reserved" | "pending" | "cancelled" | "expired" {
  switch (status) {
    case "pending":
      return "pending";
    case "cancelled":
    case "rejected":
      return "cancelled";
    case "completed":
    case "expired":
      return "expired";
    default:
      return "reserved";
  }
}

export function upcomingDates(days = 7): string[] {
  const out: string[] = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function formatSlotDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}
