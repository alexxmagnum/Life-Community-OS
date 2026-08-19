import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canDeleteLocation,
  canMutateLocation,
  locationOwnedBy,
} from "./location-ownership";
import type { Location } from "@life-community-os/types";

const catalogPlace: Pick<Location, "ownerId" | "createdBy"> = {};
const ownedPlace: Pick<Location, "ownerId" | "createdBy"> = {
  ownerId: "person-a",
  createdBy: "person-a",
};
const otherPlace: Pick<Location, "ownerId" | "createdBy"> = {
  ownerId: "person-b",
  createdBy: "person-b",
};

describe("TEST 6 — location ownership", () => {
  it("treats catalog locations as unowned", () => {
    assert.equal(locationOwnedBy(catalogPlace, "person-a"), false);
  });

  it("allows the owner to mutate their location", () => {
    assert.equal(
      canMutateLocation(
        { personId: "person-a", role: "member", hasMembership: true },
        ownedPlace,
      ),
      true,
    );
  });

  it("denies a member mutating someone else's location", () => {
    assert.equal(
      canMutateLocation(
        { personId: "person-a", role: "member", hasMembership: true },
        otherPlace,
      ),
      false,
    );
  });

  it("TEST 5 — member cannot mutate protected catalog content", () => {
    assert.equal(
      canMutateLocation(
        { personId: "person-a", role: "member", hasMembership: true },
        catalogPlace,
      ),
      false,
    );
  });

  it("TEST 4 — administrator can manage tenant locations", () => {
    assert.equal(
      canMutateLocation(
        {
          personId: "person-admin",
          role: "administrator",
          hasMembership: true,
        },
        catalogPlace,
      ),
      true,
    );
    assert.equal(
      canDeleteLocation(
        {
          personId: "person-admin",
          role: "administrator",
          hasMembership: true,
        },
        otherPlace,
      ),
      true,
    );
  });

  it("denies users without membership", () => {
    assert.equal(
      canMutateLocation(
        { personId: "person-a", role: null, hasMembership: false },
        ownedPlace,
      ),
      false,
    );
  });
});
