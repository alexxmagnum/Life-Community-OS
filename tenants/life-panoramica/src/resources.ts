/**
 * Resources & Reservations — tenant-neutral capability (ADR-031).
 * Shared community assets — not a commercial booking marketplace.
 * Mock catalog ready for future API replacement.
 */

export type ResourceType =
  | "sports_facility"
  | "space"
  | "amenity"
  | "equipment"
  | "custom";

export type SlotStatus = "available" | "occupied";

/** User-facing reservation status (product surface). */
export type ReservationStatus =
  | "reserved"
  | "pending"
  | "cancelled"
  | "expired";

export type CommunityResource = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  areaLabel: string;
  type: ResourceType;
  rules: string[];
  /** Minutes per bookable slot */
  slotMinutes: number;
  /** Max simultaneous capacity (1 = exclusive) */
  capacity: number;
  /** Human preview e.g. "Today 17:00" */
  availabilityPreview: string;
  requiresApproval?: boolean;
};

export type TimeSlot = {
  id: string;
  /** HH:mm */
  start: string;
  end: string;
  status: SlotStatus;
};

export type Reservation = {
  id: string;
  resourceId: string;
  /** YYYY-MM-DD */
  date: string;
  start: string;
  end: string;
  status: ReservationStatus;
  createdAt: string;
  resourceName: string;
  resourceImageUrl: string;
  location: string;
  areaLabel: string;
};

function dateOffset(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const resourceCatalog: CommunityResource[] = [
  {
    id: "res-padel-2",
    name: "Pista de pádel 2",
    description:
      "Pista exterior con iluminación. Ideal para partidos amistosos y práctica. Déjala ordenada para los siguientes vecinos.",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80",
    location: "Zona deportiva · Pista 2",
    areaLabel: "Life Panoramica",
    type: "sports_facility",
    rules: [
      "Máximo 90 minutos por reserva",
      "Cancela con al menos 2 horas de antelación",
      "Solo calzado que no marque",
      "Los invitados deben ir acompañados de un miembro",
    ],
    slotMinutes: 90,
    capacity: 1,
    availabilityPreview: "Hoy 17:00",
  },
  {
    id: "res-community-room",
    name: "Sala comunitaria",
    description:
      "Sala luminosa para reuniones pequeñas, talleres y encuentros de vecinos. Mesas y sillas incluidas.",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
    location: "Edificio principal · Planta baja",
    areaLabel: "Centro",
    type: "space",
    rules: [
      "Puede requerir aprobación para eventos de más de 12 personas",
      "Deja el mobiliario como lo encontraste",
      "Sin uso nocturno",
    ],
    slotMinutes: 60,
    capacity: 1,
    availabilityPreview: "Mañana 10:00",
    requiresApproval: true,
  },
  {
    id: "res-bbq",
    name: "Terraza BBQ",
    description:
      "Zona de grill compartida con mesas de picnic. Perfecta para encuentros pequeños a la hora dorada.",
    imageUrl:
      "https://images.unsplash.com/photo-1555939596-19271ee170b3?auto=format&fit=crop&w=1400&q=80",
    location: "Terraza · Zona norte",
    areaLabel: "Zona norte",
    type: "amenity",
    rules: [
      "Limpia el grill después de usarlo",
      "Horario de silencio desde las 22:00",
      "Máximo 3 horas por reserva",
    ],
    slotMinutes: 180,
    capacity: 1,
    availabilityPreview: "Sáb 19:00",
  },
  {
    id: "res-padel-1",
    name: "Pista de pádel 1",
    description:
      "Pista principal cerca de la entrada. Mismas normas comunitarias que la pista 2.",
    imageUrl:
      "https://images.unsplash.com/photo-1626224582411-c8120bdb77e2?auto=format&fit=crop&w=1400&q=80",
    location: "Zona deportiva · Pista 1",
    areaLabel: "Zona norte",
    type: "sports_facility",
    rules: [
      "Máximo 90 minutos por reserva",
      "Cancela con al menos 2 horas de antelación",
      "Solo calzado que no marque",
    ],
    slotMinutes: 90,
    capacity: 1,
    availabilityPreview: "Hoy 18:30",
  },
];

/** Baseline occupied slots by resource + date (mock inventory). */
const occupiedBaseline: Record<string, Record<string, string[]>> = {
  "res-padel-2": {
    [dateOffset(0)]: ["09:00", "10:30", "15:30"],
    [dateOffset(1)]: ["11:00", "17:00"],
  },
  "res-community-room": {
    [dateOffset(0)]: ["09:00", "14:00"],
    [dateOffset(1)]: ["10:00"],
  },
  "res-bbq": {
    [dateOffset(2)]: ["19:00"],
  },
  "res-padel-1": {
    [dateOffset(0)]: ["08:00", "16:00", "17:30"],
  },
};

function buildSlotsForDay(
  resource: CommunityResource,
  date: string,
  extraOccupiedStarts: string[] = [],
): TimeSlot[] {
  const openHour = 8;
  const closeHour = 21;
  const step = resource.slotMinutes;
  const occupied = new Set([
    ...(occupiedBaseline[resource.id]?.[date] ?? []),
    ...extraOccupiedStarts,
  ]);

  const slots: TimeSlot[] = [];
  for (let minutes = openHour * 60; minutes + step <= closeHour * 60; minutes += step) {
    const sh = Math.floor(minutes / 60);
    const sm = minutes % 60;
    const eh = Math.floor((minutes + step) / 60);
    const em = (minutes + step) % 60;
    const start = `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`;
    const end = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    slots.push({
      id: `${resource.id}-${date}-${start}`,
      start,
      end,
      status: occupied.has(start) ? "occupied" : "available",
    });
  }
  return slots;
}

export function getResourceById(id: string): CommunityResource | undefined {
  return resourceCatalog.find((r) => r.id === id);
}

export function listResources(): CommunityResource[] {
  return resourceCatalog;
}

export function getAvailabilitySlots(
  resourceId: string,
  date: string,
  userReservedStarts: string[] = [],
): TimeSlot[] {
  const resource = getResourceById(resourceId);
  if (!resource) return [];
  return buildSlotsForDay(resource, date, userReservedStarts);
}

export function listAvailabilityDates(days = 7): string[] {
  return Array.from({ length: days }, (_, i) => dateOffset(i));
}

export function formatResourceDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const today = dateOffset(0);
  const tomorrow = dateOffset(1);
  const label = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  if (date === today) return `Hoy · ${label}`;
  if (date === tomorrow) return `Mañana · ${label}`;
  return label;
}

export function formatResourceDayHeading(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const today = dateOffset(0);
  const tomorrow = dateOffset(1);
  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(d);
  if (date === today) return `Hoy · ${weekday}`;
  if (date === tomorrow) return `Mañana · ${weekday}`;
  return weekday;
}

export function reservationStatusLabel(status: ReservationStatus): string {
  switch (status) {
    case "reserved":
      return "Reservado";
    case "pending":
      return "Pendiente";
    case "cancelled":
      return "Cancelado";
    case "expired":
      return "Pasado";
    default:
      return status;
  }
}

export function deriveReservationStatus(
  reservation: Pick<Reservation, "date" | "end" | "status">,
  now = new Date(),
): ReservationStatus {
  if (reservation.status === "cancelled") return "cancelled";
  if (reservation.status === "pending") {
    const end = new Date(`${reservation.date}T${reservation.end}:00`);
    if (end.getTime() < now.getTime()) return "expired";
    return "pending";
  }
  const end = new Date(`${reservation.date}T${reservation.end}:00`);
  if (end.getTime() < now.getTime()) return "expired";
  return reservation.status === "reserved" ? "reserved" : reservation.status;
}
