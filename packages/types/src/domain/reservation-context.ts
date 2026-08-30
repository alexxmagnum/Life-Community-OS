import type { DomainId } from "./ids";
import {
  intervalsOverlap,
  reservationIsActive,
  type Reservation,
} from "./resource";

/**
 * Universal Reservation Context — one Reservation for every bookable
 * territorial object. Not a per-module reservation type.
 */

export const RESERVATION_CONTEXT_TYPES = [
  "resource",
  "experience",
  "service",
  "event",
] as const;

export type ReservationContextType = (typeof RESERVATION_CONTEXT_TYPES)[number];

export type ReservationContext = {
  type: ReservationContextType;
  id: DomainId;
};

export const RESERVATION_PARTICIPANT_ROLES = [
  "creator",
  "participant",
  "guest",
  "waitlist",
] as const;

export type ReservationParticipantRole =
  (typeof RESERVATION_PARTICIPANT_ROLES)[number];

/**
 * Availability query bound to a Reservation Context.
 * Resource slots, Experience schedule and Service slots share this shape —
 * one engine, not three.
 */
export type ReservationAvailabilityContext = {
  tenantId: DomainId;
  territoryId?: DomainId;
  context: ReservationContext;
  date: string;
  start: string;
  end: string;
  resourceId?: DomainId;
  capacity: number;
};

const CONTEXT_SET: ReadonlySet<string> = new Set(RESERVATION_CONTEXT_TYPES);
const ROLE_SET: ReadonlySet<string> = new Set(RESERVATION_PARTICIPANT_ROLES);

export function isReservationContextType(
  value: string,
): value is ReservationContextType {
  return CONTEXT_SET.has(value);
}

export function isReservationParticipantRole(
  value: string,
): value is ReservationParticipantRole {
  return ROLE_SET.has(value);
}

export function createReservationContext(input: {
  type: string;
  id: string;
}): ReservationContext {
  const type = input.type.trim();
  const id = input.id.trim();
  if (!isReservationContextType(type)) {
    throw new Error("Invalid ReservationContext: invalid_type");
  }
  if (!id) throw new Error("Invalid ReservationContext: missing_id");
  return { type, id };
}

/**
 * Derive context from a Reservation, including pre-17E rows that only
 * stored resourceId / experienceId.
 */
export function reservationContextOf(
  reservation: Pick<
    Reservation,
    "contextType" | "contextId" | "resourceId" | "experienceId"
  >,
): ReservationContext {
  if (
    reservation.contextType &&
    isReservationContextType(reservation.contextType) &&
    reservation.contextId?.trim()
  ) {
    return { type: reservation.contextType, id: reservation.contextId };
  }
  if (reservation.experienceId?.trim()) {
    return { type: "experience", id: reservation.experienceId.trim() };
  }
  const resourceId = reservation.resourceId?.trim();
  if (!resourceId) {
    throw new Error("Invalid Reservation: missing_context");
  }
  return { type: "resource", id: resourceId };
}

export function reservationMatchesContext(
  reservation: Pick<
    Reservation,
    "contextType" | "contextId" | "resourceId" | "experienceId"
  >,
  context: ReservationContext,
): boolean {
  try {
    const current = reservationContextOf(reservation);
    return current.type === context.type && current.id === context.id;
  } catch {
    return false;
  }
}

export function occupyingReservationParticipantRoles(): readonly ReservationParticipantRole[] {
  return ["creator", "participant", "guest"];
}

export function reservationParticipantOccupiesSeat(
  role: ReservationParticipantRole | undefined,
): boolean {
  if (!role) return true;
  return role === "creator" || role === "participant" || role === "guest";
}

export function usedCapacityForContext(input: {
  reservations: readonly Reservation[];
  context: ReservationContext;
  date: string;
  start: string;
  end: string;
}): number {
  return input.reservations.reduce((sum, item) => {
    if (!reservationMatchesContext(item, input.context)) return sum;
    if (item.date !== input.date) return sum;
    if (!reservationIsActive(item.status)) return sum;
    if (!intervalsOverlap(item.start, item.end, input.start, input.end)) {
      return sum;
    }
    return (
      sum +
      (item.participantCount && item.participantCount > 0
        ? item.participantCount
        : 1)
    );
  }, 0);
}
