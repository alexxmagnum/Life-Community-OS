/**
 * Community Operations isolation — daily territorial projection.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  createLocation,
  dateOffsetIso,
  isOpaqueDailyLifeEntity,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import {
  CommunityOperationsService,
  OperationsDeniedError,
} from "@/lib/community/community-operations-service";
import {
  listCommunityNotifications,
  replaceCommunitySnapshotForTests,
} from "@/lib/community/server-community-repository";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceGovernanceStoreForTests } from "@/lib/governance/server-governance-repository";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import { LifePlaceQueryService } from "@/lib/life-place/life-place-query";
import {
  createReservationServer,
  createResourceServer,
  replaceReservationsStoreForTests,
} from "@/lib/reservations/server-reservations-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { getTenantPack } from "@/lib/tenant/registry";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

process.env.LCOS_LOCATION_FIXTURE = "1";
process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";
process.env.LCOS_BUSINESS_FIXTURE = "1";
process.env.LCOS_HELP_FIXTURE = "1";
process.env.LCOS_ADMIN_FIXTURE = "1";
process.env.LCOS_GOVERNANCE_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";
const HERE = path.dirname(fileURLToPath(import.meta.url));

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole;
  personId?: string;
}): RequestActor {
  const role = input.role ?? "member";
  const personId = input.personId ?? "person-alex";
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(role, input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: input.tenantSlug,
      role,
    },
  };
}

function poolLocation() {
  return createLocation({
    id: "loc-pool-ops",
    tenantId: PANO,
    territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    type: "facility",
    name: "Piscina",
    address: "Club",
    latitude: 37.412,
    longitude: -4.751,
    category: "pool",
    visibility: "public",
    hours: "10:00–20:00",
  });
}

async function panoPlace(locationId: string) {
  const pack = getTenantPack(PANO);
  return LifePlaceQueryService.get({
    tenantId: PANO,
    territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    locationId,
    actor: actor({ tenantSlug: PANO }),
    productCapabilities: pack?.productCapabilities,
    permissions: actor({ tenantSlug: PANO }).permissions,
  });
}

describe("Community Operations isolation", () => {
  beforeEach(async () => {
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
    await replaceBusinessStoreForTests(PANO);
    await replaceBusinessStoreForTests(VALLEY);
    await replaceHelpStoreForTests(PANO);
    await replaceHelpStoreForTests(VALLEY);
    await replaceGovernanceStoreForTests(PANO);
    await replaceGovernanceStoreForTests(VALLEY);
  });

  it("TEST 1 — Daily Pulse uses real domain data", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Aquagym de hoy",
      description: "En la piscina del territorio.",
      startsAt: new Date().toISOString(),
    });
    const pulse = await CommunityOperationsService.pulse({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const rows = [...pulse.now, ...pulse.next];
    assert.equal(
      rows.some((item) => item.experienceId === created.id),
      true,
    );
  });

  it("TEST 2 — opaque daily-life aggregates are not persisted", () => {
    const source = readFileSync(
      path.join(HERE, "community-operations-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueDailyLifeEntity("DailyLifeEntity"), true);
    assert.equal(/export type DailyLifeEntity/.test(source), false);
    assert.equal(/export type CommunityTimelineEntity/.test(source), false);
    assert.equal(/export type UniversalNotificationFeed/.test(source), false);
    assert.equal(/export type ResidentScore/.test(source), false);
    assert.equal(/export type SocialWall/.test(source), false);
  });

  it("TEST 3 — Territory isolation on Daily Pulse", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Solo Panorámica",
      description: "No cruza de territorio.",
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    const valleyPulse = await CommunityOperationsService.pulse({
      tenantId: VALLEY,
      actor: actor({ tenantSlug: VALLEY, personId: "person-valley" }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    const rows = [...valleyPulse.now, ...valleyPulse.next, ...valleyPulse.community];
    assert.equal(
      rows.some((item) => item.experienceId === created.id),
      false,
    );
  });

  it("TEST 4 — announcements only from community staff", async () => {
    await assert.rejects(
      () =>
        CommunityOperationsService.createAnnouncement({
          tenantId: PANO,
          actor: actor({ tenantSlug: PANO, role: "member" }),
          territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
          title: "Corte de agua",
          body: "Mañana de 8 a 10.",
        }),
      (error: unknown) => error instanceof OperationsDeniedError,
    );
    const announcement = await CommunityOperationsService.createAnnouncement({
      tenantId: PANO,
      actor: actor({
        tenantSlug: PANO,
        role: "administrator",
        personId: "person-admin",
      }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Horario de verano",
      body: "La piscina cambia horario.",
    });
    assert.equal(announcement.title, "Horario de verano");
    const listed = await CommunityOperationsService.announcements({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      listed.some((item) => item.id === announcement.id),
      true,
    );
  });

  it("TEST 5 — a member sees only their Territory", async () => {
    const created = await createExperienceServer({
      tenantId: VALLEY,
      ownerPersonId: "person-valley",
      title: "Solo Valley",
      description: "No aparece en Panorámica.",
      startsAt: new Date().toISOString(),
    });
    const pulse = await CommunityOperationsService.pulse({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const rows = [...pulse.now, ...pulse.next, ...pulse.community];
    assert.equal(
      rows.some((item) => item.experienceId === created.id),
      false,
    );
    assert.equal(
      rows.every((item) => item.territoryId === LIFE_PANORAMICA_TERRITORY_UUID),
      true,
    );
  });

  it("TEST 6 — contextual reservation reminder", async () => {
    const reservation = await createReservationServer({
      tenantId: PANO,
      createdBy: "person-alex",
      context: { type: "service", id: "massage-visit" },
      date: dateOffsetIso(1),
      start: "11:00",
      end: "12:00",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const created = await CommunityOperationsService.remindActor({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-alex" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(created >= 1);
    const notes = await listCommunityNotifications(PANO, "person-alex");
    assert.equal(
      notes.some(
        (item) =>
          item.kind === "experience_reminder" &&
          item.entityId === reservation.id,
      ),
      true,
    );
  });

  it("TEST 7 — Life Place shows real operations status", async () => {
    await replaceLocationsForTests(PANO, [poolLocation()]);
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Vaso de piscina",
      description: "Aquagym.",
      category: "facility",
      location: "Piscina",
      locationId: "loc-pool-ops",
      capacity: 12,
      slotMinutes: 60,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Aquagym",
      description: "Ahora en la piscina.",
      startsAt: new Date().toISOString(),
      resourceId: resource.id,
    });
    const result = await panoPlace("loc-pool-ops");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(
      result.context.experiences.some((item) => item.id === created.id),
      true,
    );
    assert.ok(result.context.operations);
    assert.notEqual(result.context.operations.status, "available");
    assert.equal(
      result.context.currentActivity.some(
        (item) => item.experienceId === created.id,
      ) || result.context.experiences.some((item) => item.id === created.id),
      true,
    );
  });

  it("TEST 8 — Reservation Context stays intact for a service without resource", async () => {
    const reservation = await createReservationServer({
      tenantId: PANO,
      createdBy: "person-alex",
      context: { type: "service", id: "massage-visit" },
      date: dateOffsetIso(1),
      start: "11:00",
      end: "12:00",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(reservation.contextType, "service");
    assert.equal(reservation.contextId, "massage-visit");
    assert.equal(reservation.resourceId, undefined);
  });

  it("TEST 9 — personalization does not invent Daily Pulse content", async () => {
    const yoga = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga al atardecer",
      description: "Sala Wellness",
      startsAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
    });
    const golf = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Partido de golf",
      description: "Campo",
      startsAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
    });
    const pulse = await CommunityOperationsService.pulse({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const rows = [...pulse.now, ...pulse.next];
    assert.equal(
      rows.some((item) => item.experienceId === yoga.id),
      true,
    );
    assert.equal(
      rows.some((item) => item.experienceId === golf.id),
      true,
    );
    assert.equal(
      rows.some((item) => item.title === "Invented activity"),
      false,
    );
  });

  it("TEST 10 — Valley is separated from Panorámica", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Solo Panorámica",
      description: "No cruza a Valley.",
      startsAt: new Date().toISOString(),
    });
    const valleyPulse = await CommunityOperationsService.pulse({
      tenantId: VALLEY,
      actor: actor({ tenantSlug: VALLEY, personId: "person-valley" }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    const rows = [
      ...valleyPulse.now,
      ...valleyPulse.next,
      ...valleyPulse.community,
      ...valleyPulse.important,
    ];
    assert.equal(
      rows.some((item) => "id" in item && item.id === created.id),
      false,
    );
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
  });
});
