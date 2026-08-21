/**
 * Resource / Reservation isolation, ownership, and availability tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { dateOffsetIso } from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  actorCanCancelReservation,
  actorCanCreateResource,
  resourceVisibleToActor,
} from "./permissions";
import {
  createReservationServer,
  createResourceServer,
  listAvailabilityServer,
  listReservationsServer,
  listResourcesServer,
  replaceReservationsStoreForTests,
  updateReservationServer,
} from "./server-reservations-repository";

process.env.LCOS_RESERVATIONS_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(input: {
  tenantSlug: string;
  role: RequestActor["role"];
  personId: string;
}): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId: input.personId,
    role: input.role,
    tenantSlug: input.tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(input.role),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId: input.personId,
      tenantId: input.tenantSlug,
      role: input.role,
    },
  };
}

async function firstSlot(resourceId: string, tenantId = PANO) {
  const date = dateOffsetIso(0);
  const slots = await listAvailabilityServer(tenantId, resourceId, date);
  const slot = slots.find((item) => item.status === "available");
  return { date, slot };
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

describe("reservations isolation", () => {
  beforeEach(async () => {
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
  });

  it("TEST 1: member reserves an available resource", async () => {
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
    const resource = await staffCourt(PANO, admin.personId!, "Pista pádel 1");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    const reservation = await createReservationServer({
      tenantId: PANO,
      createdBy: member.personId!,
      resourceId: resource.id,
      date,
      start: slot.start,
      end: slot.end,
    });
    const aligned = await listAvailabilityServer(PANO, resource.id, date);
    const booked = aligned.find((item) => item.start === slot.start);
    assert.equal(reservation.status, "confirmed");
    assert.equal(reservation.createdBy, member.personId);
    assert.equal(booked?.status, "occupied");
  });

  it("TEST 2: member cannot reserve another tenant resource", async () => {
    const valleyAdmin = actor({
      tenantSlug: VALLEY,
      role: "administrator",
      personId: "person-valley-admin",
    });
    const panoMember = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-pano",
    });
    const valleyResource = await staffCourt(
      VALLEY,
      valleyAdmin.personId!,
      "Pista Valley",
    );
    const panoList = await listResourcesServer(PANO);
    assert.equal(
      panoList.some((item) => item.id === valleyResource.id),
      false,
    );
    assert.equal(resourceVisibleToActor(panoMember, valleyResource), false);
    await assert.rejects(
      () =>
        createReservationServer({
          tenantId: PANO,
          createdBy: panoMember.personId!,
          resourceId: valleyResource.id,
          date: "2026-08-21",
          start: "10:00",
          end: "11:00",
        }),
      /resource_not_found/,
    );
  });

  it("TEST 3: member cancels own reservation", async () => {
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
    const resource = await staffCourt(PANO, admin.personId!, "Sala");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
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

  it("TEST 4: member cannot cancel someone else's reservation", async () => {
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
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
    const resource = await staffCourt(PANO, admin.personId!, "Gimnasio");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
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

  it("TEST 5: staff creates a resource", async () => {
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
    assert.equal(actorCanCreateResource(admin, "sport"), true);
    const resource = await staffCourt(PANO, admin.personId!, "Piscina");
    assert.equal(resource.category, "sport");
    assert.equal(resource.createdBy, admin.personId);
    const listed = await listResourcesServer(PANO);
    assert.equal(listed.some((item) => item.id === resource.id), true);
  });

  it("TEST 6: member cannot create an administrative resource", async () => {
    const member = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-member",
    });
    assert.equal(actorCanCreateResource(member, "sport"), false);
    assert.equal(actorCanCreateResource(member, "facility"), false);
    assert.equal(actorCanCreateResource(member, "activity"), true);
  });

  it("TEST 7: availability prevents double booking", async () => {
    const admin = actor({
      tenantSlug: PANO,
      role: "administrator",
      personId: "person-admin",
    });
    const first = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-one",
    });
    const second = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-two",
    });
    const resource = await staffCourt(PANO, admin.personId!, "Pista tenis");
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    await createReservationServer({
      tenantId: PANO,
      createdBy: first.personId!,
      resourceId: resource.id,
      date,
      start: slot.start,
      end: slot.end,
    });
    await assert.rejects(
      () =>
        createReservationServer({
          tenantId: PANO,
          createdBy: second.personId!,
          resourceId: resource.id,
          date,
          start: slot.start,
          end: slot.end,
        }),
      /slot_unavailable/,
    );
    const mine = await listReservationsServer(PANO);
    assert.equal(mine.filter((item) => item.resourceId === resource.id).length, 1);
  });
});
