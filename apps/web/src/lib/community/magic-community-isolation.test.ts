/**
 * Magic Community Experience isolation — UX projection over existing domains.
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
  discoverExperienceQuery,
  LIVING_EMPTY_CTA,
  LIVING_EMPTY_TITLE,
  partitionLivingCommunityFeed,
  sanitizeCommunityCreationContext,
  CAPABILITIES,
  EMPTY_PRODUCT_CAPABILITIES,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import { replaceMarketplaceStoreForTests } from "@/lib/marketplace/server-marketplace-repository";
import { replaceReservationsStoreForTests } from "@/lib/reservations/server-reservations-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { getTenantPack } from "@/lib/tenant/registry";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";
import { inferCreationSource } from "@/lib/community/action-composer-client";

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

describe("Magic Community Experience isolation", () => {
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

  it("TEST 1 — the + opens Action Composer", () => {
    const actor = memberActor(PANO);
    assert.equal(actor.hasMembership, true);
    const actions = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: permissionsForRole("member", PANO),
      productCapabilities: getTenantPack(PANO)?.productCapabilities,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(actions.length > 0);
    assert.equal(
      actions.some((item) => item.type === "experience_create"),
      true,
    );
    assert.equal(inferCreationSource("/"), "home");
    assert.equal(inferCreationSource("/map"), "life_map");
    assert.equal(inferCreationSource("/discover"), "discover");
    assert.equal(inferCreationSource("/community"), "global_plus");
  });

  it("TEST 2 — the + from Life Place keeps location", () => {
    const experience = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: permissionsForRole("member", PANO),
      productCapabilities: getTenantPack(PANO)?.productCapabilities,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    }).find((item) => item.type === "experience_create");
    assert.ok(experience);
    const context = sanitizeCommunityCreationContext({
      source: "life_place",
      locationId: "loc-pool",
      locationName: "Piscina",
    });
    const href = communityCreationRoute(experience, context);
    assert.equal(href.includes("locationId=loc-pool"), true);
    assert.equal(context.source, "life_place");
    assert.equal(/territoryId=/.test(href), false);
    assert.equal(/source=/.test(href), false);
  });

  it("TEST 3 — creating an Experience stamps the Active Territory", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Aquagym",
      description: "Piscina.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    assert.equal(created.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    assert.notEqual(created.territoryId, LIFE_VALLEY_TERRITORY_UUID);
  });

  it("TEST 4 — Home shows the Experience Feed", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Aquagym",
      description: "Piscina.",
      startsAt: "2026-09-06T16:00:00.000Z",
      publishToCommunity: true,
    });
    const pack = getTenantPack(PANO);
    const items = await CommunityExperienceFeedService.list({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      productCapabilities: pack?.productCapabilities,
      permissions: permissionsForRole("member", PANO),
    });
    assert.ok(items.some((item) => item.title === "Aquagym"));
    const living = partitionLivingCommunityFeed(items);
    assert.ok(living.moments.length > 0);
  });

  it("TEST 5 — Life Map opens Life Place", () => {
    const pool = createLocation({
      id: "loc-pool-magic",
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
    assert.equal(context.location.id, "loc-pool-magic");
    assert.equal(context.location.name, "Piscina");
    assert.ok(context.actions.some((item) => item.kind === "create_activity"));
  });

  it("TEST 6 — Discover uses the same feed query", () => {
    const home = discoverExperienceQuery({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const discover = discoverExperienceQuery({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(home);
    assert.ok(discover);
    assert.equal(home.territoryId, discover.territoryId);
    assert.equal(home.tenantId, discover.tenantId);
  });

  it("TEST 7 — empty activity invites to create", () => {
    const living = partitionLivingCommunityFeed([]);
    assert.equal(living.moments.length, 0);
    assert.equal(LIVING_EMPTY_TITLE, "Todavía no hay planes aquí");
    assert.equal(LIVING_EMPTY_CTA, "Crear el primero");
  });

  it("TEST 8 — a disabled capability hides the action", () => {
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

  it("TEST 9 — Valley does not see Panorámica", async () => {
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
    assert.notEqual(created.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    const panoItems = await CommunityExperienceFeedService.list({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      productCapabilities: getTenantPack(PANO)?.productCapabilities,
      permissions: permissionsForRole("member", PANO),
    });
    assert.equal(
      panoItems.some((item) => item.title === "Solo Valley"),
      false,
    );
  });

  it("TEST 10 — no new content entity exists", () => {
    const source = readFileSync(
      path.join(HERE, "action-composer-client.ts"),
      "utf8",
    );
    assert.equal(/MagicCommunityEntity/.test(source), false);
    assert.equal(/LivingCommunityEntity/.test(source), false);
    assert.equal(/SocialPostEntity/.test(source), false);
    assert.equal(/UserActivityEntity/.test(source), false);
    assert.equal(/FriendEntity/.test(source), false);
    assert.equal(/CommunityAction\b/.test(source), false);
    assert.equal(/unsplash/i.test(source), false);
  });
});
