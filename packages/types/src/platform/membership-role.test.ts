import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  coerceMembershipRole,
  isMembershipRole,
  MEMBERSHIP_ROLES,
} from "./membership-role";

describe("coerceMembershipRole", () => {
  it("passes through known roles", () => {
    for (const role of MEMBERSHIP_ROLES) {
      assert.equal(coerceMembershipRole(role), role);
    }
  });

  it("defaults null, undefined, and empty to member", () => {
    assert.equal(coerceMembershipRole(null), "member");
    assert.equal(coerceMembershipRole(undefined), "member");
    assert.equal(coerceMembershipRole(""), "member");
  });

  it("defaults unknown strings to member", () => {
    assert.equal(coerceMembershipRole("admin"), "member");
    assert.equal(coerceMembershipRole("owner"), "member");
    assert.equal(coerceMembershipRole("MEMBER"), "member");
  });

  it("isMembershipRole matches the same vocabulary", () => {
    assert.equal(isMembershipRole("administrator"), true);
    assert.equal(isMembershipRole("moderator"), true);
    assert.equal(isMembershipRole("group_manager"), true);
    assert.equal(isMembershipRole("member"), true);
    assert.equal(isMembershipRole("admin"), false);
  });
});
