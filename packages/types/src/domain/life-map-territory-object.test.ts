import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterRenderableTerritoryObjects,
  projectTerritoryObjectToLifeMapObject,
  territoryObjectHasPosition,
  validateTerritoryObject,
  type TerritoryObject,
} from "./life-map-territory-object";

const GATE: TerritoryObject = {
  id: "terr-gate-1",
  tenantId: "life-panoramica",
  type: "gate",
  location: { lat: 37.412, lng: -4.751 },
  visibility: { lod: "territory", interactive: true },
  label: "Acceso principal",
};

describe("TerritoryObject", () => {
  it("TEST 1 — object with coordinates is valid", () => {
    assert.equal(territoryObjectHasPosition(GATE), true);
    assert.equal(validateTerritoryObject(GATE).length, 0);
  });

  it("TEST 2 — object without position does not appear", () => {
    const floating: TerritoryObject = {
      id: "terr-float",
      tenantId: "life-panoramica",
      type: "clubhouse",
      visibility: { lod: "landmark" },
    };
    assert.equal(territoryObjectHasPosition(floating), false);
    assert.ok(
      validateTerritoryObject(floating).some((issue) => issue.code === "missing_position"),
    );
    assert.equal(projectTerritoryObjectToLifeMapObject(floating, "terr-1"), null);
    assert.equal(
      filterRenderableTerritoryObjects([GATE, floating], "life-panoramica").length,
      1,
    );
  });

  it("TEST 6 — Valley cannot see Panoramica territory", () => {
    const visible = filterRenderableTerritoryObjects([GATE], "life-valley");
    assert.equal(visible.length, 0);
    assert.ok(
      validateTerritoryObject(GATE, "life-valley").some(
        (issue) => issue.code === "tenant_mismatch",
      ),
    );
  });
});
