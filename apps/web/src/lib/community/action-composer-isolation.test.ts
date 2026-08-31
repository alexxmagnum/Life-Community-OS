/**
 * Action Composer isolation — intention layer over existing domains.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  CommunityActionRegistry,
  communityCreationRoute,
  createLifePlaceContext,
  createLocation,
  CAPABILITIES,
  EMPTY_PRODUCT_CAPABILITIES,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import {
  createHelpRequestServer,
  replaceHelpStoreForTests,
} from "@/lib/help/server-help-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import {
  createMarketplaceListingServer,
  replaceMarketplaceStoreForTests,
} from "@/lib/marketplace/server-marketplace-repository";
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
process.env.LCOS_MARKETPLACE_FIXTURE = "1";

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

function composerFor(tenantSlug: string, territoryId: string) {
  const pack = getTenantPack(tenantSlug);
  return CommunityActionRegistry.list({
    hasMembership: true,
    capabilities: permissionsForRole("member", tenantSlug),
    productCapabilities: pack?.productCapabilities,
    territoryId,
  });
}

describe("Action Composer isolation", () => {
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
    await replaceMarketplaceStoreForTests(PANO);
    await replaceMarketplaceStoreForTests(VALLEY);
  });

  it("TEST 1 — a member opens Action Composer", () => {
    const actor = memberActor(PANO);
    assert.equal(actor.hasMembership, true);
    const actions = composerFor(PANO, LIFE_PANORAMICA_TERRITORY_UUID);
    assert.ok(actions.length > 0);
    assert.equal(
      actions.some((item) => item.type === "experience_create"),
      true,
    );
    assert.equal(
      actions.some((item) => item.route.includes("register") && item.type !== "business_create"),
      false,
    );
  });

  it("TEST 2 — a member creates an Experience", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga al atardecer",
      description: "Sala Wellness.",
      startsAt: "2026-09-06T18:00:00.000Z",
      publishToCommunity: true,
    });
    assert.equal(created.status, "published");
    assert.equal(created.ownerPersonId, "person-alex");
  });

  it("TEST 3 — Territory is assigned from context", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Paseo",
      description: "Por el valle propio.",
      startsAt: "2026-09-06T08:00:00.000Z",
    });
    assert.equal(created.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
  });

  it("TEST 4 — another Territory is DENIED", async () => {
    const denied = resolveActiveTerritoryContext({
      tenantId: PANO,
      queryTerritoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
    await assert.rejects(
      () =>
        createExperienceServer({
          tenantId: PANO,
          ownerPersonId: "person-alex",
          title: "Ajeno",
          description: "No debe cruzar territorio.",
          startsAt: "2026-09-06T08:00:00.000Z",
          territoryId: LIFE_VALLEY_TERRITORY_UUID,
        }),
      /cross_territory_forbidden/,
    );
  });

  it("TEST 5 — a disabled capability hides the action", () => {
    const pack = getTenantPack(PANO);
    const withoutMarket = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: permissionsForRole("member", PANO),
      productCapabilities: {
        ...EMPTY_PRODUCT_CAPABILITIES,
        ...(pack?.productCapabilities ?? {}),
        marketplace: false,
      },
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      withoutMarket.some((item) => item.type === "marketplace_listing"),
      false,
    );
    const withoutCap = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: permissionsForRole("member", PANO).filter(
        (item) => item !== CAPABILITIES.experienceCreate,
      ),
      productCapabilities: pack?.productCapabilities,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      withoutCap.some((item) => item.type === "experience_create"),
      false,
    );
  });

  it("TEST 6 — creating a Help Request works", async () => {
    const help = await createHelpRequestServer({
      tenantId: PANO,
      createdBy: "person-alex",
      type: "need_help",
      title: "Necesito una mano",
      description: "Mover unas cajas el sábado.",
    });
    assert.equal(help.createdBy, "person-alex");
    assert.equal(help.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
  });

  it("TEST 7 — creating a Marketplace listing works", async () => {
    const listing = await createMarketplaceListingServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      type: "giveaway",
      title: "Silla de jardín",
      description: "Para recoger hoy.",
    });
    assert.equal(listing.ownerPersonId, "person-alex");
    assert.equal(listing.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
  });

  it("TEST 8 — Life Place preselects Location", () => {
    const pool = createLocation({
      id: "loc-pool-composer",
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
    const context = createLifePlaceContext({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      location: pool,
      canCreateActivity: true,
    });
    const action = context.actions.find((item) => item.kind === "create_activity");
    assert.ok(action);
    assert.equal(action?.href.includes("locationId=loc-pool-composer"), true);
    const experience = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: permissionsForRole("member", PANO),
      productCapabilities: getTenantPack(PANO)?.productCapabilities,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    }).find((item) => item.type === "experience_create");
    assert.ok(experience);
    const href = communityCreationRoute(experience, {
      locationId: pool.id,
      locationName: pool.name,
    });
    assert.equal(href.includes("locationId=loc-pool-composer"), true);
    assert.equal(/territoryId=/.test(href), false);
  });

  it("TEST 9 — Life Map creates in the correct context", async () => {
    const pool = createLocation({
      id: "loc-clubhouse-composer",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      type: "facility",
      name: "Clubhouse",
      address: "Club",
      latitude: 37.41,
      longitude: -4.75,
      category: "clubhouse",
      visibility: "public",
    });
    await replaceLocationsForTests(PANO, [pool]);
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Sala Clubhouse",
      description: "Para encuentros.",
      category: "facility",
      location: "Clubhouse",
      locationId: pool.id,
      capacity: 12,
      slotMinutes: 60,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Asamblea",
      description: "En el clubhouse.",
      startsAt: "2026-09-06T19:00:00.000Z",
      resourceId: resource.id,
    });
    assert.equal(created.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    assert.equal(created.resourceId, resource.id);
    const experience = composerFor(PANO, LIFE_PANORAMICA_TERRITORY_UUID).find(
      (item) => item.type === "experience_create",
    );
    assert.ok(experience);
    const href = communityCreationRoute(experience, {
      locationId: pool.id,
      locationName: pool.name,
    });
    assert.equal(href.includes(pool.id), true);
  });

  it("TEST 10 — Valley does not create in Panorámica", async () => {
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
    const created = await createExperienceServer({
      tenantId: VALLEY,
      ownerPersonId: "person-alex",
      title: "Solo Valley",
      description: "No debe aparecer en Panorámica.",
      startsAt: "2026-09-06T10:00:00.000Z",
    });
    assert.equal(created.tenantId, VALLEY);
    assert.notEqual(created.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    const source = readFileSync(
      path.join(HERE, "action-composer-registry.ts"),
      "utf8",
    );
    assert.equal(/CommunityAction\b/.test(source), false);
    assert.equal(/unsplash/i.test(source), false);
  });
});
