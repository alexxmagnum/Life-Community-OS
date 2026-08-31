import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CAPABILITIES } from "../platform/capabilities";
import {
  EMPTY_PRODUCT_CAPABILITIES,
  type ProductCapabilityMap,
} from "../platform/tenant-contract";
import {
  COMMUNITY_CREATION_ACTIONS,
  CommunityActionRegistry,
  communityCreationRoute,
  isCommunityCreationActionType,
  sanitizeCommunityCreationContext,
} from "./action-composer";

const PANO_TERRITORY = "10000000-0000-4000-8000-000000000002";

const MEMBER_CAPS = [
  CAPABILITIES.experienceCreate,
  CAPABILITIES.contentCreate,
  CAPABILITIES.localView,
  CAPABILITIES.marketplaceCreate,
  CAPABILITIES.groupCreate,
];

const OPEN_PRODUCT: ProductCapabilityMap = {
  ...EMPTY_PRODUCT_CAPABILITIES,
  experiences: true,
  community: true,
  marketplace: true,
  lifeMap: true,
};

describe("Action Composer contract", () => {
  it("lists domain create actions for a member with Territory", () => {
    const actions = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: MEMBER_CAPS,
      productCapabilities: OPEN_PRODUCT,
      territoryId: PANO_TERRITORY,
    });
    assert.equal(actions.some((item) => item.type === "experience_create"), true);
    assert.equal(actions.some((item) => item.type === "help_request"), true);
    assert.equal(
      actions.some((item) => item.type === "marketplace_listing"),
      true,
    );
    assert.equal(
      actions.some((item) => item.route === "/register"),
      false,
    );
  });

  it("hides an action when its product capability is off", () => {
    const actions = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: MEMBER_CAPS,
      productCapabilities: { ...OPEN_PRODUCT, marketplace: false },
      territoryId: PANO_TERRITORY,
    });
    assert.equal(
      actions.some((item) => item.type === "marketplace_listing"),
      false,
    );
    assert.equal(actions.some((item) => item.type === "experience_create"), true);
  });

  it("does not list actions without membership", () => {
    const actions = CommunityActionRegistry.list({
      hasMembership: false,
      capabilities: MEMBER_CAPS,
      productCapabilities: OPEN_PRODUCT,
      territoryId: PANO_TERRITORY,
    });
    assert.equal(actions.length, 0);
  });

  it("preselects a Location on Experience create without sending territory", () => {
    const action = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "experience_create",
    );
    assert.ok(action);
    const href = communityCreationRoute(action, {
      source: "life_place",
      locationId: "loc-pool",
      locationName: "Piscina",
    });
    assert.equal(href.includes("locationId=loc-pool"), true);
    assert.equal(/territoryId=/.test(href), false);
    assert.equal(/createdBy=/.test(href), false);
    assert.equal(/source=/.test(href), false);
  });

  it("routes help offer and local service without inventing a marketplace type", () => {
    const offer = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "help_offer",
    );
    const service = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "offer_service",
    );
    assert.ok(offer);
    assert.ok(service);
    assert.equal(
      communityCreationRoute(offer).includes("type=offer_help"),
      true,
    );
    assert.equal(
      communityCreationRoute(service).includes("intent=service"),
      true,
    );
    assert.equal(communityCreationRoute(offer).includes("type=sale"), false);
  });

  it("does not invent a universal creation entity", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(path.join(here, "action-composer.ts"), "utf8");
    assert.equal(/CommunityAction\b/.test(source), false);
    assert.equal(/UserPostUniversal/.test(source), false);
    assert.equal(/LifeCreationEntity/.test(source), false);
    assert.equal(/ActivityEntity/.test(source), false);
    assert.equal(/unsplash/i.test(source), false);
    assert.equal(isCommunityCreationActionType("experience_create"), true);
    assert.equal(isCommunityCreationActionType("resource_admin"), false);
  });

  it("sanitizes CreationContext without territory or owner", () => {
    const clean = sanitizeCommunityCreationContext({
      source: "life_place",
      locationId: " loc-pool ",
      locationName: " Piscina ",
    });
    assert.equal(clean.source, "life_place");
    assert.equal(clean.locationId, "loc-pool");
    assert.equal(clean.locationName, "Piscina");
    const extra = sanitizeCommunityCreationContext({
      source: "home",
      locationId: "loc-1",
      ...({ territoryId: PANO_TERRITORY, createdBy: "person-x" } as object),
    });
    assert.equal("territoryId" in extra, false);
    assert.equal("createdBy" in extra, false);
    assert.equal(extra.source, "home");
  });
});
