import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bindActiveTenant, membershipSummary } from "./bind-active-tenant";
import {
  authenticatedWithoutMembership,
  currentUserFromMembership,
  EMPTY_CURRENT_USER,
} from "./current-user";
import { isDemoIdentityEnabled, resolveJoinRole } from "./demo-identity";

const panoramica = membershipSummary({
  tenantId: "life-panoramica",
  membershipId: "mem-p",
  personId: "person-alex",
  role: "member",
});

const valley = membershipSummary({
  tenantId: "life-valley",
  membershipId: "mem-v",
  personId: "person-alex",
  role: "moderator",
});

describe("CASE 1 — registered user session", () => {
  it("binds the membership tenant and fills CurrentUserContext", () => {
    const bind = bindActiveTenant({
      requestedTenantId: "life-panoramica",
      memberships: [panoramica],
    });
    assert.equal(bind.status, "bound");
    if (bind.status !== "bound") return;
    const user = currentUserFromMembership({
      user: { userId: "auth-alex", email: "alex@example.com" },
      person: { personId: "person-alex", displayName: "Alex" },
      membership: bind.membership,
      permissions: ["community.content.view"],
    });
    assert.equal(user.authenticated, true);
    assert.equal(user.hasMembership, true);
    assert.equal(user.userId, "auth-alex");
    assert.equal(user.personId, "person-alex");
    assert.equal(user.tenantId, "life-panoramica");
    assert.equal(user.role, "member");
    assert.ok(user.permissions.includes("community.content.view"));
  });
});

describe("CASE 2 — user without membership", () => {
  it("does not enter a community", () => {
    const bind = bindActiveTenant({
      requestedTenantId: "life-panoramica",
      memberships: [],
    });
    assert.equal(bind.status, "no_membership");
    const user = authenticatedWithoutMembership({
      user: { userId: "auth-alex", email: "alex@example.com" },
    });
    assert.equal(user.authenticated, true);
    assert.equal(user.hasMembership, false);
    assert.equal(user.tenantId, null);
    assert.equal(user.role, null);
    assert.equal(EMPTY_CURRENT_USER.authenticated, false);
  });
});

describe("CASE 3 — Panoramica member", () => {
  it("sees only Panoramica when that is the membership", () => {
    const bind = bindActiveTenant({
      requestedTenantId: "life-panoramica",
      memberships: [panoramica],
    });
    assert.equal(bind.status, "bound");
    if (bind.status !== "bound") return;
    assert.equal(bind.membership.tenantId, "life-panoramica");
  });
});

describe("CASE 4 — Valley member", () => {
  it("sees only Valley when that is the membership", () => {
    const bind = bindActiveTenant({
      requestedTenantId: "life-valley",
      memberships: [valley],
    });
    assert.equal(bind.status, "bound");
    if (bind.status !== "bound") return;
    assert.equal(bind.membership.tenantId, "life-valley");
    assert.equal(bind.membership.role, "moderator");
  });
});

describe("CASE 5 — manual tenant switch", () => {
  it("denies a tenant the user does not belong to", () => {
    const bind = bindActiveTenant({
      requestedTenantId: "life-valley",
      memberships: [panoramica],
    });
    assert.equal(bind.status, "tenant_forbidden");
    if (bind.status !== "tenant_forbidden") return;
    assert.equal(bind.requestedTenantId, "life-valley");
  });
});

describe("demo identity production lock", () => {
  it("is off in production even if the public flag is set", () => {
    assert.equal(
      isDemoIdentityEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_LCOS_DEMO_ROLES: "1",
      }),
      false,
    );
  });

  it("is on in development only when the flag is set", () => {
    assert.equal(
      isDemoIdentityEnabled({
        NODE_ENV: "development",
        NEXT_PUBLIC_LCOS_DEMO_ROLES: "1",
      }),
      true,
    );
    assert.equal(
      isDemoIdentityEnabled({ NODE_ENV: "development" }),
      false,
    );
  });
});

describe("join role", () => {
  it("never escalates an existing membership from a client role", () => {
    assert.equal(
      resolveJoinRole({ existingRole: "member", directoryEmpty: false }),
      "member",
    );
  });

  it("promotes only the first member of an empty directory", () => {
    assert.equal(
      resolveJoinRole({ existingRole: null, directoryEmpty: true }),
      "administrator",
    );
    assert.equal(
      resolveJoinRole({ existingRole: null, directoryEmpty: false }),
      "member",
    );
  });
});
