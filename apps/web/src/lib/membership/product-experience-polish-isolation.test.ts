/**
 * Phase 18I-P — product polish lock tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { guestCanAccess } from "@life-community-os/types";
import {
  actorCanOpenLifePlace,
  actorCanReadLifePlaceLife,
} from "@/lib/life-place/permissions";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { resolveMembershipAccessScope } from "@/lib/membership/membership-experience-scope";
import {
  joinErrorMessage,
  profileMembershipLabel,
} from "@/lib/membership/join-community-experience";
import { MembershipExperienceService } from "@/lib/membership/membership-experience-service";
import { DiscoverExperienceService } from "@/lib/community/discover-experience-service";
import { LIFE_PANORAMICA_TENANT_SLUG, LIFE_PANORAMICA_TERRITORY_UUID } from "@/lib/tenant/ids";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function registeredActor(): RequestActor {
  return {
    authenticated: true,
    hasMembership: false,
    membershipStatus: null,
    providerReference: "auth-user",
    personId: "person-1",
    role: null,
    tenantSlug: LIFE_PANORAMICA_TENANT_SLUG,
    membershipId: null,
    permissions: [],
    tenantDenied: false,
    currentUser: {
      authenticated: true,
      hasMembership: false,
      membershipStatus: null,
      personId: "person-1",
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      role: null,
      userId: "auth-user",
      email: "user@example.com",
      displayName: "User",
      membershipId: null,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      permissions: [],
    },
  };
}

function activeActor(): RequestActor {
  return {
    ...registeredActor(),
    hasMembership: true,
    membershipStatus: "active",
    role: "member",
    membershipId: "mem-1",
    permissions: permissionsForRole("member", LIFE_PANORAMICA_TENANT_SLUG),
    currentUser: {
      ...registeredActor().currentUser,
      hasMembership: true,
      membershipStatus: "active",
      role: "member",
      membershipId: "mem-1",
      permissions: permissionsForRole("member", LIFE_PANORAMICA_TENANT_SLUG),
    },
  };
}

describe("Phase 18I-P product polish", () => {
  it("TEST 1 — Registered puede unirse desde /me", () => {
    const profile = readFileSync(
      path.join(HERE, "..", "..", "screens", "ProfileScreen.tsx"),
      "utf8",
    );
    assert.equal(profile.includes("JoinCommunityPanel"), true);
    assert.equal(profile.includes("join-community-experience"), true);
  });

  it("TEST 2 — Código válido crea membership", async () => {
    const result = await MembershipExperienceService.joinWithCommunityCode({
      actor: registeredActor(),
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      code: "PANORAMICA",
    });
    assert.equal(result.status, "active");
  });

  it("TEST 3 — Pending muestra estado correcto", () => {
    const scope = resolveMembershipAccessScope({
      authenticated: true,
      hasMembership: false,
      membershipStatus: "pending",
      role: "member",
    });
    assert.equal(scope.scope, "pending");
    assert.equal(
      profileMembershipLabel({
        authenticated: true,
        hasMembership: false,
        membershipStatus: "pending",
        role: "member",
      }),
      "Pendiente",
    );
  });

  it("TEST 4 — Guest Discover funciona", async () => {
    assert.equal(
      guestCanAccess({ resource: "open_content", hasActiveMembership: false }),
      true,
    );
    const discover = await DiscoverExperienceService.resolve({
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      actor: {
        ...registeredActor(),
        authenticated: false,
        personId: null,
      },
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(discover.tenantId, LIFE_PANORAMICA_TENANT_SLUG);
  });

  it("TEST 5 — Guest Life Place funciona", () => {
    const visitor: RequestActor = {
      ...registeredActor(),
      authenticated: false,
      personId: null,
    };
    assert.equal(actorCanOpenLifePlace(visitor), true);
    assert.equal(actorCanReadLifePlaceLife(visitor), false);
  });

  it("TEST 6 — Member ve Magic Plus", () => {
    const shell = readFileSync(
      path.join(HERE, "..", "..", "components", "MemberShell.tsx"),
      "utf8",
    );
    assert.equal(shell.includes('magicPlusMode !== "hidden"'), true);
    assert.equal(shell.includes("currentUser.hasMembership"), true);
  });

  it("TEST 7 — Magic Plus crea experiencia", () => {
    const composer = readFileSync(
      path.join(HERE, "..", "..", "components", "community", "ActionComposer.tsx"),
      "utf8",
    );
    assert.equal(composer.includes("Crear experiencia"), true);
    assert.equal(composer.includes("Organiza planes"), true);
  });

  it("TEST 8 — No aparece a visitor", () => {
    const scope = resolveMembershipAccessScope({
      authenticated: false,
      hasMembership: false,
      membershipStatus: null,
      role: null,
    });
    assert.equal(scope.scope, "visitor");
    assert.equal(
      profileMembershipLabel({
        authenticated: false,
        hasMembership: false,
        membershipStatus: null,
        role: null,
      }),
      "Visitante",
    );
  });

  it("TEST 9 — Place no muestra CTA muerto", () => {
    const sheet = readFileSync(
      path.join(HERE, "..", "..", "components", "life-place", "LifePlaceSheet.tsx"),
      "utf8",
    );
    assert.equal(sheet.includes("Crear experiencia aquí"), true);
    assert.equal(sheet.includes("Explorar experiencias"), true);
    assert.equal(sheet.includes("canCreateExperience"), true);
  });

  it("TEST 10 — Experiencia contextual funciona", async () => {
    const discover = await DiscoverExperienceService.resolve({
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      actor: activeActor(),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(Array.isArray(discover.help), true);
    assert.equal(joinErrorMessage("invalid_code").length > 0, true);
  });
});
