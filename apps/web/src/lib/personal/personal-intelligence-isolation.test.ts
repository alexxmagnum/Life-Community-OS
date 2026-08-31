/**
 * Personal Community Intelligence isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  emptyPersonalContext,
  hasContinuousLocationTracking,
  isOpaqueRecommendationEntity,
  personalizeCommunityFeed,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
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
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import {
  PersonalizationService,
} from "@/lib/personal/personalization-service";
import {
  getPersonalContextServer,
  patchPersonalContextServer,
  replacePersonalStoreForTests,
} from "@/lib/personal/server-personal-repository";
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

function memberActor(tenantSlug: string, personId = "person-alex"): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId,
    role: "member",
    tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole("member", tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: tenantSlug,
      role: "member",
    },
  };
}

describe("Personal Community Intelligence isolation", () => {
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
    await replacePersonalStoreForTests(PANO);
    await replacePersonalStoreForTests(VALLEY);
  });

  it("TEST 1 — user configures interests", async () => {
    const saved = await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf", "pool"],
    });
    assert.deepEqual(saved.preferences.interests, ["golf", "pool"]);
    const loaded = await getPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.deepEqual(loaded.preferences.interests, ["golf", "pool"]);
  });

  it("TEST 2 — Home prioritizes relevant content", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf"],
    });
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga al amanecer",
      description: "Sala Wellness.",
      startsAt: "2026-09-06T16:00:00.000Z",
      publishToCommunity: true,
    });
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Partido de golf",
      description: "Campo.",
      startsAt: "2026-09-06T16:30:00.000Z",
      publishToCommunity: true,
    });
    const actor = memberActor(PANO);
    const items = await CommunityExperienceFeedService.list({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      productCapabilities: getTenantPack(PANO)?.productCapabilities,
      permissions: actor.permissions,
    });
    const personalized = await PersonalizationService.feed({
      tenantId: PANO,
      actor,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      items,
    });
    const golfIndex = personalized.items.findIndex(
      (item) => item.title === "Partido de golf",
    );
    const yogaIndex = personalized.items.findIndex(
      (item) => item.title === "Yoga al amanecer",
    );
    assert.ok(golfIndex >= 0 && yogaIndex >= 0 && golfIndex < yogaIndex);
    assert.equal(personalized.items[golfIndex]?.reason, "Te interesa golf");
  });

  it("TEST 3 — Discover uses personal context", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["family", "sports"],
    });
    const actor = memberActor(PANO);
    const context = await PersonalizationService.resolve({
      tenantId: PANO,
      actor,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const night = {
      id: "exp-night",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "After nocturno de copas",
      type: "event" as const,
      actions: { primary: "view" as const },
    };
    const pool = {
      id: "exp-pool",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Actividad familiar en la piscina",
      type: "experience" as const,
      actions: { primary: "join" as const },
    };
    const result = personalizeCommunityFeed({
      context,
      feed: [night, pool],
    });
    assert.equal(result.items[0]?.id, "exp-pool");
  });

  it("TEST 4 — another user cannot read preferences", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf"],
    });
    const other = await getPersonalContextServer({
      tenantId: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(other.preferences.interests.includes("golf"), false);
    assert.equal(other.personId, "person-maria");
  });

  it("TEST 5 — Territory isolation still applies", async () => {
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
  });

  it("TEST 6 — user can turn recommendations off", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf"],
      privacy: { receiveRecommendations: false },
    });
    const actor = memberActor(PANO);
    const yoga = {
      id: "exp-yoga",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Yoga",
      type: "experience" as const,
      actions: { primary: "join" as const },
    };
    const golf = {
      id: "exp-golf",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Partido de golf",
      type: "experience" as const,
      actions: { primary: "join" as const },
    };
    const result = await PersonalizationService.feed({
      tenantId: PANO,
      actor,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      items: [yoga, golf],
    });
    assert.equal(result.enabled, false);
    assert.equal(result.items[0]?.id, "exp-yoga");
  });

  it("TEST 7 — no opaque algorithm entity exists", () => {
    const source = readFileSync(
      path.join(HERE, "personalization-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueRecommendationEntity("RecommendationEntity"), true);
    assert.equal(/RecommendationEntity/.test(source), false);
    assert.equal(/UserScoreEntity/.test(source), false);
    assert.equal(/EngagementEntity/.test(source), false);
    assert.equal(/InterestPost/.test(source), false);
  });

  it("TEST 8 — no invasive tracking on PersonalContext", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(hasContinuousLocationTracking(context), false);
    const repo = readFileSync(
      path.join(HERE, "server-personal-repository.ts"),
      "utf8",
    );
    assert.equal(/geolocation|watchPosition|exactLocation/i.test(repo), false);
  });

  it("TEST 9 — Valley does not receive Panorámica", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf"],
    });
    const valley = await getPersonalContextServer({
      tenantId: VALLEY,
      personId: "person-alex",
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(valley.preferences.interests.includes("golf"), false);
    const created = await createExperienceServer({
      tenantId: VALLEY,
      ownerPersonId: "person-alex",
      title: "Solo Valley golf",
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
      panoItems.some((item) => item.title === "Solo Valley golf"),
      false,
    );
  });

  it("TEST 10 — fallback without preferences keeps original order", async () => {
    const actor = memberActor(PANO);
    const yoga = {
      id: "exp-yoga",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Yoga",
      type: "experience" as const,
      actions: { primary: "join" as const },
    };
    const golf = {
      id: "exp-golf",
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Partido de golf",
      type: "experience" as const,
      actions: { primary: "join" as const },
    };
    const result = await PersonalizationService.feed({
      tenantId: PANO,
      actor,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      items: [yoga, golf],
    });
    assert.equal(result.items[0]?.id, "exp-yoga");
    assert.equal(result.items[1]?.id, "exp-golf");
  });
});
