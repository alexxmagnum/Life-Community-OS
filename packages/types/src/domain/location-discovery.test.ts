import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterLocationsByLocalKinds,
  localEntityKindFromLocation,
  locationToLocalEntity,
} from "./location-discovery";
import { createLocation } from "./location";

describe("location-discovery", () => {
  const loc = createLocation({
    id: "loc-1",
    tenantId: "life-panoramica",
    type: "business",
    name: "IKON",
    address: "Panoramica",
    latitude: 40.4,
    longitude: -3.7,
    category: "restaurant",
    summary: "Terraza y deporte",
    imageUrl: "https://example.com/ikon.jpg",
    areaLabel: "Aldea Golf",
  });

  it("maps restaurant category to local kind", () => {
    assert.equal(localEntityKindFromLocation(loc), "restaurant");
  });

  it("projects Location to LocalEntity view", () => {
    const entity = locationToLocalEntity(loc);
    assert.equal(entity.id, "loc-1");
    assert.equal(entity.kind, "restaurant");
    assert.equal(entity.story, "Terraza y deporte");
  });

  it("filters by kind and query", () => {
    assert.equal(
      filterLocationsByLocalKinds([loc], ["restaurant"], "ikon").length,
      1,
    );
    assert.equal(filterLocationsByLocalKinds([loc], ["service"]).length, 0);
  });
});
