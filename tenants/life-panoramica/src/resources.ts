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
    name: "Padel Court 2",
    description:
      "Outdoor padel court with lighting. Ideal for friendly matches and practice. Please leave the court tidy for the next neighbours.",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80",
    location: "Sports area · Court 2",
    areaLabel: "Aldea Golf",
    type: "sports_facility",
    rules: [
      "Max 90 minutes per booking",
      "Cancel at least 2 hours ahead",
      "Non-marking shoes only",
      "Guests must be accompanied by a member",
    ],
    slotMinutes: 90,
    capacity: 1,
    availabilityPreview: "Today 17:00",
  },
  {
    id: "res-community-room",
    name: "Community room",
    description:
      "Bright shared room for small meetings, workshops and neighbour gatherings. Tables and chairs included.",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
    location: "Main building · Ground floor",
    areaLabel: "Detinsa",
    type: "space",
    rules: [
      "Approval may be required for events over 12 people",
      "Leave furniture as you found it",
      "No overnight use",
    ],
    slotMinutes: 60,
    capacity: 1,
    availabilityPreview: "Tomorrow 10:00",
    requiresApproval: true,
  },
  {
    id: "res-bbq",
    name: "BBQ terrace",
    description:
      "Shared outdoor grill area with picnic tables. Perfect for small gatherings at golden hour.",
    imageUrl:
      "https://images.unsplash.com/photo-1555939596-19271ee170b3?auto=format&fit=crop&w=1400&q=80",
    location: "Aldea Golf terrace",
    areaLabel: "Aldea Golf",
    type: "amenity",
    rules: [
      "Clean the grill after use",
      "Quiet hours from 22:00",
      "Max 3 hours per booking",
    ],
    slotMinutes: 180,
    capacity: 1,
    availabilityPreview: "Sat 19:00",
  },
  {
    id: "res-padel-1",
    name: "Padel Court 1",
    description:
      "Primary padel court near the entrance. Same community rules as Court 2.",
    imageUrl:
      "https://images.unsplash.com/photo-1626224582411-c8120bdb77e2?auto=format&fit=crop&w=1400&q=80",
    location: "Sports area · Court 1",
    areaLabel: "Aldea Golf",
    type: "sports_facility",
    rules: [
      "Max 90 minutes per booking",
      "Cancel at least 2 hours ahead",
      "Non-marking shoes only",
    ],
    slotMinutes: 90,
    capacity: 1,
    availabilityPreview: "Today 18:30",
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
  const label = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  if (date === today) return `Today · ${label}`;
  if (date === tomorrow) return `Tomorrow · ${label}`;
  return label;
}

export function formatResourceDayHeading(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const today = dateOffset(0);
  const tomorrow = dateOffset(1);
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(d);
  if (date === today) return `Today · ${weekday}`;
  if (date === tomorrow) return `Tomorrow · ${weekday}`;
  return weekday;
}

export function reservationStatusLabel(status: ReservationStatus): string {
  switch (status) {
    case "reserved":
      return "Reserved";
    case "pending":
      return "Pending";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Past";
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
