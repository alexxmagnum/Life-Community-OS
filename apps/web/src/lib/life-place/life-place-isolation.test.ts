/**
 * Life Place Experience Layer isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { createLocation } from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  createRegisteredBusiness,
  replaceBusinessStoreForTests,
  setBusinessStatus,
} from "@/lib/business/server-business-repository";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import { LifePlaceQueryService } from "@/lib/life-place/life-place-query";
import {
  actorCanOpenLifePlace,
  actorCanReadLifePlaceLife,
} from "@/lib/life-place/permissions";
import {
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

const PANO = "life-panoramica";
const VALLEY = "life-valley";
const HERE = path.dirname(fileURLToPath(import.meta.url));

function memberActor(tenantSlug: string): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId: "person-alex",
    role: "member",
    tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole("member", tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId: "person-alex",
      tenantId: tenantSlug,
      role: "member",
    },
  };
}

function visitorActor(tenantSlug: string): RequestActor {
  return {
    authenticated: false,
    hasMembership: false,
    providerReference: null,
    personId: null,
    role: null,
    tenantSlug,
    membershipId: null,
    permissions: [],
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: false,
      hasMembership: false,
      tenantId: tenantSlug,
    },
  };
}

function guestActor(tenantSlug: string): RequestActor {
  return {
    ...memberActor(tenantSlug),
    hasMembership: false,
    membershipId: null,
    permissions: [],
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: false,
      personId: "person-guest",
      tenantId: tenantSlug,
      role: "member",
    },
  };
}

function poolLocation() {
  return createLocation({
    id: "loc-pool-place",
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

async function panoPlace(locationId: string, actor?: RequestActor) {
  const pack = getTenantPack(PANO);
  return LifePlaceQueryService.get({
    tenantId: PANO,
    territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    locationId,
    actor: actor ?? memberActor(PANO),
    productCapabilities: pack?.productCapabilities,
    permissions: (actor ?? memberActor(PANO)).permissions,
  });
}

describe("Life Place Experience Layer isolation", () => {
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
    await replaceLocationsForTests(PANO, [poolLocation()]);
  });

  it("TEST 1 — a member opens Life Place in their Territory", async () => {
    const result = await panoPlace("loc-pool-place");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.context.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    assert.equal(result.context.location.name, "Piscina");
  });

  it("TEST 2 — a Location from another Territory is DENIED", async () => {
    const foreign = createLocation({
      id: "loc-foreign-place",
      tenantId: PANO,
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
      type: "facility",
      name: "Pista ajena",
      address: "Valley",
      latitude: 37.2,
      longitude: -4.4,
      category: "sport",
      visibility: "public",
    });
    await replaceLocationsForTests(PANO, [poolLocation(), foreign]);
    const result = await panoPlace("loc-foreign-place");
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 403);
    assert.equal(result.error, "territory_forbidden");
  });

  it("TEST 3 — a place with an Experience shows activity", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Sala Wellness",
      description: "Yoga.",
      category: "facility",
      location: "Piscina",
      locationId: "loc-pool-place",
      capacity: 8,
      slotMinutes: 60,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Aquagym",
      description: "En la piscina.",
      startsAt: "2026-09-06T18:00:00.000Z",
      resourceId: resource.id,
    });
    const result = await panoPlace("loc-pool-place");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(
      result.context.experiences.some((item) => item.id === created.id),
      true,
    );
    assert.equal(
      result.context.currentActivity.some(
        (item) => item.experienceId === created.id,
      ),
      true,
    );
  });

  it("TEST 4 — a place with a Resource shows reservation", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Piscina",
      description: "Vasos libres.",
      category: "facility",
      location: "Piscina",
      locationId: "loc-pool-place",
      capacity: 12,
      slotMinutes: 60,
    });
    const result = await panoPlace("loc-pool-place");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(
      result.context.resources.some((item) => item.id === resource.id),
      true,
    );
    const reservation = result.context.reservations.find(
      (item) => item.context.type === "resource" && item.context.id === resource.id,
    );
    assert.ok(reservation);
    assert.equal(reservation?.href, `/resources/${resource.id}/reserve`);
  });

  it("TEST 5 — Experience action is Join", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Sala",
      description: "Clase.",
      category: "facility",
      location: "Piscina",
      locationId: "loc-pool-place",
      capacity: 8,
      slotMinutes: 60,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga",
      description: "Sala.",
      startsAt: "2026-09-06T18:00:00.000Z",
      resourceId: resource.id,
    });
    const result = await panoPlace("loc-pool-place");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const action = result.context.actions.find(
      (item) => item.kind === "join_experience" && item.experienceId === created.id,
    );
    assert.ok(action);
    assert.equal(action?.href, `/experiences/${created.id}`);
  });

  it("TEST 6 — Reservation action is Reservar", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Pista",
      description: "Pádel.",
      category: "facility",
      location: "Piscina",
      locationId: "loc-pool-place",
      capacity: 4,
      slotMinutes: 60,
    });
    const result = await panoPlace("loc-pool-place");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const action = result.context.actions.find(
      (item) =>
        item.kind === "reserve_resource" && item.resourceId === resource.id,
    );
    assert.ok(action);
    assert.equal(action?.href, `/resources/${resource.id}/reserve`);
  });

  it("TEST 7 — Business action is Ver negocio", async () => {
    const created = await createRegisteredBusiness({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "IKON",
      category: "restaurant",
      description: "Cena.",
      address: "Club",
      latitude: 37.412,
      longitude: -4.751,
      type: "business",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const result = await panoPlace(created.location.id);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const action = result.context.actions.find(
      (item) => item.kind === "view_business",
    );
    assert.ok(action);
    assert.equal(action?.label, "Ver negocio");
    assert.equal(action?.href, `/locations/${created.location.id}`);
  });

  it("TEST 8 — Valley does not see Panorámica", async () => {
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
    const pack = getTenantPack(VALLEY);
    const result = await LifePlaceQueryService.get({
      tenantId: VALLEY,
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
      locationId: "loc-pool-place",
      actor: memberActor(VALLEY),
      productCapabilities: pack?.productCapabilities,
      permissions: permissionsForRole("member", VALLEY),
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error === "not_found" || result.error === "territory_forbidden", true);
  });

  it("TEST 9 — without membership private life is DENIED", async () => {
    const guest = guestActor(PANO);
    const visitor = visitorActor(PANO);
    assert.equal(actorCanOpenLifePlace(visitor), true);
    assert.equal(actorCanReadLifePlaceLife(guest), false);
    const membersOnly = createLocation({
      id: "loc-members-place",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      type: "facility",
      name: "Sala socios",
      address: "Club",
      latitude: 37.413,
      longitude: -4.752,
      category: "clubhouse",
      visibility: "members",
    });
    await replaceLocationsForTests(PANO, [poolLocation(), membersOnly]);
    const privateDenied = await panoPlace("loc-members-place", guest);
    assert.equal(privateDenied.ok, false);
    if (privateDenied.ok) return;
    assert.equal(privateDenied.error, "forbidden");
    const publicPlace = await panoPlace("loc-pool-place", guest);
    assert.equal(publicPlace.ok, true);
    if (!publicPlace.ok) return;
    assert.equal(publicPlace.context.currentActivity.length, 0);
    const visitorPlace = await panoPlace("loc-pool-place", visitor);
    assert.equal(visitorPlace.ok, true);
    assert.equal(publicPlace.context.experiences.length, 0);
  });

  it("TEST 10 — query has no demo PlaceEntity or Unsplash", () => {
    const querySource = readFileSync(path.join(HERE, "life-place-query.ts"), "utf8");
    const sheetSource = readFileSync(
      path.join(HERE, "../../components/life-place/LifePlaceSheet.tsx"),
      "utf8",
    );
    for (const source of [querySource, sheetSource]) {
      assert.equal(/unsplash/i.test(source), false);
      assert.equal(/PlaceEntity/.test(source), false);
      assert.equal(/MapPlaceEntity/.test(source), false);
      assert.equal(/LocationExperienceEntity/.test(source), false);
      assert.equal(/panor[aá]mica/i.test(source), false);
    }
  });
});
