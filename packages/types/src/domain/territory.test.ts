import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createBusinessProfile } from "./business-profile";
import { createLocation } from "./location";
import {
  createBookableResourceRecord,
  createReservationRecord,
} from "./resource";
import { createMarketplaceListingRecord } from "./marketplace-listing";
import { createHelpRequestRecord } from "./help-request";
import { createPropertyRecord } from "./property";
import { createConversationRecord } from "../platform/communication/communication-core";
import { createMediaAsset } from "../platform/files/media-asset";
import {
  createTerritory,
  filterTerritoriesForTenant,
  slugifyTerritoryName,
} from "./territory";
import {
  businessBelongsToTerritory,
  communityRecordBelongsToTerritory,
  conversationBelongsToTerritory,
  denyCrossTerritoryAccess,
  filterLocationsForTerritory,
  helpBelongsToTerritory,
  locationBelongsToTerritory,
  marketplaceBelongsToTerritory,
  mediaBelongsToTerritory,
  propertyBelongsToTerritory,
  recordMatchesTerritoryScope,
  reservationBelongsToTerritory,
  resourceBelongsToTerritory,
} from "./territory-ownership";
import { resolveTerritoryContext } from "../platform/territory-context";

const LUXURY = "tenant-luxury-communities";

describe("Territory Core", () => {
  const panoramica = createTerritory({
    id: "terr-panoramica",
    tenantId: LUXURY,
    name: "Panorámica",
    status: "active",
    locale: "es",
    timezone: "Europe/Madrid",
  });
  const oceanHills = createTerritory({
    id: "terr-ocean-hills",
    tenantId: LUXURY,
    name: "Ocean Hills",
    status: "active",
    locale: "en",
    timezone: "Atlantic/Canary",
  });
  const outsider = createTerritory({
    id: "terr-new-client",
    tenantId: "tenant-other",
    name: "Nuevo cliente",
    status: "draft",
  });

  it("TEST 1 — a Tenant can own two Territories without pack identity", () => {
    const owned = filterTerritoriesForTenant(
      [panoramica, oceanHills, outsider],
      LUXURY,
    );
    assert.equal(owned.length, 2);
    assert.equal(owned.some((row) => row.id === outsider.id), false);
    assert.equal(slugifyTerritoryName("Panorámica"), "panoramica");
    assert.equal(panoramica.tenantId, oceanHills.tenantId);
    assert.notEqual(panoramica.id, oceanHills.id);
  });

  it("TEST 2 — Territory isolation does not bind a foreign Territory", () => {
    const denied = resolveTerritoryContext({
      tenantId: LUXURY,
      requestedTerritoryId: outsider.id,
      territories: [panoramica, oceanHills, outsider],
    });
    assert.equal(denied.ok, false);
    if (!denied.ok) {
      assert.equal(denied.issue.code, "tenant_mismatch");
    }
    const bound = resolveTerritoryContext({
      tenantId: LUXURY,
      requestedTerritoryId: oceanHills.id,
      territories: [panoramica, oceanHills, outsider],
    });
    assert.equal(bound.ok, true);
    if (bound.ok) {
      assert.equal(bound.context.territoryId, oceanHills.id);
      assert.equal(bound.context.tenantId, LUXURY);
    }
  });

  it("TEST 3 — Location belongs to the correct Territory", () => {
    const placeA = createLocation({
      id: "loc-a",
      tenantId: LUXURY,
      territoryId: panoramica.id,
      type: "business",
      name: "Clubhouse",
      address: "Panoramica",
      latitude: 37.41,
      longitude: -4.75,
      category: "restaurant",
    });
    const placeB = createLocation({
      id: "loc-b",
      tenantId: LUXURY,
      territoryId: oceanHills.id,
      type: "business",
      name: "Marina cafe",
      address: "Ocean Hills",
      latitude: 28.12,
      longitude: -15.43,
      category: "restaurant",
    });
    assert.equal(
      locationBelongsToTerritory(placeA, panoramica.id, LUXURY),
      true,
    );
    assert.equal(
      locationBelongsToTerritory(placeA, oceanHills.id, LUXURY),
      false,
    );
    const inOcean = filterLocationsForTerritory(
      [placeA, placeB],
      oceanHills.id,
      LUXURY,
    );
    assert.deepEqual(
      inOcean.map((place) => place.id),
      ["loc-b"],
    );
  });

  it("TEST 4 — Business belongs to the correct Territory", () => {
    const location = createLocation({
      id: "loc-biz",
      tenantId: LUXURY,
      territoryId: panoramica.id,
      type: "business",
      name: "Pro shop",
      address: "Panoramica",
      latitude: 37.41,
      longitude: -4.75,
      category: "shop",
    });
    const business = createBusinessProfile({
      tenantId: LUXURY,
      ownerPersonId: "person-1",
      locationId: location.id,
      name: "Pro shop",
      category: "retail",
    });
    assert.equal(
      businessBelongsToTerritory(business, location, panoramica.id, LUXURY),
      true,
    );
    assert.equal(
      businessBelongsToTerritory(business, location, oceanHills.id, LUXURY),
      false,
    );
  });

  it("TEST 5 — Resource belongs to the correct Territory", () => {
    const court = createBookableResourceRecord({
      tenantId: LUXURY,
      createdBy: "person-1",
      name: "Pista 1",
      description: "Pista de pádel",
      category: "sport",
      territoryId: panoramica.id,
    });
    assert.equal(
      resourceBelongsToTerritory(court, panoramica.id, LUXURY),
      true,
    );
    assert.equal(
      resourceBelongsToTerritory(court, oceanHills.id, LUXURY),
      false,
    );
  });

  it("TEST 6 — no cross access between Territories", () => {
    assert.equal(
      denyCrossTerritoryAccess(panoramica.id, oceanHills.id),
      true,
    );
    assert.equal(
      denyCrossTerritoryAccess(panoramica.id, panoramica.id),
      false,
    );
    const unbound = resolveTerritoryContext({
      tenantId: LUXURY,
      territories: [],
    });
    assert.equal(unbound.ok, false);
    if (!unbound.ok) {
      assert.equal(unbound.issue.code, "no_territory");
    }
  });

  it("TEST 7 — Location wrong Territory is denied", () => {
    const place = createLocation({
      id: "loc-wrong",
      tenantId: LUXURY,
      territoryId: panoramica.id,
      type: "business",
      name: "Clubhouse",
      address: "Panoramica",
      latitude: 37.41,
      longitude: -4.75,
      category: "restaurant",
    });
    assert.equal(
      locationBelongsToTerritory(place, oceanHills.id, LUXURY),
      false,
    );
  });

  it("TEST 8 — Business wrong Territory is denied even with Location", () => {
    const location = createLocation({
      id: "loc-biz-wrong",
      tenantId: LUXURY,
      territoryId: panoramica.id,
      type: "business",
      name: "Pro shop",
      address: "Panoramica",
      latitude: 37.41,
      longitude: -4.75,
      category: "shop",
    });
    const mismatched = createBusinessProfile({
      tenantId: LUXURY,
      ownerPersonId: "person-1",
      locationId: location.id,
      name: "Pro shop",
      category: "retail",
      territoryId: oceanHills.id,
    });
    assert.equal(
      businessBelongsToTerritory(mismatched, location, panoramica.id, LUXURY),
      false,
    );
    assert.equal(
      businessBelongsToTerritory(mismatched, location, oceanHills.id, LUXURY),
      false,
    );
  });

  it("TEST 9 — Resource wrong Territory is denied", () => {
    const court = createBookableResourceRecord({
      tenantId: LUXURY,
      createdBy: "person-1",
      name: "Pista 1",
      description: "Pista de pádel",
      category: "sport",
      territoryId: panoramica.id,
    });
    assert.equal(
      resourceBelongsToTerritory(court, oceanHills.id, LUXURY),
      false,
    );
  });

  it("TEST 10 — Reservation cannot cross Territory of its Resource", () => {
    const court = createBookableResourceRecord({
      tenantId: LUXURY,
      createdBy: "person-1",
      name: "Pista 1",
      description: "Pista de pádel",
      category: "sport",
      territoryId: panoramica.id,
    });
    const reservation = createReservationRecord({
      tenantId: LUXURY,
      resourceId: court.id,
      createdBy: "person-1",
      date: "2026-08-30",
      start: "10:00",
      end: "11:00",
      territoryId: panoramica.id,
    });
    assert.equal(
      reservationBelongsToTerritory(reservation, court, panoramica.id, LUXURY),
      true,
    );
    assert.equal(
      reservationBelongsToTerritory(reservation, court, oceanHills.id, LUXURY),
      false,
    );
  });

  it("TEST 11 — Community, Marketplace, Help, Housing, Communication and Media stay isolated", () => {
    const post = {
      id: "post-1",
      tenantId: LUXURY,
      territoryId: panoramica.id,
    };
    const listing = createMarketplaceListingRecord({
      tenantId: LUXURY,
      ownerPersonId: "person-1",
      createdBy: "person-1",
      type: "sale",
      category: "general",
      title: "Bicicleta",
      description: "En buen estado",
      territoryId: panoramica.id,
    });
    const help = createHelpRequestRecord({
      tenantId: LUXURY,
      createdBy: "person-1",
      type: "need_help",
      category: "general",
      title: "Ayuda mudanza",
      description: "Necesito caja",
      territoryId: panoramica.id,
    });
    const location = createLocation({
      id: "loc-home",
      tenantId: LUXURY,
      territoryId: panoramica.id,
      type: "community-place",
      name: "Villa",
      address: "Panoramica",
      latitude: 37.41,
      longitude: -4.75,
      category: "housing",
    });
    const property = createPropertyRecord({
      tenantId: LUXURY,
      createdBy: "person-1",
      title: "Villa 12",
      description: "Vivienda",
      propertyType: "villa",
      locationId: location.id,
      territoryId: panoramica.id,
    });
    const conversation = createConversationRecord({
      tenantId: LUXURY,
      createdBy: "person-1",
      type: "context",
      contextType: "community",
      contextId: "post-1",
      territoryId: panoramica.id,
    });
    const media = createMediaAsset({
      tenantId: LUXURY,
      ownerPersonId: "person-1",
      createdBy: "person-1",
      storageKey: "t/a.png",
      filename: "a.png",
      mimeType: "image/png",
      size: 12,
      type: "image",
      territoryId: panoramica.id,
    });
    assert.equal(
      communityRecordBelongsToTerritory(post, panoramica.id, LUXURY),
      true,
    );
    assert.equal(
      communityRecordBelongsToTerritory(post, oceanHills.id, LUXURY),
      false,
    );
    assert.equal(
      marketplaceBelongsToTerritory(listing, oceanHills.id, LUXURY),
      false,
    );
    assert.equal(helpBelongsToTerritory(help, oceanHills.id, LUXURY), false);
    assert.equal(
      propertyBelongsToTerritory(property, location, oceanHills.id, LUXURY),
      false,
    );
    assert.equal(
      conversationBelongsToTerritory(conversation, oceanHills.id, LUXURY),
      false,
    );
    assert.equal(mediaBelongsToTerritory(media, oceanHills.id, LUXURY), false);
  });

  it("TEST 12 — same Tenant different Territory stays isolated", () => {
    assert.equal(panoramica.tenantId, oceanHills.tenantId);
    assert.equal(
      recordMatchesTerritoryScope(panoramica.id, oceanHills.id),
      false,
    );
    assert.equal(
      recordMatchesTerritoryScope(panoramica.id, panoramica.id),
      true,
    );
    assert.equal(recordMatchesTerritoryScope(undefined, panoramica.id), true);
  });
});
