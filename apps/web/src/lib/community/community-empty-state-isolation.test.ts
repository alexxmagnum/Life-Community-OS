/**
 * Phase 18K-FIX-B — activation empty states, not dead screens.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { DEAD_EMPTY_COPY_PATTERNS } from "@life-community-os/types";
import { resolveMembershipAccessScope } from "@/lib/membership/membership-experience-scope";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

function activationSurfaceCopy(): string {
  return [
    readWeb("screens/CommunityScreen.tsx"),
    readWeb("screens/HomeScreen.tsx"),
    readWeb("screens/ProfileScreen.tsx"),
    readWeb("screens/ServicesCategoryScreen.tsx"),
    readWeb("screens/MyReservationsScreen.tsx"),
    readWeb("components/life-place/LifePlaceSheet.tsx"),
  ].join("\n");
}

describe("Phase 18K-FIX-B community activation empty states", () => {
  it("TEST 1 — Visitor ve activación, no vacío muerto", () => {
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /profileVisitorTitle/);
    assert.match(profile, /PROFILE_VISITOR_DESCRIPTION/);
    assert.match(profile, /Crear cuenta/);
    assert.match(profile, /Iniciar sesión/);
    assert.match(profile, /isActiveMember \?/);
    const services = readWeb("screens/ServicesCategoryScreen.tsx");
    assert.match(services, /SERVICES_PROFESSIONALS_VISITOR/);
    const scope = resolveMembershipAccessScope({
      authenticated: false,
      hasMembership: false,
      membershipStatus: null,
      role: null,
    });
    assert.equal(scope.scope, "visitor");
    for (const pattern of DEAD_EMPTY_COPY_PATTERNS) {
      assert.doesNotMatch(activationSurfaceCopy(), pattern);
    }
  });

  it("TEST 2 — Registered ve JoinCommunity", () => {
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /JoinCommunityPanel/);
    assert.match(profile, /PROFILE_REGISTERED_TITLE/);
    assert.match(profile, /isActiveMember \?/);
    const scope = resolveMembershipAccessScope({
      authenticated: true,
      hasMembership: false,
      membershipStatus: null,
      role: null,
    });
    assert.equal(scope.scope, "registered");
  });

  it("TEST 3 — Active member ve acciones de creación", () => {
    const community = readWeb("screens/CommunityScreen.tsx");
    assert.match(community, /COMMUNITY_NOW_EMPTY_TITLE/);
    assert.match(community, /COMMUNITY_GROUPS_EMPTY_CTA/);
    assert.match(community, /COMMUNITY_HELP_EMPTY_CTA/);
    assert.match(community, /COMMUNITY_OFFICIAL_ANNOUNCEMENTS_CTA/);
    assert.match(community, /openActionComposerWithIntent/);
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /openActionComposerWithIntent/);
    assert.match(home, /LIVING_EMPTY_CTA/);
    const scope = resolveMembershipAccessScope({
      authenticated: true,
      hasMembership: true,
      membershipStatus: "active",
      role: "member",
    });
    assert.equal(scope.scope, "active");
  });

  it('TEST 4 — Life Place vacío no contiene "primera historia"', () => {
    const sheet = readWeb("components/life-place/LifePlaceSheet.tsx");
    const host = readWeb("components/life-place/LifePlaceHost.tsx");
    assert.match(sheet, /LIVING_PLACE_EMPTY_TITLE/);
    assert.match(sheet, /LIVING_PLACE_EMPTY_DESCRIPTION/);
    assert.match(sheet, /LIVING_PLACE_EMPTY_CTA/);
    assert.match(sheet, /LIVING_PLACE_CREATE_CTA/);
    assert.doesNotMatch(sheet, /primera historia/i);
    assert.doesNotMatch(sheet, /openActionComposer/);
    assert.match(host, /openActionComposerWithIntent/);
  });

  it("TEST 5 — Empty states no crean posts sociales", () => {
    const surfaces = activationSurfaceCopy();
    assert.doesNotMatch(surfaces, /Crear post/i);
    assert.doesNotMatch(surfaces, /Crear publicación/i);
    assert.doesNotMatch(surfaces, /CreatePost/i);
    assert.doesNotMatch(surfaces, /SocialFeed/i);
    assert.doesNotMatch(surfaces, /CommunityWall/i);
  });

  it("TEST 6 — Magic Plus sigue siendo único creador", () => {
    const shell = readWeb("components/MemberShell.tsx");
    assert.match(shell, /ActionComposer/);
    assert.match(shell, /¿Qué quieres crear\?/);
    const community = readWeb("screens/CommunityScreen.tsx");
    assert.match(community, /openActionComposerWithIntent/);
    assert.doesNotMatch(community, /\/community\/posts\/create/);
    const lifePlaceHost = readWeb("components/life-place/LifePlaceHost.tsx");
    assert.match(lifePlaceHost, /create_activity/);
    assert.match(lifePlaceHost, /openActionComposerWithIntent/);
  });
});
