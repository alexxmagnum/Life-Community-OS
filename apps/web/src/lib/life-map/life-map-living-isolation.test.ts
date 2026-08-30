/**
 * Life Map living Territory isolation — Territory + Location + Feed.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  buildLifeMapPlaceSheet,
  createLocation,
  isPackOnlyMapMarker,
  type LifeMapObject,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";
import { resolveLifeMapObjectsWithLocations } from "@/lib/location/project-location";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import {
  actorCanReadLifeMapLife,
  actorCanViewLifeMap,
} from "@/lib/life-map/permissions";
import { LifeMapQueryService } from "@/lib/life-map/life-map-query";
import { shouldLazyLoadTerritoryGlb } from "@/lib/life-map/territory-asset-pipeline";
import { ensureLifeMapTenantPacksRegistered } from "@/lib/life-map-tenant-registry";
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

ensureLifeMapTenantPacksRegistered();

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
    id: "loc-pool-living",
    tenantId: PANO,
    territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    type: "facility",
    name: "Piscina",
    address: "Club",
    latitude: 37.412,
    longitude: -4.751,
    category: "pool",
    visibility: "public",
  });
}

async function panoMap(overrides?: {
  includeLife?: boolean;
  membershipLocations?: boolean;
  zoom?: number;
  territoryId?: string;
}) {
  const pack = getTenantPack(PANO);
  return LifeMapQueryService.list({
    tenantId: PANO,
    territoryId: overrides?.territoryId ?? LIFE_PANORAMICA_TERRITORY_UUID,
    includeLife: overrides?.includeLife ?? true,
    membershipLocations: overrides?.membershipLocations ?? true,
    productCapabilities: pack?.productCapabilities,
    permissions: permissionsForRole("member", PANO),
    zoom: overrides?.zoom,
  });
}

describe("Life Map living Territory isolation", () => {
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

  it("TEST 1 — map loads the Active Territory", async () => {
    const result = await panoMap({ includeLife: false });
    assert.equal(result.territory.tenantId, PANO);
    assert.equal(result.territory.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
  });

  it("TEST 2 — a Location appears in its Territory", async () => {
    const result = await panoMap({ includeLife: false });
    assert.equal(
      result.locations.some((item) => item.id === "loc-pool-living"),
      true,
    );
    assert.equal(
      result.locations.every(
        (item) => item.territoryId === LIFE_PANORAMICA_TERRITORY_UUID,
      ),
      true,
    );
  });

  it("TEST 3 — a feed item creates map context at its Location", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Aquagym",
      description: "Actividad en la piscina.",
      category: "activity",
      location: "Piscina",
      locationId: "loc-pool-living",
      capacity: 12,
      scheduleStartsAt: "2026-09-06T16:00:00.000Z",
    });
    const result = await panoMap();
    const match = result.feedItems.find((item) => item.resourceId === resource.id);
    assert.ok(match);
    assert.equal(match.locationId, "loc-pool-living");
    const location = result.locations.find((item) => item.id === "loc-pool-living");
    assert.ok(location);
    const sheet = buildLifeMapPlaceSheet({
      location,
      feedItems: result.feedItems,
    });
    assert.equal(sheet.nowLabel, match.title);
    assert.equal(sheet.primary.kind, "reserve");
  });

  it("TEST 4 — a foreign Territory is DENIED", async () => {
    const denied = resolveActiveTerritoryContext({
      tenantId: PANO,
      queryTerritoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
    if (!("error" in denied)) return;
    assert.equal(denied.error.status, 403);
    const body = (await denied.error.json()) as { error?: string };
    assert.equal(body.error, "territory_forbidden");
    const valleyLocation = createLocation({
      id: "loc-valley-court",
      tenantId: VALLEY,
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
      type: "facility",
      name: "Pista Valley",
      address: "Valley",
      latitude: 37.2,
      longitude: -4.4,
      category: "sport",
      visibility: "public",
    });
    await replaceLocationsForTests(VALLEY, [valleyLocation]);
    const result = await panoMap({ includeLife: false });
    assert.equal(
      result.locations.some((item) => item.id === "loc-valley-court"),
      false,
    );
  });

  it("TEST 5 — a user without membership does not load private life", async () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanViewLifeMap(guest), false);
    assert.equal(actorCanReadLifeMapLife(guest), false);
    const membersOnly = createLocation({
      id: "loc-members-only",
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
    const result = await panoMap({
      includeLife: actorCanReadLifeMapLife(guest),
      membershipLocations: actorCanReadLifeMapLife(guest),
    });
    assert.equal(result.feedItems.length, 0);
    assert.equal(
      result.locations.some((item) => item.id === "loc-members-only"),
      false,
    );
  });

  it("TEST 6 — an Experience opens Join", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Sala Wellness",
      description: "Espacio de yoga.",
      category: "facility",
      location: "Piscina",
      locationId: "loc-pool-living",
      capacity: 8,
      slotMinutes: 60,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Clase de yoga",
      description: "En la piscina.",
      startsAt: "2026-09-06T18:00:00.000Z",
      resourceId: resource.id,
    });
    const result = await panoMap();
    const match = result.feedItems.find((item) => item.experienceId === created.id);
    assert.ok(match);
    assert.equal(match.actions.primary, "join");
    assert.equal(match.locationId, "loc-pool-living");
    const location = result.locations.find((item) => item.id === "loc-pool-living");
    assert.ok(location);
    const sheet = buildLifeMapPlaceSheet({
      location,
      feedItems: [match],
    });
    assert.equal(sheet.primary.kind, "join");
    assert.equal(sheet.primary.label, "Unirme");
    assert.equal(sheet.primary.href, `/experiences/${created.id}`);
  });

  it("TEST 7 — a Reservation from the map opens Reservar", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Pista de pádel",
      description: "Partida abierta.",
      category: "facility",
      location: "Pádel",
      locationId: "loc-pool-living",
      capacity: 4,
      slotMinutes: 60,
    });
    const result = await panoMap();
    const match = result.feedItems.find((item) => item.resourceId === resource.id);
    assert.ok(match);
    assert.equal(match.actions.primary, "reserve");
    const location = result.locations.find((item) => item.id === "loc-pool-living");
    assert.ok(location);
    const sheet = buildLifeMapPlaceSheet({
      location,
      feedItems: result.feedItems,
    });
    assert.equal(sheet.primary.kind, "reserve");
    assert.equal(sheet.primary.href, `/resources/${resource.id}/reserve`);
  });

  it("TEST 8 — GLB only loads at the allowed zoom", () => {
    assert.equal(
      shouldLazyLoadTerritoryGlb({
        zoom: 16.5,
        assetKey: "utility.security.spatial_object",
        modelPath: "/assets/3d/gate.glb",
      }),
      false,
    );
    assert.equal(
      shouldLazyLoadTerritoryGlb({
        zoom: 18.1,
        assetKey: "utility.security.spatial_object",
        modelPath: "/assets/3d/gate.glb",
      }),
      true,
    );
  });

  it("TEST 9 — pack extras are not runtime markers", () => {
    const demo: LifeMapObject = {
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      objectId: "loc-example-cafe-life-panoramica",
      type: "place",
      layerId: "community",
      state: "idle",
      position: { lat: 37.41, lng: -4.75 },
      availableActions: ["open"],
    };
    assert.equal(isPackOnlyMapMarker(demo), true);
    const projected = resolveLifeMapObjectsWithLocations(
      [demo],
      [poolLocation()],
      LIFE_PANORAMICA_TERRITORY_UUID,
    );
    assert.equal(
      projected.some((item) => /loc-example/.test(item.objectId)),
      false,
    );
    assert.equal(projected.every((item) => item.objectId === "loc-pool-living"), true);
  });

  it("TEST 10 — query and context do not hardcode Panorámica", () => {
    const querySource = readFileSync(path.join(HERE, "life-map-query.ts"), "utf8");
    const contextSource = readFileSync(path.join(HERE, "life-map-context.ts"), "utf8");
    const permissionsSource = readFileSync(path.join(HERE, "permissions.ts"), "utf8");
    for (const source of [querySource, contextSource, permissionsSource]) {
      assert.equal(/panor[aá]mica/i.test(source), false);
      assert.equal(/life-panoramica/.test(source), false);
      assert.equal(/MapActivityEntity/.test(source), false);
      assert.equal(/MapEventEntity/.test(source), false);
      assert.equal(/MapMarkerEntity/.test(source), false);
      assert.equal(/MapContentEntity/.test(source), false);
    }
  });
});
