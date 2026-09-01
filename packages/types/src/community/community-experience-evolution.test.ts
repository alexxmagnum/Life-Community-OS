/**
 * Community Experience Evolution contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { CAPABILITIES } from "../platform/capabilities";
import { guestCanAccess, magicPlusEligible } from "../membership/onboarding-context";
import {
  projectDiscoverExperienceContext,
  discoverUsesRealDomainData,
} from "./discover-experience";
import {
  homeShowsTerritoryLife,
  isOpaqueCommunityExperienceEntity,
  personalizationDoesNotInventContent,
  projectLifeHomeContext,
  projectProfileLifeContext,
  resolveLifeHomeMembershipScope,
} from "./life-home";
import { createLocation } from "../domain/location";
import {
  projectLifePlaceExperienceView,
  lifePlaceMaintainsLocationSoT,
  lifePlaceViewIsNotSocialProfile,
} from "../platform/life-place-experience-view";
import { createLifePlaceContext } from "../platform/life-place";
import { projectTerritoryDailyPulse } from "./operations";
import { territoryHomeQuery } from "../platform/territory-experience";
import type { CommunityFeedItem } from "./community-feed";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PANO = "life-panoramica";
const PANO_TERRITORY = "10000000-0000-4000-8000-000000000002";
const VALLEY_TERRITORY = "20000000-0000-4000-8000-000000000002";

function feedItem(
  partial: Partial<CommunityFeedItem> & Pick<CommunityFeedItem, "id" | "title">,
): CommunityFeedItem {
  return {
    tenantId: PANO,
    territoryId: PANO_TERRITORY,
    type: "experience",
    actions: { primary: "join" },
    ...partial,
  };
}

describe("Community Experience Evolution", () => {
  it("TEST 1 — Home muestra vida real", () => {
    const pulse = projectTerritoryDailyPulse({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      items: [
        feedItem({
          id: "exp-1",
          title: "Aquagym",
          startsAt: new Date(Date.now() + 60_000).toISOString(),
        }),
      ],
    });
    const home = projectLifeHomeContext({
      query: territoryHomeQuery({ tenantId: PANO, territoryId: PANO_TERRITORY }),
      territoryName: "Panorámica Golf",
      pulse,
      membershipScope: "active",
      capabilities: [CAPABILITIES.experienceCreate],
    });
    assert.equal(homeShowsTerritoryLife(home), true);
    assert.equal(home.currentActivities.length + home.upcomingActivities.length > 0, true);
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
    const home = projectLifeHomeContext({
      query: territoryHomeQuery({ tenantId: PANO, territoryId: PANO_TERRITORY }),
      territoryName: "Panorámica Golf",
      pulse: projectTerritoryDailyPulse({
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        items: [],
      }),
      membershipScope: "active",
      capabilities: [CAPABILITIES.experienceCreate],
    });
    assert.equal(home.magicPlusEligible, true);
  });

  it("TEST 3 — Guest no ve vida privada", () => {
    assert.equal(
      guestCanAccess({ resource: "private_community", hasActiveMembership: false }),
      false,
    );
    assert.equal(resolveLifeHomeMembershipScope({ hasMembership: false }), "guest");
    const home = projectLifeHomeContext({
      query: territoryHomeQuery({ tenantId: PANO, territoryId: PANO_TERRITORY }),
      territoryName: "Panorámica Golf",
      pulse: projectTerritoryDailyPulse({
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        items: [],
      }),
      membershipScope: "guest",
      capabilities: [],
    });
    assert.equal(home.magicPlusEligible, false);
    assert.equal(home.membershipScope, "guest");
  });

  it("TEST 4 — Life Place mantiene Location SoT", () => {
    const location = createLocation({
      id: "loc-pool",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      type: "facility",
      name: "Piscina",
      address: "Club",
      latitude: 37.41,
      longitude: -4.75,
      category: "pool",
      visibility: "public",
    });
    const context = createLifePlaceContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      location,
      currentActivity: [
        feedItem({
          id: "exp-now",
          title: "Aquagym",
          locationId: "loc-pool",
          actions: { primary: "join" },
        }),
      ],
      experiences: [
        {
          id: "exp-next",
          title: "Clase infantil",
          href: "/experiences/exp-next",
        },
      ],
    });
    const view = projectLifePlaceExperienceView(context);
    assert.equal(lifePlaceMaintainsLocationSoT(view, "loc-pool"), true);
    assert.equal(view.nowLabel?.includes("Aquagym"), true);
  });

  it("TEST 5 — Discover usa datos reales", () => {
    const discover = projectDiscoverExperienceContext({
      query: {
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        capabilities: [],
        locale: "es",
      },
      items: [
        feedItem({
          id: "exp-2",
          title: "Yoga",
          startsAt: new Date(Date.now() + 120_000).toISOString(),
        }),
      ],
      livingPlaces: [{ id: "loc-1", name: "Piscina", href: "/locations/loc-1" }],
    });
    assert.equal(discoverUsesRealDomainData(discover), true);
    assert.equal(discover.livingPlaces.length, 1);
  });

  it("TEST 6 — Personalization no inventa contenido", () => {
    assert.equal(personalizationDoesNotInventContent(5, 5), true);
    assert.equal(personalizationDoesNotInventContent(5, 4), true);
    assert.equal(personalizationDoesNotInventContent(3, 5), false);
  });

  it("TEST 7 — Privacy respetada", () => {
    const profile = projectProfileLifeContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    assert.equal(profile.isPublicTimeline, false);
    assert.equal("followers" in profile, false);
  });

  it("TEST 8 — No existe SocialGraph", () => {
    assert.equal(isOpaqueCommunityExperienceEntity("SocialGraph"), true);
    assert.equal(isOpaqueCommunityExperienceEntity("UniversalCommunityFeed"), true);
  });

  it("TEST 9 — Tenant isolation", () => {
    const pulse = projectTerritoryDailyPulse({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      items: [
        feedItem({ id: "a", title: "A", territoryId: PANO_TERRITORY }),
        feedItem({ id: "b", title: "B", territoryId: VALLEY_TERRITORY }),
      ],
    });
    assert.equal(pulse.now.length + pulse.next.length <= 1, true);
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    const source = readFileSync(path.join(HERE, "life-home.ts"), "utf8");
    assert.equal(/if tenant === panoramica/.test(source), false);
    assert.notEqual(PANO_TERRITORY, VALLEY_TERRITORY);
  });

  it("Life Place view is not social profile", () => {
    const location = createLocation({
      id: "loc-1",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      type: "facility",
      name: "Club",
      address: "Club",
      latitude: 37.41,
      longitude: -4.75,
      category: "club",
      visibility: "public",
    });
    const context = createLifePlaceContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      location,
    });
    assert.equal(lifePlaceViewIsNotSocialProfile(projectLifePlaceExperienceView(context)), true);
  });

  it("Discover empty state invitation", () => {
    const discover = projectDiscoverExperienceContext({
      query: {
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        capabilities: [],
        locale: "es",
      },
      items: [],
    });
    assert.equal(typeof discover.empty?.title, "string");
  });

  it("Home empty premium copy", () => {
    const home = projectLifeHomeContext({
      query: territoryHomeQuery({ tenantId: PANO, territoryId: PANO_TERRITORY }),
      territoryName: "Panorámica Golf",
      pulse: projectTerritoryDailyPulse({
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        items: [],
      }),
      membershipScope: "active",
      capabilities: [],
    });
    assert.equal(typeof home.empty?.title, "string");
    assert.equal(typeof home.empty?.discoverCta, "string");
  });

  it("Pending membership scope", () => {
    assert.equal(
      resolveLifeHomeMembershipScope({ hasMembership: true, membershipStatus: "pending" }),
      "pending",
    );
  });

  it("Profile life title", () => {
    const profile = projectProfileLifeContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    assert.equal(profile.title, "Mi vida aquí");
  });
});
