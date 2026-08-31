import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReservationRecord } from "./resource";
import {
  createReservationContext,
  reservationContextOf,
  reservationMatchesContext,
} from "./reservation-context";

describe("Reservation Context", () => {
  it("backfills resource context from a legacy Reservation", () => {
    const reservation = createReservationRecord({
      tenantId: "life-panoramica",
      resourceId: "padel-court-1",
      createdBy: "person-alex",
      date: "2026-09-06",
      start: "10:00",
      end: "11:00",
      territoryId: "10000000-0000-4000-8000-000000000002",
    });
    const context = reservationContextOf(reservation);
    assert.equal(context.type, "resource");
    assert.equal(context.id, "padel-court-1");
    assert.equal(reservation.resourceId, "padel-court-1");
  });

  it("creates an Experience Reservation without a Resource", () => {
    const reservation = createReservationRecord({
      tenantId: "life-panoramica",
      createdBy: "person-alex",
      date: "2026-09-06",
      start: "09:00",
      end: "10:00",
      contextType: "experience",
      contextId: "yoga-1",
      experienceId: "yoga-1",
      territoryId: "10000000-0000-4000-8000-000000000002",
    });
    assert.equal(reservation.resourceId, undefined);
    assert.equal(reservation.contextType, "experience");
    assert.equal(reservation.contextId, "yoga-1");
    assert.equal(
      reservationMatchesContext(
        reservation,
        createReservationContext({ type: "experience", id: "yoga-1" }),
      ),
      true,
    );
  });

  it("creates a service Reservation Context without a new commerce type", () => {
    const reservation = createReservationRecord({
      tenantId: "life-panoramica",
      createdBy: "person-alex",
      resourceId: "massage-1",
      date: "2026-09-06",
      start: "11:00",
      end: "12:00",
      contextType: "service",
      contextId: "massage-1",
      territoryId: "10000000-0000-4000-8000-000000000002",
    });
    assert.equal(reservation.contextType, "service");
    assert.equal(reservation.contextId, "massage-1");
    assert.equal(reservation.resourceId, "massage-1");
    assert.equal(
      createReservationContext({ type: "service", id: "massage-1" }).type,
      "service",
    );
  });
});
