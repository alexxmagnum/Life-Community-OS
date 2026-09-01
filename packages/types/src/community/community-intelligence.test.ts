/**
 * Community Intelligence contract tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { CAPABILITIES } from "../platform/capabilities";
import { COMMUNITY_CREATION_ACTIONS } from "./action-composer";
import type { CommunityFeedItem } from "./community-feed";
import {
  explainSuggestion,
  intelligenceDoesNotInventContent,
  intelligenceRespectsTerritory,
  isOpaqueCommunityIntelligenceEntity,
  projectCommunityIntelligenceContext,
  resolveContributionIdeas,
  resolveDailyIdeas,
  resolvePlaceIdeas,
  resolveSuggestions,
  suggestionUsesExplicitPreference,
} from "./intelligence";
import { projectDiscoverExperienceContext } from "./discover-experience";
import { projectLifeHomeContext } from "./life-home";
import { projectTerritoryDailyPulse } from "./operations";
import { territoryHomeQuery } from "../platform/territory-experience";
import { createLifePlaceContext } from "../platform/life-place";
import { createLocation } from "../domain/location";
import { projectLifePlaceExperienceView } from "../platform/life-place-experience-view";
import { emptyPersonalContext } from "../personal/personal-context";
import { discoverQueryFromActive } from "../platform/territory-experience";

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

describe("Community Intelligence", () => {
  it("TEST 1 — usuario recibe sugerencias según intereses", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      preferences: { categories: [], interests: ["golf"] },
    };
    const ideas = resolveDailyIdeas({
      context,
      feed: [
        feedItem({
          id: "golf-1",
          title: "Partida de golf",
          description: "Green 9 hoy",
        }),
      ],
    });
    assert.equal(ideas.length > 0, true);
    assert.equal(suggestionUsesExplicitPreference(ideas[0]!), true);
  });

  it("TEST 2 — sin preferencias funciona fallback", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const ideas = resolveDailyIdeas({
      context,
      feed: [
        feedItem({
          id: "any-1",
          title: "Yoga al aire libre",
        }),
      ],
    });
    assert.equal(ideas.length > 0, true);
    assert.equal(ideas[0]?.reason.includes("territorio"), true);
  });

  it("TEST 3 — usuario desactiva recomendaciones", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      preferences: { categories: [], interests: ["golf"] },
      privacy: { receiveRecommendations: false, shareActivity: true },
    };
    const ideas = resolveDailyIdeas({
      context,
      feed: [feedItem({ id: "golf-1", title: "Golf" })],
    });
    assert.equal(ideas.length, 0);
    const projected = projectCommunityIntelligenceContext({
      context,
      suggestions: [],
    });
    assert.equal(projected.enabled, false);
  });

  it("TEST 4 — no existe tracking invasivo", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const serialized = JSON.stringify(
      projectCommunityIntelligenceContext({ context, suggestions: [] }),
    );
    assert.equal(/geofence|exactLocation|continuousTracking/i.test(serialized), false);
  });

  it("TEST 5 — no existe UserPredictionEntity", () => {
    assert.equal(isOpaqueCommunityIntelligenceEntity("UserPredictionEntity"), true);
    assert.equal(isOpaqueCommunityIntelligenceEntity("CommunityBrainEntity"), true);
  });

  it("TEST 6 — Life Place usa contexto correcto", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      preferences: { categories: [], interests: ["pool"] },
    };
    const place = createLifePlaceContext({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      location: createLocation({
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
      }),
      currentActivity: [
        feedItem({
          id: "aquagym",
          title: "Aquagym",
          locationId: "loc-pool",
          metadata: { locationLabel: "Piscina" },
        }),
      ],
    });
    const ideas = resolvePlaceIdeas({ context, feed: [], place });
    assert.equal(ideas.length > 0, true);
    const view = projectLifePlaceExperienceView(place, ideas);
    assert.equal(view.suggestions?.length, ideas.length);
  });

  it("TEST 7 — Magic Plus mantiene dominio", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      preferences: { categories: [], interests: ["golf"] },
    };
    const contributions = resolveContributionIdeas({
      context,
      feed: [],
      composerActions: COMMUNITY_CREATION_ACTIONS,
    });
    assert.equal(
      contributions.some((row) => row.kind === "contribution" || row.kind === "composer"),
      true,
    );
    assert.equal(
      contributions.every((row) => !row.title.includes("automático")),
      true,
    );
  });

  it("TEST 8 — tenant isolation", () => {
    const pano = projectCommunityIntelligenceContext({
      context: emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      suggestions: [],
    });
    const valley = projectCommunityIntelligenceContext({
      context: emptyPersonalContext({
        personId: "person-alex",
        tenantId: "life-valley",
        territoryId: VALLEY_TERRITORY,
      }),
      suggestions: [],
    });
    assert.equal(intelligenceRespectsTerritory(pano, PANO, PANO_TERRITORY), true);
    assert.equal(intelligenceRespectsTerritory(valley, PANO, PANO_TERRITORY), false);
  });

  it("TEST 9 — privacy protegida", () => {
    const suggestion = {
      id: "s-1",
      title: "Golf",
      reason: "Porque te interesa golf",
      kind: "activity" as const,
    };
    const off = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      privacy: { receiveRecommendations: false, shareActivity: true },
    };
    assert.equal(
      explainSuggestion(suggestion, off).includes("desactivadas"),
      true,
    );
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    const source = readFileSync(path.join(HERE, "intelligence.ts"), "utf8");
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 11 — home incluye Para ti hoy", () => {
    const pulse = projectTerritoryDailyPulse({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      items: [feedItem({ id: "exp-1", title: "Aquagym" })],
    });
    const suggestion = {
      id: "daily:exp-1",
      title: "Aquagym",
      reason: "Porque te interesa piscina",
      kind: "activity" as const,
    };
    const home = projectLifeHomeContext({
      query: territoryHomeQuery({
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        territoryName: "Panorámica",
        slug: null,
        locale: "es",
        timezone: "UTC",
      }),
      territoryName: "Panorámica",
      pulse,
      membershipScope: "active",
      capabilities: [CAPABILITIES.experienceCreate],
      forYouToday: [suggestion],
    });
    assert.equal(home.forYouToday?.length, 1);
  });

  it("TEST 12 — discover incluye ideas para hoy", () => {
    const discover = projectDiscoverExperienceContext({
      query: discoverQueryFromActive({
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
        territoryName: "Panorámica",
        slug: null,
        locale: "es",
        timezone: "UTC",
      }),
      items: [feedItem({ id: "exp-2", title: "Terraza" })],
      ideasForToday: [
        {
          id: "daily:exp-2",
          title: "3 cosas que puedes hacer hoy",
          reason: "Porque ocurre hoy en tu territorio",
          kind: "activity",
        },
      ],
    });
    assert.equal(discover.ideasForToday?.length, 1);
  });

  it("TEST 13 — explicaciones humanas", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      preferences: { categories: [], interests: ["golf"] },
    };
    const projected = projectCommunityIntelligenceContext({
      context,
      suggestions: [
        {
          id: "s-1",
          title: "Golf",
          reason: "Porque te interesa golf",
          kind: "activity",
        },
      ],
    });
    assert.equal(projected.explanations["s-1"], "Porque te interesa golf");
    assert.equal(projected.explanations["s-1"]?.includes("sistema"), false);
  });

  it("TEST 14 — no inventa contenido", () => {
    const context = {
      ...emptyPersonalContext({
        personId: "person-alex",
        tenantId: PANO,
        territoryId: PANO_TERRITORY,
      }),
      preferences: { categories: [], interests: ["golf"] },
    };
    const feed = [
      feedItem({ id: "1", title: "A" }),
      feedItem({ id: "2", title: "B" }),
    ];
    const suggestions = resolveSuggestions({ context, feed });
    assert.equal(intelligenceDoesNotInventContent(feed.length, suggestions.length), true);
  });

  it("TEST 15 — provider rule-based", () => {
    const context = emptyPersonalContext({
      personId: "person-alex",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    const projected = projectCommunityIntelligenceContext({
      context,
      suggestions: [],
      providerId: "rules",
    });
    assert.equal(projected.providerId, "rules");
  });
});
