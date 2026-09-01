/**
 * Phase 18H-R — membership, home, discover and asset recovery tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  emptyMembershipOnboardingPlane,
  resolveLifeHomeMembershipScope,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { commitOnboardingMembership } from "@/lib/auth/ensure-domain-membership";
import { replaceMembershipOnboardingStoreForTests } from "@/lib/membership/membership-onboarding-service";
import { MembershipExperienceService } from "@/lib/membership/membership-experience-service";
import { LifeHomeService } from "@/lib/community/life-home-service";
import { DiscoverExperienceService } from "@/lib/community/discover-experience-service";
import { resolveLifeMapAsset3DKey } from "@life-community-os/assets";
import {
  LIFE_PANORAMICA_TENANT_SLUG,
  LIFE_VALLEY_TENANT_SLUG,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function actor(input: {
  tenantSlug: string;
  personId?: string;
  hasMembership?: boolean;
  membershipStatus?: RequestActor["membershipStatus"];
}): RequestActor {
  const hasMembership = input.hasMembership ?? true;
  const membershipStatus =
    input.membershipStatus ?? (hasMembership ? "active" : null);
  return {
    authenticated: true,
    hasMembership,
    membershipStatus,
    providerReference: "auth-user",
    personId: input.personId ?? "person-alex",
    role: "member",
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : null,
    permissions: permissionsForRole("member", input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership,
      membershipStatus,
      personId: input.personId ?? "person-alex",
      tenantId: input.tenantSlug,
      role: hasMembership ? "member" : null,
    },
  };
}

describe("Phase 18H-R experience recovery", () => {
  beforeEach(() => {
    replaceMembershipOnboardingStoreForTests(emptyMembershipOnboardingPlane());
  });

  it("TEST 1 — Código comunidad crea membership correcta", async () => {
    const result = await MembershipExperienceService.joinWithCommunityCode({
      actor: actor({
        tenantSlug: LIFE_PANORAMICA_TENANT_SLUG,
        hasMembership: false,
        membershipStatus: null,
      }),
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      territoryId: "10000000-0000-4000-8000-000000000002",
      code: "PANORAMICA",
    });
    assert.equal(result.status, "active");
    assert.equal(result.tenantSlug, LIFE_PANORAMICA_TENANT_SLUG);
  });

  it("TEST 2 — Invitación activa membership", async () => {
    const committed = await commitOnboardingMembership({
      tenantSlug: LIFE_PANORAMICA_TENANT_SLUG,
      providerReference: "auth-invite",
      email: "invite@example.com",
      territoryId: "10000000-0000-4000-8000-000000000002",
      status: "active",
    });
    assert.equal(committed.status, "active");
  });

  it("TEST 3 — Pending muestra estado correcto", () => {
    const scope = MembershipExperienceService.resolveAccessFromSession({
      authenticated: true,
      hasMembership: false,
      membershipStatus: "pending",
      role: "member",
    });
    assert.equal(scope.scope, "pending");
    assert.equal(
      resolveLifeHomeMembershipScope({
        hasMembership: false,
        membershipStatus: "pending",
      }),
      "pending",
    );
  });

  it("TEST 4 — Active member accede comunidad", () => {
    const scope = MembershipExperienceService.resolveAccessFromSession({
      authenticated: true,
      hasMembership: true,
      membershipStatus: "active",
      role: "member",
    });
    assert.equal(scope.canAccessCommunity, true);
  });

  it("TEST 5 — Home consume LifeHomeService", async () => {
    const home = await LifeHomeService.resolve({
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      actor: actor({ tenantSlug: LIFE_PANORAMICA_TENANT_SLUG }),
      territoryId: "10000000-0000-4000-8000-000000000002",
      territoryName: "Panoramica",
    });
    assert.equal(home.territory.tenantId, LIFE_PANORAMICA_TENANT_SLUG);
    assert.equal(home.membershipScope, "active");
  });

  it("TEST 6 — Tenant Panorámica muestra contenido", async () => {
    const home = await LifeHomeService.resolve({
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      actor: actor({ tenantSlug: LIFE_PANORAMICA_TENANT_SLUG }),
      territoryId: "10000000-0000-4000-8000-000000000002",
      territoryName: "Panoramica",
    });
    assert.equal(home.actions.some((row) => row.href === "/discover"), true);
  });

  it("TEST 7 — Discover consume servicio nuevo", async () => {
    const discover = await DiscoverExperienceService.resolve({
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      actor: actor({ tenantSlug: LIFE_PANORAMICA_TENANT_SLUG }),
      territoryId: "10000000-0000-4000-8000-000000000002",
    });
    assert.equal(discover.tenantId, LIFE_PANORAMICA_TENANT_SLUG);
  });

  it("TEST 8 — Help visible", async () => {
    const discover = await DiscoverExperienceService.resolve({
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      actor: actor({ tenantSlug: LIFE_PANORAMICA_TENANT_SLUG }),
      territoryId: "10000000-0000-4000-8000-000000000002",
    });
    assert.equal(Array.isArray(discover.help), true);
  });

  it("TEST 9 — 3D assets resueltos desde registry", () => {
    const meta = resolveLifeMapAsset3DKey("place.clubhouse.spatial_object");
    assert.equal(meta.path.includes(".glb"), true);
  });

  it("TEST 10 — Legacy cards eliminados", () => {
    const homeSource = readFileSync(
      path.join(HERE, "..", "..", "screens", "HomeScreen.tsx"),
      "utf8",
    );
    assert.equal(homeSource.includes("fetchCommunityHome"), true);
    assert.equal(homeSource.includes("buildHomeFeed"), false);
  });

  it("TEST 11 — Panorámica aislada", async () => {
    const pano = await LifeHomeService.resolve({
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      actor: actor({ tenantSlug: LIFE_PANORAMICA_TENANT_SLUG }),
      territoryId: "10000000-0000-4000-8000-000000000002",
      territoryName: "Panoramica",
    });
    const valley = await LifeHomeService.resolve({
      tenantId: LIFE_VALLEY_TENANT_SLUG,
      actor: actor({ tenantSlug: LIFE_VALLEY_TENANT_SLUG }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
      territoryName: "Valley",
    });
    assert.notEqual(pano.territory.tenantId, valley.territory.tenantId);
  });

  it("TEST 12 — Valley separado", async () => {
    const pano = await DiscoverExperienceService.resolve({
      tenantId: LIFE_PANORAMICA_TENANT_SLUG,
      actor: actor({ tenantSlug: LIFE_PANORAMICA_TENANT_SLUG }),
      territoryId: "10000000-0000-4000-8000-000000000002",
    });
    const valley = await DiscoverExperienceService.resolve({
      tenantId: LIFE_VALLEY_TENANT_SLUG,
      actor: actor({ tenantSlug: LIFE_VALLEY_TENANT_SLUG }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.notEqual(pano.tenantId, valley.tenantId);
  });
});
