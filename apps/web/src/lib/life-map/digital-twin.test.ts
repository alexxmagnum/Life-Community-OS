import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LifeMapObject, Location, TerritoryObject } from "@life-community-os/types";
import {
  filterLifeMapObjectsWithPosition,
  resolveLifeMapTapHref,
  territoryObjectsForTenant,
} from "./digital-twin";
import {
  isArchitecturalTerritoryAsset,
  shouldLazyLoadTerritoryGlb,
} from "./territory-asset-pipeline";

const PANORAMICA = "life-panoramica";
const VALLEY = "life-valley";

const gate: TerritoryObject = {
  id: "lmo-terr-mainAccess",
  tenantId: PANORAMICA,
  type: "gate",
  location: { lat: 37.41, lng: -4.75 },
  visibility: { lod: "territory", interactive: true },
  label: "Acceso principal",
};

const floating: TerritoryObject = {
  id: "lmo-terr-ghost",
  tenantId: PANORAMICA,
  type: "clubhouse",
  visibility: { lod: "landmark" },
};

const locationObject: LifeMapObject = {
  tenantId: PANORAMICA,
  territoryId: "terr-panoramica-golf",
  objectId: "loc-catalog-ikon",
  type: "place",
  layerId: "places",
  state: "active",
  position: { lat: 37.4123, lng: -4.7511 },
  availableActions: ["open", "navigate"],
  label: "IKON",
  ref: {
    moduleId: "community",
    entityId: "loc-catalog-ikon",
    entityKind: "location",
  },
};

const location: Location = {
  id: "loc-catalog-ikon",
  tenantId: PANORAMICA,
  type: "business",
  name: "IKON",
  address: "Panorámica Golf",
  latitude: 37.4123,
  longitude: -4.7511,
  category: "restaurant",
  visibility: "public",
  createdAt: "2026-08-21T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
};

const resourceObject: LifeMapObject = {
  ...locationObject,
  objectId: "res-padel-aldea",
  type: "resource",
  layerId: "resources",
  label: "Pádel",
  ref: {
    moduleId: "resources",
    entityId: "res-padel-aldea",
    entityKind: "resource",
  },
};

describe("Life Map digital twin", () => {
  it("TEST 1 — territory object with coordinates appears", () => {
    const visible = territoryObjectsForTenant(
      [gate],
      PANORAMICA,
      "terr-panoramica-golf",
    );
    assert.equal(visible.length, 1);
    assert.equal(visible[0]?.objectId, gate.id);
    const pos = visible[0]?.position as { lat: number; lng: number };
    assert.equal(pos.lat, gate.location?.lat);
    assert.equal(pos.lng, gate.location?.lng);
  });

  it("TEST 2 — object without position does not appear", () => {
    const visible = territoryObjectsForTenant(
      [gate, floating],
      PANORAMICA,
      "terr-panoramica-golf",
    );
    assert.equal(visible.length, 1);
    assert.equal(
      filterLifeMapObjectsWithPosition([
        locationObject,
        { ...locationObject, objectId: "ghost", position: { kind: "local", spaceId: "x", x: 1, y: 1 } },
      ]).length,
      1,
    );
  });

  it("TEST 3 — location appears at the Location SoT coordinates", () => {
    const projected = filterLifeMapObjectsWithPosition([locationObject])[0];
    assert.ok(projected);
    if (!projected) return;
    const pos = projected.position as { lat: number; lng: number };
    assert.equal(pos.lat, location.latitude);
    assert.equal(pos.lng, location.longitude);
  });

  it("TEST 4 — business tap opens the location ficha", () => {
    const tap = resolveLifeMapTapHref({ object: locationObject, location });
    assert.equal(tap.intent, "business");
    assert.equal(tap.href, "/locations/loc-catalog-ikon");
  });

  it("TEST 5 — resource tap opens reservation", () => {
    const tap = resolveLifeMapTapHref({ object: resourceObject });
    assert.equal(tap.intent, "resource");
    assert.equal(tap.href, "/resources/res-padel-aldea/reserve");
  });

  it("TEST 6 — Valley cannot see Panoramica territory", () => {
    const denied = territoryObjectsForTenant(
      [gate],
      VALLEY,
      "terr-life-valley",
    );
    assert.equal(denied.length, 0);
  });

  it("TEST 7 — low zoom does not load 3D assets", () => {
    assert.equal(
      shouldLazyLoadTerritoryGlb({
        zoom: 14.2,
        assetKey: "utility.security.spatial_object",
        modelPath: "/assets/3d/gate.glb",
      }),
      false,
    );
    assert.equal(
      shouldLazyLoadTerritoryGlb({
        zoom: 18.1,
        assetKey: "utility.security.spatial_object",
        modelPath: "/assets/3d/gate.glb",
      }),
      true,
    );
    assert.equal(isArchitecturalTerritoryAsset("character.npc.scene"), false);
  });
});
