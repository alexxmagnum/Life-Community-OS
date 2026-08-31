import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessAdminOperations,
  canAccessAdminSection,
  canAssignMembershipRole,
} from "./admin-operations";

describe("Admin operations policy", () => {
  it("TEST 3 — member cannot enter admin", () => {
    assert.equal(canAccessAdminOperations("member"), false);
    assert.equal(canAccessAdminSection("member", "dashboard"), false);
  });

  it("administrator can open settings; moderator cannot", () => {
    assert.equal(canAccessAdminSection("administrator", "settings"), true);
    assert.equal(canAccessAdminSection("moderator", "settings"), false);
    assert.equal(canAccessAdminSection("moderator", "moderation"), true);
  });

  it("TEST 8 — role change without permission is denied", () => {
    assert.equal(
      canAssignMembershipRole({
        actorRole: "moderator",
        fromRole: "member",
        toRole: "group_manager",
      }),
      false,
    );
    assert.equal(
      canAssignMembershipRole({
        actorRole: "administrator",
        fromRole: "member",
        toRole: "administrator",
      }),
      false,
    );
    assert.equal(
      canAssignMembershipRole({
        actorRole: "administrator",
        fromRole: "member",
        toRole: "moderator",
      }),
      true,
    );
  });

  it("operations section is staff-only", () => {
    assert.equal(canAccessAdminSection("administrator", "operations"), true);
    assert.equal(canAccessAdminSection("moderator", "operations"), true);
    assert.equal(canAccessAdminSection("member", "operations"), false);
    assert.equal(canAccessAdminSection("group_manager", "operations"), false);
  });

  it("group_manager can operate resources, not members", () => {
    assert.equal(canAccessAdminSection("group_manager", "resources"), true);
    assert.equal(canAccessAdminSection("group_manager", "members"), false);
  });
});
