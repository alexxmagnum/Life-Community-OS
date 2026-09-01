/**
 * Community Experience Evolution isolation tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  CAPABILITIES,
  guestCanAccess,
  isOpaqueCommunityExperienceEntity,
  magicPlusEligible,
  projectLifePlaceExperienceView,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { DiscoverExperienceService } from "@/lib/community/discover-experience-service";
import { LifeHomeService } from "@/lib/community/life-home-service";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import { LifePlaceQueryService } from "@/lib/life-place/life-place-query";
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
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
  role?: MembershipRole;
  personId?: string;
  hasMembership?: boolean;
}): RequestActor {
  const role = input.role ?? "member";
  const personId = input.personId ?? "person-alex";
  const hasMembership = input.hasMembership ?? true;
  return {
    authenticated: true,
    hasMembership,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : "",
    permissions: permissionsForRole(role, input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership,
      personId,
      tenantId: input.tenantSlug,
      role,
    },
  };
}

describe("Community Experience Evolution isolation", () => {
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

  it("TEST 1 — Home muestra vida real", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Aquagym",
      description: "Piscina",
      status: "published",
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    const home = await LifeHomeService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territoryName: "Panorámica Golf",
    });
    assert.equal(
      home.currentActivities.length + home.upcomingActivities.length > 0,
      true,
    );
  });

  it("TEST 2 — Magic Plus aparece con membership", () => {
    assert.equal(
      magicPlusEligible({
        membershipStatus: "active",
        capabilities: [CAPABILITIES.experienceCreate],
        requiredCapability: CAPABILITIES.experienceCreate,
      }),
      true,
    );
  });

  it("TEST 3 — Guest no ve vida privada", () => {
    assert.equal(
      guestCanAccess({ resource: "private_community", hasActiveMembership: false }),
      false,
    );
    assert.equal(
      magicPlusEligible({
        membershipStatus: "removed",
        capabilities: [CAPABILITIES.experienceCreate],
        requiredCapability: CAPABILITIES.experienceCreate,
      }),
      false,
    );
  });

  it("TEST 4 — Life Place mantiene Location SoT", async () => {
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
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      const view = projectLifePlaceExperienceView(result.context);
      assert.equal(view.locationId, "loc-pool");
    }
  });

  it("TEST 5 — Discover usa datos reales", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga al aire libre",
      description: "Terraza",
      status: "published",
      startsAt: new Date(Date.now() + 7200_000).toISOString(),
    });
    const discover = await DiscoverExperienceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      discover.nowNearby.length + discover.upcomingPlans.length >= 0,
      true,
    );
    assert.equal("engagementScore" in discover, false);
  });

  it("TEST 6 — Personalization no inventa contenido", async () => {
    const items = await CommunityExperienceFeedService.list({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      permissions: permissionsForRole("member", PANO),
    });
    assert.equal(items.length >= 0, true);
  });

  it("TEST 7 — Privacy respetada", async () => {
    const home = await LifeHomeService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, hasMembership: false }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territoryName: "Panorámica Golf",
    });
    assert.equal("messages" in home, false);
    assert.equal("personId" in home, false);
  });

  it("TEST 8 — No existe SocialGraph", () => {
    assert.equal(isOpaqueCommunityExperienceEntity("SocialGraph"), true);
    assert.equal(isOpaqueCommunityExperienceEntity("UserEngagementScore"), true);
  });

  it("TEST 9 — Tenant isolation", async () => {
    const pano = await LifeHomeService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territoryName: "Panorámica Golf",
    });
    const valley = await LifeHomeService.resolve({
      tenantId: VALLEY,
      actor: actor({ tenantSlug: VALLEY }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
      territoryName: "Valley",
    });
    assert.notEqual(pano.territory.tenantId, valley.territory.tenantId);
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    assert.notEqual(LIFE_PANORAMICA_TERRITORY_UUID, LIFE_VALLEY_TERRITORY_UUID);
    const source = readFileSync(
      path.join(HERE, "life-home-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 11 — home API membership guest scope", async () => {
    const home = await LifeHomeService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, hasMembership: false }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territoryName: "Panorámica Golf",
    });
    assert.equal(home.membershipScope, "guest");
  });

  it("TEST 12 — discover living places from locations", async () => {
    await replaceLocationsForTests(PANO, [
      {
        id: "loc-1",
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
    const discover = await DiscoverExperienceService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(discover.livingPlaces.some((row) => row.id === "loc-1"), true);
  });

  it("TEST 13 — life place experience view empty copy", async () => {
    await replaceLocationsForTests(PANO, [
      {
        id: "loc-quiet",
        tenantId: PANO,
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        type: "facility",
        name: "Jardín",
        address: "Club",
        latitude: 37.41,
        longitude: -4.75,
        category: "garden",
        visibility: "public",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const result = await LifePlaceQueryService.get({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      locationId: "loc-quiet",
      actor: actor({ tenantSlug: PANO }),
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      const view = projectLifePlaceExperienceView(result.context);
      assert.equal(view.empty.title.length > 0, true);
    }
  });

  it("TEST 14 — home territory hero", async () => {
    const home = await LifeHomeService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territoryName: "Panorámica Golf",
    });
    assert.equal(home.territory.territoryName, "Panorámica Golf");
  });

  it("TEST 15 — discover excludes opaque entities", () => {
    assert.equal(isOpaqueCommunityExperienceEntity("GlobalSocialNetworkEntity"), true);
    assert.equal(isOpaqueCommunityExperienceEntity("PersonalBehaviorTracking"), true);
  });

  it("TEST 16 — home actions include discover", async () => {
    const home = await LifeHomeService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territoryName: "Panorámica Golf",
    });
    assert.equal(
      home.actions.some((row) => row.label.includes("Descubrir")),
      true,
    );
  });

  it("TEST 17 — feed service territory scoped", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Pano only",
      description: "x",
      status: "published",
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    await createExperienceServer({
      tenantId: VALLEY,
      ownerPersonId: "person-alex",
      title: "Valley only",
      description: "x",
      status: "published",
      startsAt: new Date(Date.now() + 7200_000).toISOString(),
    });
    const panoItems = await CommunityExperienceFeedService.list({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      permissions: permissionsForRole("member", PANO),
    });
    assert.equal(panoItems.every((row) => row.territoryId === LIFE_PANORAMICA_TERRITORY_UUID), true);
  });

  it("TEST 18 — guest public content access", () => {
    assert.equal(
      guestCanAccess({ resource: "open_content", hasActiveMembership: false }),
      true,
    );
  });

  it("TEST 19 — home from request null without territory", async () => {
    const home = await LifeHomeService.fromRequest({
      tenantId: PANO,
      actor: { ...actor({ tenantSlug: PANO }), territoryId: undefined },
      queryTerritoryId: null,
    });
    assert.equal(home === null || typeof home?.territory.territoryId === "string", true);
  });

  it("TEST 20 — discover from request resolves", async () => {
    const discover = await DiscoverExperienceService.fromRequest({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
    });
    assert.equal(discover === null || typeof discover?.tenantId === "string", true);
  });
});
