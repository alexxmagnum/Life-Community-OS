import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "url";
import path from "node:path";
import { COMMUNITY_CREATION_ACTIONS } from "../community/action-composer";
import type { CommunityFeedItem } from "../community/community-feed";
import {
  emptyPersonalContext,
  favoriteLocationsFrom,
  isPersonalInterestId,
  personalFavoriteId,
  sanitizeInterestIds,
} from "./personal-context";
import {
  composerSuggestionReason,
  hasContinuousLocationTracking,
  isOpaqueRecommendationEntity,
  listCommunityInsights,
  personalizeCommunityFeed,
  personalizeComposerActions,
  personalizeLifePlaceContext,
  RuleBasedPersonalizationProvider,
} from "./personalization";

const PANO = "life-panoramica";
const TERRITORY = "10000000-0000-4000-8000-000000000002";

function item(
  partial: Partial<CommunityFeedItem> & Pick<CommunityFeedItem, "id" | "title" | "type">,
): CommunityFeedItem {
  return {
    tenantId: PANO,
    territoryId: TERRITORY,
    actions: { primary: "join" },
    ...partial,
  };
}

describe("Personal Context", () => {
  it("keeps only known explicit interests", () => {
    const ids = sanitizeInterestIds(["golf", "unknown", "pool", "golf"]);
    assert.deepEqual(ids, ["golf", "pool"]);
    assert.equal(isPersonalInterestId("golf"), true);
    assert.equal(isPersonalInterestId("dark-pattern"), false);
  });

  it("builds favorite ids without a FavoriteEntity", () => {
    const id = personalFavoriteId("person-alex", "location", "loc-golf");
    assert.equal(id.includes("person-alex"), true);
    assert.equal(
      favoriteLocationsFrom([
        {
          id,
          tenantId: PANO,
          personId: "person-alex",
          kind: "location",
          targetId: "loc-golf",
        },
      ])[0],
      "loc-golf",
    );
  });
});

describe("Rule-based personalization", () => {
  it("prioritizes golf without removing yoga", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    context.preferences.interests = ["golf"];
    const yoga = item({ id: "exp-yoga", title: "Yoga", type: "experience" });
    const golf = item({
      id: "exp-golf",
      title: "Partido de golf",
      type: "experience",
    });
    const dinner = item({ id: "exp-cena", title: "Cena", type: "experience" });
    const result = RuleBasedPersonalizationProvider.personalize({
      context,
      feed: [yoga, golf, dinner],
    });
    assert.equal(result.items[0]?.id, "exp-golf");
    assert.equal(result.items.some((row) => row.id === "exp-yoga"), true);
    assert.equal(result.items.length, 3);
    assert.equal(result.items[0]?.reason, "Te interesa golf");
  });

  it("falls back to original order without preferences", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    const yoga = item({ id: "exp-yoga", title: "Yoga", type: "experience" });
    const golf = item({
      id: "exp-golf",
      title: "Partido de golf",
      type: "experience",
    });
    const result = personalizeCommunityFeed({
      context,
      feed: [yoga, golf],
    });
    assert.equal(result.items[0]?.id, "exp-yoga");
    assert.equal(result.items[1]?.id, "exp-golf");
    assert.equal(result.items[0]?.reason, undefined);
  });

  it("does not reorder when recommendations are off", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    context.preferences.interests = ["golf"];
    context.privacy.receiveRecommendations = false;
    const yoga = item({ id: "exp-yoga", title: "Yoga", type: "experience" });
    const golf = item({
      id: "exp-golf",
      title: "Partido de golf",
      type: "experience",
    });
    const result = personalizeCommunityFeed({
      context,
      feed: [yoga, golf],
    });
    assert.equal(result.enabled, false);
    assert.equal(result.items[0]?.id, "exp-yoga");
  });

  it("boosts family pool over adult nightlife", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    context.preferences.interests = ["family", "sports"];
    const night = item({
      id: "exp-night",
      title: "After nocturno de copas",
      type: "event",
    });
    const pool = item({
      id: "exp-pool",
      title: "Actividad familiar en la piscina",
      type: "experience",
    });
    const result = personalizeCommunityFeed({
      context,
      feed: [night, pool],
    });
    assert.equal(result.items[0]?.id, "exp-pool");
  });

  it("suggests composer actions without forcing them", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    context.preferences.interests = ["help"];
    const ordered = personalizeComposerActions(
      COMMUNITY_CREATION_ACTIONS,
      context,
    );
    assert.equal(ordered[0]?.type, "help_request");
    assert.equal(
      composerSuggestionReason(ordered[0]!, context),
      "Porque te interesa ayudar",
    );
  });

  it("builds insights without spam when a favorite place is alive", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    context.favoriteLocations = ["loc-golf"];
    const golf = item({
      id: "exp-golf",
      title: "Partido de golf",
      type: "experience",
      locationId: "loc-golf",
      capacity: { total: 4, available: 1 },
    });
    const insights = listCommunityInsights({ context, feed: [golf] });
    assert.ok(insights.length > 0);
    assert.equal(insights[0]?.body.includes("plazas"), true);
  });

  it("orders Life Place activity without changing the place", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    context.preferences.interests = ["golf"];
    const yoga = item({ id: "exp-yoga", title: "Yoga", type: "experience", experienceId: "yoga-1" });
    const golf = item({
      id: "exp-golf",
      title: "Partido de golf",
      type: "experience",
      experienceId: "golf-1",
    });
    const place = {
      id: "place-1",
      tenantId: PANO,
      territoryId: TERRITORY,
      location: {
        id: "loc-1",
        name: "Campo",
        type: "amenity",
        category: "sport",
      },
      currentActivity: [yoga, golf],
      experiences: [
        { id: "yoga-1", title: "Yoga", href: "/experiences/yoga-1" },
        { id: "golf-1", title: "Partido de golf", href: "/experiences/golf-1" },
      ],
      resources: [],
      reservations: [],
      actions: [],
    };
    const next = personalizeLifePlaceContext(place, context);
    assert.equal(next.location.id, "loc-1");
    assert.equal(next.currentActivity[0]?.id, "exp-golf");
    assert.equal(next.experiences[0]?.id, "golf-1");
  });

  it("does not invent opaque entities or continuous tracking", () => {
    const source = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "personalization.ts"),
      "utf8",
    );
    assert.equal(isOpaqueRecommendationEntity("RecommendationEntity"), true);
    assert.equal(/export type RecommendationEntity/.test(source), false);
    assert.equal(/export type InterestPost/.test(source), false);
    assert.equal(/export type UserScoreEntity/.test(source), false);
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: TERRITORY,
    });
    assert.equal(hasContinuousLocationTracking(context), false);
  });
});
