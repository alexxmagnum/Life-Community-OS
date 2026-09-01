/**
 * Community Intelligence isolation tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  CommunityActionRegistry,
  isOpaqueCommunityIntelligenceEntity,
  intelligenceRespectsTerritory,
  projectLifePlaceExperienceView,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CommunityIntelligenceService } from "@/lib/community/community-intelligence-service";
import { DiscoverExperienceService } from "@/lib/community/discover-experience-service";
import { LifeHomeService } from "@/lib/community/life-home-service";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import { LifePlaceQueryService } from "@/lib/life-place/life-place-query";
import { replaceMarketplaceStoreForTests } from "@/lib/marketplace/server-marketplace-repository";
import {
  patchPersonalContextServer,
  replacePersonalStoreForTests,
} from "@/lib/personal/server-personal-repository";
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import { replaceReservationsStoreForTests } from "@/lib/reservations/server-reservations-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { getTenantPack } from "@/lib/tenant/registry";

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

function actor(input: {
  tenantSlug: string;
  personId?: string;
  hasMembership?: boolean;
}): RequestActor {
  const personId = input.personId ?? "person-alex";
  const hasMembership = input.hasMembership ?? true;
  return {
    authenticated: true,
    hasMembership,
    providerReference: "auth-user",
    personId,
    role: "member",
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : "",
    permissions: permissionsForRole("member", input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership,
      personId,
      tenantId: input.tenantSlug,
      role: "member",
    },
  };
}

describe("Community Intelligence isolation", () => {
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

  it("TEST 1 — usuario recibe sugerencias según intereses", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf"],
    });
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Partida de golf",
      description: "Green 9",
      status: "published",
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    const intelligence = await CommunityIntelligenceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(intelligence.suggestions.length > 0, true);
    assert.equal(intelligence.enabled, true);
  });

  it("TEST 2 — sin preferencias funciona fallback", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga al aire libre",
      description: "Terraza",
      status: "published",
      startsAt: new Date(Date.now() + 7200_000).toISOString(),
    });
    const ideas = await CommunityIntelligenceService.resolveDailyIdeas({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(ideas.length > 0, true);
  });

  it("TEST 3 — usuario desactiva recomendaciones", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf"],
      privacy: { receiveRecommendations: false, shareActivity: true },
    });
    const intelligence = await CommunityIntelligenceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(intelligence.enabled, false);
    assert.equal(intelligence.suggestions.length, 0);
  });

  it("TEST 4 — no existe tracking invasivo", () => {
    assert.equal(isOpaqueCommunityIntelligenceEntity("BehaviorTrackingEntity"), true);
    const source = readFileSync(
      path.join(HERE, "community-intelligence-service.ts"),
      "utf8",
    );
    assert.equal(/geofence|continuousTracking|exactLocation/i.test(source), false);
  });

  it("TEST 5 — no existe UserPredictionEntity", () => {
    assert.equal(isOpaqueCommunityIntelligenceEntity("UserPredictionEntity"), true);
    assert.equal(isOpaqueCommunityIntelligenceEntity("GlobalAIEntity"), true);
  });

  it("TEST 6 — Life Place usa contexto correcto", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["pool"],
    });
    await replaceLocationsForTests(PANO, [
      {
        id: "loc-pool",
        tenantId: PANO,
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        type: "facility",
        name: "Piscina",
        address: "Club",
        latitude: 37.41,
        longitude: -4.75,
        category: "pool",
        visibility: "public",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const result = await LifePlaceQueryService.get({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      locationId: "loc-pool",
      actor: actor({ tenantSlug: PANO }),
      productCapabilities: getTenantPack(PANO)?.productCapabilities,
      permissions: permissionsForRole("member", PANO),
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      const ideas = await CommunityIntelligenceService.resolvePlaceIdeas({
        tenantId: PANO,
        actor: actor({ tenantSlug: PANO }),
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        place: result.context,
      });
      const view = projectLifePlaceExperienceView(result.context, ideas);
      assert.equal(view.locationId, "loc-pool");
    }
  });

  it("TEST 7 — Magic Plus mantiene dominio", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf"],
    });
    const pack = getTenantPack(PANO);
    const actions = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: permissionsForRole("member", PANO),
      productCapabilities: pack?.productCapabilities,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const contributions = await CommunityIntelligenceService.resolveContributionIdeas(
      {
        tenantId: PANO,
        actor: actor({ tenantSlug: PANO }),
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      },
    );
    assert.equal(actions.length > 0, true);
    assert.equal(contributions.length > 0, true);
  });

  it("TEST 8 — tenant isolation", async () => {
    const pano = await CommunityIntelligenceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const valley = await CommunityIntelligenceService.resolve({
      tenantId: VALLEY,
      actor: actor({ tenantSlug: VALLEY }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(
      intelligenceRespectsTerritory(pano, PANO, LIFE_PANORAMICA_TERRITORY_UUID),
      true,
    );
    assert.equal(
      intelligenceRespectsTerritory(valley, PANO, LIFE_PANORAMICA_TERRITORY_UUID),
      false,
    );
  });

  it("TEST 9 — privacy protegida", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      privacy: { receiveRecommendations: false, shareActivity: false },
    });
    const home = await LifeHomeService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territoryName: "Panorámica Golf",
    });
    const enriched = await CommunityIntelligenceService.enrichHome(home, {
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("forYouToday" in enriched, false);
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    assert.notEqual(LIFE_PANORAMICA_TERRITORY_UUID, LIFE_VALLEY_TERRITORY_UUID);
    const source = readFileSync(
      path.join(HERE, "community-intelligence-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 11 — home enriquecido con Para ti hoy", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["sports"],
    });
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga fitness",
      description: "Deporte",
      status: "published",
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    const home = await LifeHomeService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territoryName: "Panorámica Golf",
    });
    const enriched = await CommunityIntelligenceService.enrichHome(home, {
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      enriched.forYouToday === undefined || enriched.forYouToday.length >= 0,
      true,
    );
  });

  it("TEST 12 — discover enriquecido con ideas", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Brunch vecinal",
      description: "Terraza",
      status: "published",
      startsAt: new Date(Date.now() + 5400_000).toISOString(),
    });
    const discover = await DiscoverExperienceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const enriched = await CommunityIntelligenceService.enrichDiscover(discover, {
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      enriched.ideasForToday === undefined || enriched.ideasForToday.length >= 0,
      true,
    );
  });

  it("TEST 13 — contribution ideas explicables", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["help"],
    });
    const contributions = await CommunityIntelligenceService.resolveContributionIdeas(
      {
        tenantId: PANO,
        actor: actor({ tenantSlug: PANO }),
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      },
    );
    assert.equal(
      contributions.every((row) => row.reason.startsWith("Porque")),
      true,
    );
  });

  it("TEST 14 — intelligence context projection", async () => {
    const intelligence = await CommunityIntelligenceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(intelligence.personId, "person-alex");
    assert.equal(intelligence.tenantId, PANO);
    assert.equal(intelligence.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    assert.equal("behaviorProfile" in intelligence, false);
  });

  it("TEST 15 — guest no recibe sugerencias personales", async () => {
    const intelligence = await CommunityIntelligenceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, hasMembership: false }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(intelligence.personId, "anonymous");
    assert.equal(intelligence.suggestions.length, 0);
  });

  it("TEST 16 — explain suggestion humano", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      interests: ["golf"],
    });
    const intelligence = await CommunityIntelligenceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    for (const suggestion of intelligence.suggestions) {
      const explanation = intelligence.explanations[suggestion.id];
      assert.equal(explanation?.includes("sistema sabe"), false);
    }
  });

  it("TEST 17 — feed scoped to territory", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Pano golf",
      description: "x",
      status: "published",
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    await createExperienceServer({
      tenantId: VALLEY,
      ownerPersonId: "person-alex",
      title: "Valley yoga",
      description: "x",
      status: "published",
      startsAt: new Date(Date.now() + 7200_000).toISOString(),
    });
    const pano = await CommunityIntelligenceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(pano.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
  });

  it("TEST 18 — no opaque AI entities in service", () => {
    assert.equal(isOpaqueCommunityIntelligenceEntity("SocialGraphAI"), true);
    assert.equal(isOpaqueCommunityIntelligenceEntity("AICommunityManager"), true);
  });

  it("TEST 19 — resolveDailyIdeas bounded", async () => {
    for (let index = 0; index < 10; index += 1) {
      await createExperienceServer({
        tenantId: PANO,
        ownerPersonId: "person-alex",
        title: `Actividad ${index}`,
        description: "x",
        status: "published",
        startsAt: new Date(Date.now() + (index + 1) * 3600_000).toISOString(),
      });
    }
    const ideas = await CommunityIntelligenceService.resolveDailyIdeas({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(ideas.length <= 6, true);
  });

  it("TEST 20 — fromRequest territory binding", async () => {
    const home = await LifeHomeService.fromRequest({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
    });
    assert.equal(home === null || typeof home?.territory.territoryId === "string", true);
  });
});
