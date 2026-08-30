/**
 * Universal Reservation Context isolation tests (Phase 17E).
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { combineDateAndTime, dateOffsetIso } from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import {
  createExperienceServer,
  joinExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import {
  actorCanCancelReservation,
  actorCanCreateReservation,
} from "./permissions";
import {
  createReservationServer,
  createResourceServer,
  listAvailabilityServer,
  listReservationAvailabilityServer,
  listReservationsServer,
  replaceReservationsStoreForTests,
  updateReservationServer,
} from "./server-reservations-repository";

process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(input: {
  tenantSlug: string;
  role: RequestActor["role"];
  personId: string;
  hasMembership?: boolean;
  territoryId?: string;
}): RequestActor {
  const hasMembership = input.hasMembership ?? true;
  return {
    authenticated: true,
    hasMembership,
    providerReference: "auth-user",
    personId: input.personId,
    role: input.role,
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : null,
    permissions: hasMembership ? permissionsForRole(input.role) : [],
    tenantDenied: false,
    territoryId: input.territoryId,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership,
      personId: input.personId,
      tenantId: input.tenantSlug,
      role: input.role,
    },
  };
}

async function staffCourt(tenantId: string, createdBy: string, name: string) {
  return createResourceServer({
    tenantId,
    createdBy,
    name,
    description: "Pista de prueba para reservas de la comunidad.",
    category: "sport",
    location: "Club deportivo",
    capacity: 1,
    slotMinutes: 60,
  });
}

async function firstSlot(resourceId: string, tenantId = PANO) {
  const date = dateOffsetIso(0);
  const slots = await listAvailabilityServer(tenantId, resourceId, date);
  const slot = slots.find((item) => item.status === "available");
  return { date, slot };
}

describe("reservation context isolation", () => {
  beforeEach(async () => {
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
  });

  it("TEST 1: resource reservation works", async () => {
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
    const member = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-member",
    });
    const resource = await staffCourt(PANO, admin.personId!, "Pista pádel");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    const reservation = await createReservationServer({
      tenantId: PANO,
      createdBy: member.personId!,
      context: { type: "resource", id: resource.id },
      date,
      start: slot.start,
      end: slot.end,
    });
    assert.equal(reservation.status, "confirmed");
    assert.equal(reservation.contextType, "resource");
    assert.equal(reservation.contextId, resource.id);
    assert.equal(reservation.resourceId, resource.id);
    assert.equal(reservation.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    const aligned = await listReservationAvailabilityServer({
      tenantId: PANO,
      context: { type: "resource", id: resource.id },
      date,
    });
    assert.equal(
      aligned.find((item) => item.start === slot.start)?.status,
      "occupied",
    );
  });

  it("TEST 2: experience reservation works", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Sala wellness",
      description: "Sala para clases de yoga.",
      category: "facility",
      location: "Club",
      capacity: 8,
      slotMinutes: 60,
    });
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    const experience = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Clase de yoga",
      description: "Sesión en el territorio.",
      category: "wellness",
      resourceId: resource.id,
      startsAt: combineDateAndTime(date, slot!.start),
      endsAt: combineDateAndTime(date, slot!.end),
      capacity: 8,
    });
    const reservation = await createReservationServer({
      tenantId: PANO,
      createdBy: "person-maria",
      context: { type: "experience", id: experience.id },
    });
    assert.equal(reservation.status, "confirmed");
    assert.equal(reservation.contextType, "experience");
    assert.equal(reservation.contextId, experience.id);
    assert.equal(reservation.experienceId, experience.id);
    assert.equal(reservation.resourceId, resource.id);
    assert.equal(reservation.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
  });

  it("TEST 3: experience without resource books a seat", async () => {
    const experience = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Taller vecinal",
      description: "Actividad sin inventario físico.",
      category: "social",
      startsAt: "2026-09-06T10:00:00.000Z",
      capacity: 8,
    });
    const participation = await joinExperienceServer({
      tenantId: PANO,
      experienceId: experience.id,
      personId: "person-maria",
    });
    assert.equal(participation.role, "participant");
    assert.ok(participation.reservationId);
    const reservations = await listReservationsServer(PANO);
    const linked = reservations.find(
      (item) => item.id === participation.reservationId,
    );
    assert.ok(linked);
    assert.equal(linked!.contextType, "experience");
    assert.equal(linked!.contextId, experience.id);
    assert.equal(linked!.resourceId, undefined);
    assert.equal(linked!.experienceId, experience.id);
    const slots = await listReservationAvailabilityServer({
      tenantId: PANO,
      context: { type: "experience", id: experience.id },
    });
    assert.equal(slots.length, 1);
    assert.equal(slots[0]?.status, "available");
  });

  it("TEST 4: resource in another territory is denied", async () => {
    const resource = await staffCourt(PANO, "person-admin", "Pista local");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    await assert.rejects(
      () =>
        createReservationServer({
          tenantId: PANO,
          createdBy: "person-member",
          resourceId: resource.id,
          date,
          start: slot!.start,
          end: slot!.end,
          territoryId: LIFE_VALLEY_TERRITORY_UUID,
        }),
      /territory_context_mismatch/,
    );
  });

  it("TEST 5: experience in another territory is denied", async () => {
    const experience = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Clase Panorámica",
      description: "Solo de este territorio.",
      startsAt: "2026-09-06T09:00:00.000Z",
    });
    await assert.rejects(
      () =>
        createReservationServer({
          tenantId: PANO,
          createdBy: "person-member",
          context: { type: "experience", id: experience.id },
          territoryId: LIFE_VALLEY_TERRITORY_UUID,
        }),
      /territory_context_mismatch/,
    );
    await assert.rejects(
      () =>
        createReservationServer({
          tenantId: VALLEY,
          createdBy: "person-valley",
          context: { type: "experience", id: experience.id },
        }),
      /context_not_found/,
    );
  });

  it("TEST 6: user without membership is denied", () => {
    const guest = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-guest",
      hasMembership: false,
    });
    assert.equal(actorCanCreateReservation(guest), false);
    assert.equal(actorCanCreateReservation(guest, "resource"), false);
    assert.equal(actorCanCreateReservation(guest, "experience"), false);
  });

  it("TEST 7: cancel own reservation", async () => {
    const resource = await staffCourt(PANO, "person-admin", "Sala");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    const member = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-member",
    });
    const created = await createReservationServer({
      tenantId: PANO,
      createdBy: member.personId!,
      resourceId: resource.id,
      date,
      start: slot.start,
      end: slot.end,
    });
    assert.equal(actorCanCancelReservation(member, created), true);
    const cancelled = await updateReservationServer({
      tenantId: PANO,
      reservationId: created.id,
      status: "cancelled",
    });
    assert.equal(cancelled?.status, "cancelled");
  });

  it("TEST 8: cancel someone else's reservation is denied", async () => {
    const resource = await staffCourt(PANO, "person-admin", "Gimnasio");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-owner",
    });
    const other = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-other",
    });
    const created = await createReservationServer({
      tenantId: PANO,
      createdBy: owner.personId!,
      resourceId: resource.id,
      date,
      start: slot.start,
      end: slot.end,
    });
    assert.equal(actorCanCancelReservation(other, created), false);
  });

  it("TEST 9: Valley does not see Panorámica reservations", async () => {
    const resource = await staffCourt(PANO, "person-admin", "Pista Pano");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    const created = await createReservationServer({
      tenantId: PANO,
      createdBy: "person-pano",
      resourceId: resource.id,
      date,
      start: slot.start,
      end: slot.end,
    });
    const valleyList = await listReservationsServer(VALLEY);
    assert.equal(
      valleyList.some((item) => item.id === created.id),
      false,
    );
    assert.equal(
      valleyList.some((item) => item.territoryId === LIFE_PANORAMICA_TERRITORY_UUID),
      false,
    );
  });
});
