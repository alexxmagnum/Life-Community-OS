/**
 * Experience domain isolation, ownership, and territory tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { combineDateAndTime } from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import {
  actorCanCancelExperience,
  actorCanCreateExperience,
  actorCanJoinExperience,
} from "./permissions";
import {
  cancelExperienceServer,
  createExperienceServer,
  getExperienceServer,
  joinExperienceServer,
  listExperienceParticipantsServer,
  listExperiencesServer,
  replaceExperienceStoreForTests,
} from "./server-experience-repository";
import {
  createResourceServer,
  listAvailabilityServer,
  listReservationsServer,
  replaceReservationsStoreForTests,
} from "@/lib/reservations/server-reservations-repository";

process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(input: {
  tenantSlug: string;
  role: RequestActor["role"];
  personId: string;
  hasMembership?: boolean;
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

async function firstSlot(resourceId: string, tenantId = PANO) {
  const { dateOffsetIso } = await import("@life-community-os/types");
  const date = dateOffsetIso(0);
  const slots = await listAvailabilityServer(tenantId, resourceId, date);
  const slot = slots.find((item) => item.status === "available");
  return { date, slot };
}

describe("experience domain isolation", () => {
  beforeEach(async () => {
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
  });

  it("creates an Experience owned by the session Person", async () => {
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      ownerPersonIdFromClient: "attacker",
      title: "Clase de yoga",
      description: "Sesión al aire libre en el territorio.",
      category: "wellness",
      startsAt: "2026-09-06T08:00:00.000Z",
    });
    assert.equal(created.ownerPersonId, "person-alex");
    assert.equal(created.createdBy, "person-alex");
    assert.equal(created.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    assert.equal(created.status, "published");
    const listed = await listExperiencesServer(PANO);
    assert.equal(listed.some((item) => item.id === created.id), true);
  });

  it("denies create and join without membership", () => {
    const guest = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-guest",
      hasMembership: false,
    });
    assert.equal(actorCanCreateExperience(guest), false);
    assert.equal(actorCanJoinExperience(guest), false);
  });

  it("denies creating an Experience in another Tenant Territory", async () => {
    await assert.rejects(
      () =>
        createExperienceServer({
          tenantId: PANO,
          ownerPersonId: "person-alex",
          title: "Ruta Valley",
          description: "No pertenece a este territorio.",
          startsAt: "2026-09-06T08:00:00.000Z",
          territoryId: LIFE_VALLEY_TERRITORY_UUID,
        }),
      /cross_territory_forbidden/,
    );
  });

  it("denies linking a Resource from another Territory", async () => {
    const foreign = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Pista Valley",
      description: "Inventario de otro territorio.",
      category: "sport",
      location: "Club",
      capacity: 2,
      slotMinutes: 60,
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    await assert.rejects(
      () =>
        createExperienceServer({
          tenantId: PANO,
          ownerPersonId: "person-alex",
          title: "Torneo pádel",
          description: "Usa una pista de otro territorio.",
          category: "sport",
          startsAt: "2026-09-06T08:00:00.000Z",
          resourceId: foreign.id,
        }),
      /resource_territory_mismatch/,
    );
  });

  it("joins a published Experience and creates a Reservation on the Resource", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Pista 1",
      description: "Pista de pádel del territorio.",
      category: "sport",
      location: "Club deportivo",
      capacity: 4,
      slotMinutes: 60,
    });
    const { date, slot } = await firstSlot(resource.id);
    assert.ok(slot);
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Torneo pádel",
      description: "Partido abierto.",
      category: "sport",
      resourceId: resource.id,
      startsAt: combineDateAndTime(date, slot!.start),
      endsAt: combineDateAndTime(date, slot!.end),
      capacity: 8,
    });
    const participation = await joinExperienceServer({
      tenantId: PANO,
      experienceId: created.id,
      personId: "person-maria",
    });
    assert.equal(participation.role, "participant");
    assert.ok(participation.reservationId);
    const reservations = await listReservationsServer(PANO);
    const linked = reservations.find(
      (item) => item.id === participation.reservationId,
    );
    assert.ok(linked);
    assert.equal(linked!.experienceId, created.id);
    assert.equal(linked!.resourceId, resource.id);
  });

  it("lets the owner cancel their Experience", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Cena temática",
      description: "Encuentro vecinal.",
      category: "food",
      startsAt: "2026-09-06T19:00:00.000Z",
    });
    const owner = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-alex",
    });
    assert.equal(actorCanCancelExperience(owner, created), true);
    const cancelled = await cancelExperienceServer({
      tenantId: PANO,
      experienceId: created.id,
      actorPersonId: "person-alex",
      canManage: false,
    });
    assert.equal(cancelled.status, "cancelled");
  });

  it("denies cancelling someone else's Experience", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Evento social",
      description: "Quedada en el territorio.",
      category: "social",
      startsAt: "2026-09-06T18:00:00.000Z",
    });
    const other = actor({
      tenantSlug: PANO,
      role: "member",
      personId: "person-maria",
    });
    assert.equal(actorCanCancelExperience(other, created), false);
    await assert.rejects(
      () =>
        cancelExperienceServer({
          tenantId: PANO,
          experienceId: created.id,
          actorPersonId: "person-maria",
          canManage: false,
        }),
      /forbidden/,
    );
  });

  it("does not let Valley read Panorámica Experiences", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Clase Panorámica",
      description: "Solo visible en este territorio.",
      startsAt: "2026-09-06T10:00:00.000Z",
    });
    const valleyList = await listExperiencesServer(VALLEY);
    assert.equal(
      valleyList.some((item) => item.id === created.id),
      false,
    );
    const hidden = await getExperienceServer(VALLEY, created.id);
    assert.equal(hidden, null);
    const participants = await listExperienceParticipantsServer(
      VALLEY,
      created.id,
    );
    assert.equal(participants.length, 0);
  });
});
