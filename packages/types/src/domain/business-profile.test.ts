import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createBusinessProfile,
  isBusinessProfileStatus,
  validateBusinessProfile,
} from "./business-profile";

describe("BusinessProfile", () => {
  it("creates a draft commercial identity without coordinates", () => {
    const profile = createBusinessProfile({
      tenantId: "life-panoramica",
      ownerPersonId: "person-alex",
      locationId: "loc-1",
      name: "Taller del valle",
      category: "electrician",
    });
    assert.equal(profile.status, "draft");
    assert.equal(profile.ownerPersonId, "person-alex");
    assert.equal(profile.locationId, "loc-1");
    assert.equal("latitude" in profile, false);
    assert.equal(validateBusinessProfile(profile).length, 0);
  });

  it("rejects an unknown publication status", () => {
    assert.equal(isBusinessProfileStatus("live"), false);
  });
});
