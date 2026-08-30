import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAPABILITIES } from "../platform/capabilities";
import { EMPTY_PRODUCT_CAPABILITIES } from "../platform/tenant-contract";
import {
  communityFeedItemHref,
  communityFeedPrimaryLabel,
  communityFeedRankBand,
  discoverExperienceQuery,
  feedSourceEnabled,
  filterFeedItemsByCapabilities,
  lifeMapContextFromFeedItem,
  projectExperienceToFeedItem,
  projectResourceToFeedItem,
  sortCommunityFeedItems,
  type CommunityFeedItem,
} from "./community-feed";

const PANO = "life-panoramica";
const PANO_TERRITORY = "10000000-0000-4000-8000-000000000002";
const VALLEY_TERRITORY = "20000000-0000-4000-8000-000000000002";

function item(partial: Partial<CommunityFeedItem> & Pick<CommunityFeedItem, "id" | "title" | "type">): CommunityFeedItem {
  return {
    tenantId: PANO,
    territoryId: PANO_TERRITORY,
    actions: { primary: "view" },
    ...partial,
  };
}

describe("Community Experience Feed contract", () => {
  it("does not project a cancelled Experience", () => {
    const projected = projectExperienceToFeedItem({
      id: "exp-1",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      title: "Yoga cancelado",
      description: "No debe aparecer.",
      status: "cancelled",
      startsAt: "2026-08-31T16:00:00.000Z",
    });
    assert.equal(projected, null);
  });

  it("projects a published Experience with join as the primary action", () => {
    const projected = projectExperienceToFeedItem({
      id: "exp-2",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      title: "Clase de yoga",
      description: "Sala Wellness",
      status: "published",
      startsAt: "2026-08-31T16:00:00.000Z",
      location: "Sala Wellness",
      capacity: 12,
      occupied: 4,
    });
    assert.ok(projected);
    assert.equal(projected.type, "experience");
    assert.equal(projected.actions.primary, "join");
    assert.equal(communityFeedPrimaryLabel(projected), "Unirme");
    assert.equal(projected.capacity?.available, 8);
    assert.equal(projected.territoryId, PANO_TERRITORY);
    assert.notEqual(projected.territoryId, VALLEY_TERRITORY);
  });

  it("hides a module when its product capability is off", () => {
    assert.equal(
      feedSourceEnabled("experience", { ...EMPTY_PRODUCT_CAPABILITIES, experiences: false }),
      false,
    );
    assert.equal(
      feedSourceEnabled("experience", { ...EMPTY_PRODUCT_CAPABILITIES, experiences: true }),
      true,
    );
    const yoga = projectExperienceToFeedItem({
      id: "exp-3",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      title: "Yoga",
      description: "Sala",
      status: "published",
    });
    assert.ok(yoga);
    const hidden = filterFeedItemsByCapabilities(
      [yoga],
      { ...EMPTY_PRODUCT_CAPABILITIES, experiences: false },
      [CAPABILITIES.experienceView],
    );
    assert.equal(hidden.length, 0);
  });

  it("orders now → next → relevant → popular, never by id", () => {
    const now = Date.parse("2026-08-30T18:00:00.000Z");
    const ranked = sortCommunityFeedItems(
      [
        item({
          id: "zzz-popular",
          type: "community",
          title: "Grupo lleno",
          capacity: { total: 10, available: 1 },
        }),
        item({
          id: "aaa-later",
          type: "experience",
          title: "Yoga mañana",
          startsAt: "2026-08-31T16:00:00.000Z",
          actions: { primary: "join" },
        }),
        item({
          id: "mmm-now",
          type: "event",
          title: "Aquagym ahora",
          startsAt: "2026-08-30T17:30:00.000Z",
          endsAt: "2026-08-30T19:00:00.000Z",
          actions: { primary: "join" },
        }),
        item({
          id: "bbb-help",
          type: "community",
          title: "Ayuda vecinal",
          actions: { primary: "contact" },
        }),
      ],
      now,
    );
    assert.deepEqual(
      ranked.map((row) => row.title),
      ["Aquagym ahora", "Yoga mañana", "Ayuda vecinal", "Grupo lleno"],
    );
    assert.equal(communityFeedRankBand(ranked[0]!, now), "now");
    assert.equal(communityFeedRankBand(ranked[1]!, now), "next");
    assert.equal(communityFeedRankBand(ranked[2]!, now), "relevant");
    assert.equal(communityFeedRankBand(ranked[3]!, now), "popular");
  });

  it("maps an available resource to a reserve action and Life Map location", () => {
    const projected = projectResourceToFeedItem({
      id: "rs-pool",
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
      name: "Piscina",
      status: "active",
      location: "Club",
      locationId: "loc-pool",
      capacity: 8,
      available: 8,
      asReservation: true,
    });
    assert.ok(projected);
    assert.equal(projected.type, "reservation");
    assert.equal(communityFeedPrimaryLabel(projected), "Reservar");
    assert.equal(communityFeedItemHref(projected), "/resources/rs-pool/reserve");
    const marker = lifeMapContextFromFeedItem(projected);
    assert.ok(marker);
    assert.equal(marker.locationId, "loc-pool");
    assert.equal(marker.title, "Piscina");
  });

  it("builds a Discover query from Active Territory, not from a pack", () => {
    const query = discoverExperienceQuery({
      tenantId: PANO,
      territoryId: PANO_TERRITORY,
    });
    assert.ok(query);
    assert.equal(query.territoryId, PANO_TERRITORY);
    assert.equal(
      discoverExperienceQuery({ tenantId: PANO, territoryId: null }),
      null,
    );
  });
});
