/**
 * Resources & Reservations — tenant demo catalog (ADR-031 / ADR-036).
 * Shared community assets — not a commercial booking marketplace.
 * Booking workflows are not implemented in this slice — inventory + access policy only.
 */

import type {
  ResourceAccessPolicy,
  ResourceOwnerKind,
  ResourceStatus,
} from "@life-community-os/types";
import { evaluateResourceAccess } from "@life-community-os/types";

import {
  DEMO_AREA_ALDEA_GOLF,
  DEMO_AREA_CENTRO,
  DEMO_AREA_ZONA_VERDE,
  DEMO_AUTHORITY_ADMIN_ID,
  DEMO_PERSON_JOHN,
  DEMO_PERSON_LUCIA,
  DEMO_PERSON_MARTA,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";
import { getVerifiedCommunityAreaIdsForPerson } from "./residency-demo";

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
  slotMinutes: number;
  capacity: number;
  availabilityPreview: string;
  requiresApproval?: boolean;
  tenantId?: string;
  territoryId?: string;
  communityAreaId?: string;
  ownerKind?: ResourceOwnerKind;
  ownerId?: string;
  bookable?: boolean;
  status?: ResourceStatus;
  accessPolicy?: ResourceAccessPolicy;
};

export type TimeSlot = {
  id: string;
  start: string;
  end: string;
  status: SlotStatus;
};

export type Reservation = {
  id: string;
  resourceId: string;
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

const authorityOwner = {
  tenantId: DEMO_TENANT_ID,
  territoryId: DEMO_TERRITORY_ID,
  ownerKind: "territory_authority" as const,
  ownerId: DEMO_AUTHORITY_ADMIN_ID,
  bookable: true,
  status: "active" as const,
};

export const resourceCatalog: CommunityResource[] = [
  {
    id: "res-padel-aldea",
    name: "Padel Court Aldea Golf",
    description:
      "Outdoor court for Aldea Golf residents. Other areas may see public info but cannot reserve (ADR-036).",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80",
    location: "Aldea Golf · Court 1",
    areaLabel: "Aldea Golf",
    type: "sports_facility",
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    ...authorityOwner,
    accessPolicy: {
      visibility: "territory",
      reservationScope: "community_area",
      reservationCommunityAreaIds: [DEMO_AREA_ALDEA_GOLF],
    },
    rules: [
      "Max 90 minutes per reservation",
      "Cancel at least 2 hours ahead",
      "Non-marking shoes only",
      "Requires active verified residency in Aldea Golf",
    ],
    slotMinutes: 90,
    capacity: 1,
    availabilityPreview: "Today 17:00",
  },
  {
    id: "res-padel-2",
    name: "Padel Court 2 (shared)",
    description:
      "Shared territorial court — any verified Territory member with reserve permission may book.",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80",
    location: "Sports zone · Court 2",
    areaLabel: "Panoramica Golf",
    type: "sports_facility",
    communityAreaId: DEMO_AREA_CENTRO,
    ...authorityOwner,
    accessPolicy: {
      visibility: "territory",
      reservationScope: "territory",
      sharedAcrossAreas: true,
    },
    rules: [
      "Max 90 minutes per reservation",
      "Cancel at least 2 hours ahead",
      "Non-marking shoes only",
    ],
    slotMinutes: 90,
    capacity: 1,
    availabilityPreview: "Today 17:00",
  },
  {
    id: "res-pool-zona-verde",
    name: "Zona Verde Pool",
    description:
      "Private area pool. Territory members may see it; only Zona Verde verified residents may reserve.",
    imageUrl:
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1400&q=80",
    location: "Zona Verde · Pool deck",
    areaLabel: "Zona Verde",
    type: "amenity",
    communityAreaId: DEMO_AREA_ZONA_VERDE,
    ...authorityOwner,
    accessPolicy: {
      visibility: "territory",
      reservationScope: "community_area",
      reservationCommunityAreaIds: [DEMO_AREA_ZONA_VERDE],
    },
    rules: [
      "Quiet hours from 22:00",
      "Requires active verified residency in Zona Verde",
    ],
    slotMinutes: 120,
    capacity: 1,
    availabilityPreview: "Sat 11:00",
  },
  {
    id: "res-community-room",
    name: "Community room",
    description:
      "Bright room for small meetings and neighbour gatherings. Shared territorial resource.",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
    location: "Main building · Ground floor",
    areaLabel: "Centro",
    type: "space",
    communityAreaId: DEMO_AREA_CENTRO,
    ...authorityOwner,
    accessPolicy: {
      visibility: "territory",
      reservationScope: "territory",
      sharedAcrossAreas: true,
    },
    rules: [
      "Approval may be required for events over 12 people",
      "Leave furniture as found",
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
    description: "Shared grill area with picnic tables.",
    imageUrl:
      "https://images.unsplash.com/photo-1555939596-19271ee170b3?auto=format&fit=crop&w=1400&q=80",
    location: "Terrace · North zone",
    areaLabel: "Centro",
    type: "amenity",
    communityAreaId: DEMO_AREA_CENTRO,
    ...authorityOwner,
    accessPolicy: {
      visibility: "territory",
      reservationScope: "territory",
      sharedAcrossAreas: true,
    },
    rules: [
      "Clean the grill after use",
      "Quiet hours from 22:00",
      "Max 3 hours per reservation",
    ],
    slotMinutes: 180,
    capacity: 1,
    availabilityPreview: "Sat 19:00",
  },
  {
    id: "res-padel-1",
    name: "Padel Court 1",
    description: "Main court near the entrance — shared territorial amenity.",
    imageUrl:
      "https://images.unsplash.com/photo-1626224582411-c8120bdb77e2?auto=format&fit=crop&w=1400&q=80",
    location: "Sports zone · Court 1",
    areaLabel: "Centro",
    type: "sports_facility",
    communityAreaId: DEMO_AREA_CENTRO,
    ...authorityOwner,
    accessPolicy: {
      visibility: "territory",
      reservationScope: "territory",
      sharedAcrossAreas: true,
    },
    rules: [
      "Max 90 minutes per reservation",
      "Cancel at least 2 hours ahead",
      "Non-marking shoes only",
    ],
    slotMinutes: 90,
    capacity: 1,
    availabilityPreview: "Today 18:30",
  },
  {
    id: "res-tennis-aldea",
    name: "Tennis Court Aldea Golf",
    description: "Aldea Golf–scoped tennis court (Authority-owned).",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80",
    location: "Aldea Golf · Tennis",
    areaLabel: "Aldea Golf",
    type: "sports_facility",
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    ...authorityOwner,
    accessPolicy: {
      visibility: "territory",
      reservationScope: "community_area",
      reservationCommunityAreaIds: [DEMO_AREA_ALDEA_GOLF],
    },
    rules: ["Requires active verified residency in Aldea Golf"],
    slotMinutes: 60,
    capacity: 1,
    availabilityPreview: "Tomorrow 09:00",
  },
];

const occupiedBaseline: Record<string, Record<string, string[]>> = {
  "res-padel-aldea": {
    [dateOffset(0)]: ["09:00", "10:30"],
  },
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
  "res-pool-zona-verde": {
    [dateOffset(0)]: ["11:00"],
  },
  "res-tennis-aldea": {
    [dateOffset(1)]: ["09:00"],
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
  for (
    let minutes = openHour * 60;
    minutes + step <= closeHour * 60;
    minutes += step
  ) {
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

/** Demo access evaluation — eligibility only, no booking workflow. */
export function evaluateDemoResourceAccessForPerson(
  resourceId: string,
  personId: string,
  canReservePermission = true,
) {
  const resource = getResourceById(resourceId);
  if (!resource) {
    return {
      canViewPublicInfo: false,
      canReserve: false,
      reasons: ["resource_not_found"],
    };
  }
  return evaluateResourceAccess(
    {
      tenantId: resource.tenantId,
      territoryId: resource.territoryId,
      communityAreaId: resource.communityAreaId,
      bookable: resource.bookable ?? true,
      status: resource.status ?? "active",
      accessPolicy: resource.accessPolicy,
    },
    {
      tenantId: DEMO_TENANT_ID,
      territoryId: DEMO_TERRITORY_ID,
      communityAreaIds: getVerifiedCommunityAreaIdsForPerson(personId),
      canReservePermission,
    },
  );
}

export function demoResourceAccessMatrix() {
  const resourceId = "res-padel-aldea";
  return {
    resourceId,
    marta: evaluateDemoResourceAccessForPerson(resourceId, DEMO_PERSON_MARTA),
    johnPendingClaim: evaluateDemoResourceAccessForPerson(
      resourceId,
      DEMO_PERSON_JOHN,
    ),
    luciaOtherArea: evaluateDemoResourceAccessForPerson(
      resourceId,
      DEMO_PERSON_LUCIA,
    ),
  };
}
