import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getOsmLayerCapability,
  isOsmSupportedLayerKind,
  OSM_LAYER_CAPABILITIES,
  OSM_SUPPORTED_LAYER_KINDS,
} from "./capabilities";

describe("OSM capabilities", () => {
  it("declares roads, buildings, water only", () => {
    assert.deepEqual([...OSM_SUPPORTED_LAYER_KINDS], [
      "roads",
      "buildings",
      "water",
    ]);
    assert.equal(OSM_LAYER_CAPABILITIES.length, 3);
  });

  it("supportsLayer kinds match capability table", () => {
    for (const kind of OSM_SUPPORTED_LAYER_KINDS) {
      assert.equal(isOsmSupportedLayerKind(kind), true);
      assert.ok(getOsmLayerCapability(kind));
    }
    assert.equal(isOsmSupportedLayerKind("green"), false);
    assert.equal(isOsmSupportedLayerKind("boundary"), false);
    assert.equal(getOsmLayerCapability("terrain"), undefined);
  });

  it("exposes OSM tag hints without executing queries", () => {
    const roads = getOsmLayerCapability("roads");
    assert.ok(roads?.tagHints.includes("highway=*"));
    const buildings = getOsmLayerCapability("buildings");
    assert.ok(buildings?.tagHints.includes("building=*"));
    const water = getOsmLayerCapability("water");
    assert.ok(water?.tagHints.some((t) => t.includes("water")));
  });
});
