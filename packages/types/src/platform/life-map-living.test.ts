import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocation } from "../domain/location";
import type { CommunityFeedItem } from "../community/community-feed";
import {
  applyFeedLifeToMapObject,
  buildLifeMapPlaceSheet,
  createLifeMapContext,
  filterLifeMapContextForQuery,
  lifeMapHrefForFeedItem,
  locationVisibleAtLivingZoom,
  projectLocationToLifeMapView,
  resolveLifeMapLivingLod,
} from "./life-map-living";
import type { LifeMapObject } from "../domain/life-map";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const TENANT = "tenant-community-a";
const TERRITORY = "10000000-0000-4000-8000-000000000002";
const OTHER = "20000000-0000-4000-8000-000000000002";

function location(id: string, type: "facility" | "business" = "facility") {
  return createLocation({
    id,
    tenantId: TENANT,
    territoryId: TERRITORY,
    type,
    name: type === "facility" ? "Piscina" : "Restaurante",
    address: "Club",
    latitude: 37.41,
    longitude: -4.75,
    category: type === "facility" ? "pool" : "restaurant",
    visibility: "public",
  });
}

function feed(partial: Partial<CommunityFeedItem> & Pick<CommunityFeedItem, "id" | "title" | "type">): CommunityFeedItem {
  return {
    tenantId: TENANT,
    territoryId: TERRITORY,
    actions: { primary: "join" },
    ...partial,
  };
}

describe("Life Map living Territory", () => {
  it("does not show location pins at territory zoom", () => {
    assert.equal(resolveLifeMapLivingLod(13), "territory");
    assert.equal(locationVisibleAtLivingZoom("facility", 13), false);
    assert.equal(locationVisibleAtLivingZoom("business", 13), false);
  });

  it("shows facilities as landmarks before businesses", () => {
    assert.equal(locationVisibleAtLivingZoom("facility", 15.2), true);
    assert.equal(locationVisibleAtLivingZoom("business", 15.2), false);
    assert.equal(locationVisibleAtLivingZoom("business", 16.8), true);
  });

  it("binds a feed item to a Location without a map entity", () => {
    const pool = location("loc-pool");
    const yoga = feed({
      id: "experience:yoga",
      type: "experience",
      title: "Clase de yoga",
      locationId: "loc-pool",
      experienceId: "exp-1",
      actions: { primary: "join" },
      capacity: { total: 12, available: 8 },
    });
    const context = createLifeMapContext({
      tenantId: TENANT,
      territoryId: TERRITORY,
      locations: [pool],
      feedItems: [yoga],
      territoryObjects: [],
    });
    assert.equal(context.locations[0]?.id, "loc-pool");
    assert.equal(context.activeFeedItems[0]?.title, "Clase de yoga");
    const sheet = buildLifeMapPlaceSheet({
      location: context.locations[0]!,
      feedItems: context.activeFeedItems,
    });
    assert.equal(sheet.primary.kind, "join");
    assert.equal(sheet.primary.label, "Unirme");
    assert.equal(sheet.nowLabel, "Clase de yoga");
    assert.equal(sheet.availabilityLabel, "8 plazas disponibles");
    assert.equal(lifeMapHrefForFeedItem(yoga), "/map?focus=loc-pool");
  });

  it("does not leak another Territory into the context", () => {
    const foreign = createLocation({
      id: "loc-other",
      tenantId: TENANT,
      territoryId: OTHER,
      type: "facility",
      name: "Pista ajena",
      address: "Otro",
      latitude: 37.2,
      longitude: -4.4,
      category: "sport",
      visibility: "public",
    });
    const context = createLifeMapContext({
      tenantId: TENANT,
      territoryId: TERRITORY,
      locations: [location("loc-pool"), foreign],
      feedItems: [
        feed({
          id: "experience:foreign",
          type: "experience",
          title: "Otro territorio",
          territoryId: OTHER,
          locationId: "loc-other",
        }),
      ],
      territoryObjects: [],
    });
    assert.equal(context.locations.some((item) => item.id === "loc-other"), false);
    assert.equal(context.activeFeedItems.length, 0);
  });

  it("maps a reservation feed item to Reservar", () => {
    const view = projectLocationToLifeMapView(location("loc-court"))!;
    const sheet = buildLifeMapPlaceSheet({
      location: view,
      feedItems: [
        feed({
          id: "reservation:rs-1",
          type: "reservation",
          title: "Pádel",
          locationId: "loc-court",
          resourceId: "rs-1",
          actions: { primary: "reserve" },
        }),
      ],
    });
    assert.equal(sheet.primary.kind, "reserve");
    assert.equal(sheet.primary.label, "Reservar");
    assert.equal(sheet.primary.href, "/resources/rs-1/reserve");
  });

  it("marks a Location object as alive when the feed has activity", () => {
    const object: LifeMapObject = {
      tenantId: TENANT,
      territoryId: TERRITORY,
      objectId: "loc-pool",
      type: "resource",
      layerId: "resources",
      state: "idle",
      position: { lat: 37.41, lng: -4.75 },
      availableActions: ["open", "navigate"],
      ref: { moduleId: "resources", entityKind: "location", entityId: "loc-pool" },
    };
    const next = applyFeedLifeToMapObject(object, [
      feed({
        id: "experience:yoga",
        type: "experience",
        title: "Yoga",
        locationId: "loc-pool",
        actions: { primary: "join" },
      }),
    ]);
    assert.equal(next.state, "active");
    assert.equal(next.availableActions.includes("join"), true);
  });

  it("hides pins in the territory LOD band", () => {
    const context = createLifeMapContext({
      tenantId: TENANT,
      territoryId: TERRITORY,
      locations: [location("loc-pool"), location("loc-resto", "business")],
      feedItems: [],
      territoryObjects: [],
    });
    const low = filterLifeMapContextForQuery(context, { zoom: 13 });
    assert.equal(low.locations.length, 0);
    const mid = filterLifeMapContextForQuery(context, { zoom: 15.1 });
    assert.equal(mid.locations.every((item) => item.type === "facility"), true);
  });

  it("does not hardcode a customer slug in the living contract", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(path.join(here, "life-map-living.ts"), "utf8");
    assert.equal(/panor[aá]mica/i.test(source), false);
    assert.equal(/life-panoramica/.test(source), false);
  });
});
