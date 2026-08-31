import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createLocation } from "../domain/location";
import type { CommunityFeedItem } from "../community/community-feed";
import {
  buildLifePlaceActions,
  createLifePlaceContext,
  lifePlaceActionLabel,
  lifePlaceAvailabilityLabel,
  lifePlaceNowLabel,
} from "./life-place";

const TENANT = "tenant-community-a";
const TERRITORY = "10000000-0000-4000-8000-000000000002";
const OTHER = "20000000-0000-4000-8000-000000000002";

function pool() {
  return createLocation({
    id: "loc-pool",
    tenantId: TENANT,
    territoryId: TERRITORY,
    type: "facility",
    name: "Piscina",
    address: "Club",
    latitude: 37.41,
    longitude: -4.75,
    category: "pool",
    visibility: "public",
    hours: "10:00–20:00",
  });
}

function feed(
  partial: Partial<CommunityFeedItem> & Pick<CommunityFeedItem, "id" | "title" | "type">,
): CommunityFeedItem {
  return {
    tenantId: TENANT,
    territoryId: TERRITORY,
    locationId: "loc-pool",
    actions: { primary: "join" },
    ...partial,
  };
}

describe("Life Place Experience Layer", () => {
  it("projects a Location without creating a PlaceEntity", () => {
    const context = createLifePlaceContext({
      tenantId: TENANT,
      territoryId: TERRITORY,
      location: pool(),
    });
    assert.equal(context.id, "loc-pool");
    assert.equal(context.location.name, "Piscina");
    assert.equal(context.currentActivity.length, 0);
    assert.equal(context.operations?.status, "available");
  });

  it("shows live Experience activity and Join", () => {
    const yoga = feed({
      id: "experience:yoga",
      type: "experience",
      title: "Aquagym",
      experienceId: "exp-1",
      capacity: { total: 12, available: 8 },
    });
    const context = createLifePlaceContext({
      tenantId: TENANT,
      territoryId: TERRITORY,
      location: pool(),
      currentActivity: [yoga],
      experiences: [
        {
          id: "exp-1",
          title: "Aquagym",
          href: "/experiences/exp-1",
          available: 8,
        },
      ],
    });
    assert.equal(lifePlaceNowLabel(context), "Aquagym");
    assert.equal(context.operations?.status, "activity_now");
    assert.equal(context.operations?.label, "Aquagym");
    assert.equal(lifePlaceAvailabilityLabel(context), "8 plazas disponibles");
    assert.equal(context.actions[0]?.kind, "join_experience");
    assert.equal(context.actions[0]?.href, "/experiences/exp-1");
    assert.equal(lifePlaceActionLabel("join_experience"), "Unirme");
  });

  it("maps a Resource reservation to Reservar", () => {
    const context = createLifePlaceContext({
      tenantId: TENANT,
      territoryId: TERRITORY,
      location: pool(),
      reservations: [
        {
          context: { type: "resource", id: "rs-pool" },
          available: 8,
          label: "Piscina",
          href: "/resources/rs-pool/reserve",
        },
      ],
    });
    const action = context.actions.find((item) => item.kind === "reserve_resource");
    assert.ok(action);
    assert.equal(action?.href, "/resources/rs-pool/reserve");
  });

  it("maps a Business to Ver negocio", () => {
    const restaurant = createLocation({
      id: "loc-resto",
      tenantId: TENANT,
      territoryId: TERRITORY,
      type: "business",
      name: "Restaurante",
      address: "Club",
      latitude: 37.41,
      longitude: -4.75,
      category: "restaurant",
      visibility: "public",
    });
    const context = createLifePlaceContext({
      tenantId: TENANT,
      territoryId: TERRITORY,
      location: restaurant,
      business: {
        id: "biz-1",
        name: "Restaurante",
        category: "restaurant",
        href: "/locations/loc-resto",
      },
    });
    const action = context.actions.find((item) => item.kind === "view_business");
    assert.ok(action);
    assert.equal(action?.label, "Ver negocio");
  });

  it("does not leak feed items from another Territory", () => {
    const context = createLifePlaceContext({
      tenantId: TENANT,
      territoryId: TERRITORY,
      location: pool(),
      currentActivity: [
        feed({
          id: "experience:foreign",
          type: "experience",
          title: "Ajeno",
          territoryId: OTHER,
          locationId: "loc-pool",
        }),
      ],
    });
    assert.equal(context.currentActivity.length, 0);
  });

  it("does not hardcode a customer slug or PlaceEntity", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(path.join(here, "life-place.ts"), "utf8");
    assert.equal(/panor[aá]mica/i.test(source), false);
    assert.equal(/PlaceEntity/.test(source), false);
    assert.equal(/unsplash/i.test(source), false);
    assert.equal(
      buildLifePlaceActions({
        location: { id: "x", name: "X", type: "facility", category: "pool" },
        currentActivity: [],
        experiences: [],
        reservations: [],
      }).some((item) => item.label === "Abrir"),
      false,
    );
  });
});
