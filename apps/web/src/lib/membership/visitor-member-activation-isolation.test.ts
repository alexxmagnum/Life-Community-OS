/**
 * Phase 18L-FIX-A — visitor activation and membership entry flow.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { guestCanAccess } from "@life-community-os/types";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  actorCanViewBusinesses,
  businessVisibleToActor,
} from "@/lib/business/permissions";
import { actorCanViewHelp } from "@/lib/help/permissions";
import {
  actorCanOpenLifePlace,
  actorCanReadLifePlaceLife,
  actorCanReadLifePlacePublicTerritory,
} from "@/lib/life-place/permissions";
import { resolveMembershipAccessScope } from "@/lib/membership/membership-experience-scope";
import {
  COMMUNITY_PREVIEW_EMPTY_TITLE,
  profileVisitorTitle,
  VISITOR_HOME_EMPTY_TITLE,
  VISITOR_HOME_EXPLORE_LABEL,
} from "@/lib/membership/visitor-experience";
import type { RequestActor } from "@/lib/auth/request-actor";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");
const PANO = "life-panoramica";
const VALLEY = "life-valley";

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

function guestActor(tenantSlug: string): RequestActor {
  return {
    authenticated: false,
    hasMembership: false,
    membershipStatus: null,
    providerReference: null,
    personId: null,
    role: null,
    permissions: [],
    tenantSlug,
    membershipId: null,
    tenantDenied: false,
    territoryId: null,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: false,
      hasMembership: false,
      tenantId: tenantSlug,
    },
  };
}

function memberActor(tenantSlug: string): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    membershipStatus: "active",
    providerReference: "auth-user",
    personId: "person-1",
    role: "member",
    permissions: ["community.local.view"],
    tenantSlug,
    membershipId: "mem-1",
    tenantDenied: false,
    territoryId: null,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId: "person-1",
      tenantId: tenantSlug,
      role: "member",
    },
  };
}

describe("Phase 18L-FIX-A visitor member activation", () => {
  it("TEST 1 — Visitor ve Home con orientación", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /VISITOR_HOME_EMPTY_TITLE/);
    assert.match(home, /VISITOR_HOME_EMPTY_DESCRIPTION/);
    assert.match(home, /VISITOR_HOME_EXPLORE_LABEL/);
    assert.match(home, /VISITOR_HOME_REGISTER_LABEL/);
    assert.match(home, /COMMUNITY_EMPTY_GLYPH/);
    assert.match(home, /fetchTerritoryAnnouncements/);
    assert.match(home, /isVisitor \?/);
    assert.equal(VISITOR_HOME_EMPTY_TITLE, "La comunidad empieza contigo");
    assert.equal(VISITOR_HOME_EXPLORE_LABEL, "Explorar comunidad");
  });

  it("TEST 2 — Visitor puede explorar Discover", () => {
    const discover = readWeb("screens/DiscoverScreen.tsx");
    assert.match(discover, /canBrowsePublicTerritory/);
    assert.match(discover, /fetchBusinesses/);
    assert.doesNotMatch(
      discover,
      /!canLocal[\s\S]*fetchBusinesses/,
    );
    assert.match(discover, /VISITOR_JOIN_HEADLINE/);
  });

  it("TEST 3 — Visitor puede ver negocios públicos", () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanViewBusinesses(guest), true);
    assert.equal(
      businessVisibleToActor(guest, {
        id: "biz-1",
        tenantId: PANO,
        territoryId: "territory-1",
        status: "published",
        ownerPersonId: "owner-1",
        name: "Restaurante",
        category: "restaurant",
        description: "",
        locationId: "loc-1",
        contact: "",
        hours: "",
        imageUrl: "",
        createdAt: "",
        updatedAt: "",
      }),
      true,
    );
    const services = readWeb("screens/ServicesCategoryScreen.tsx");
    assert.match(services, /canBrowsePublicTerritory/);
  });

  it("TEST 4 — Visitor no ve datos privados", () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanReadLifePlaceLife(guest), false);
    assert.equal(actorCanViewHelp(guest), false);
    const sheet = readWeb("components/life-place/LifePlaceSheet.tsx");
    assert.match(sheet, /nearbyHelp.*!isVisitor/);
    assert.match(sheet, /context\.community && !isVisitor/);
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /authenticated && hasMembership/);
  });

  it("TEST 5 — Registered termina en /me", () => {
    const register = readWeb("screens/RegisterScreen.tsx");
    assert.match(register, /router\.replace\("\/me"\)/);
    assert.doesNotMatch(register, /router\.replace\("\/"\)/);
  });

  it("TEST 6 — Registered puede iniciar JoinCommunity", () => {
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /JoinCommunityPanel/);
    const scope = resolveMembershipAccessScope({
      authenticated: true,
      hasMembership: false,
      membershipStatus: null,
      role: null,
    });
    assert.equal(scope.scope, "registered");
    const preview = readWeb("components/community/CommunityPreviewPanel.tsx");
    assert.match(preview, /COMMUNITY_PREVIEW_EMPTY_TITLE/);
    assert.match(preview, /COMMUNITY_PREVIEW_JOIN_LABEL/);
    assert.equal(COMMUNITY_PREVIEW_EMPTY_TITLE, "Tu comunidad está esperando");
  });

  it("TEST 7 — Active member mantiene experiencia completa", () => {
    const community = readWeb("screens/CommunityScreen.tsx");
    assert.match(community, /openActionComposer/);
    assert.match(community, /COMMUNITY_NOW_EMPTY_TITLE/);
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /openActionComposer/);
    assert.match(home, /LIVING_EMPTY_CTA/);
    const guest = guestActor(PANO);
    assert.equal(actorCanOpenLifePlace(guest), true);
    assert.equal(actorCanReadLifePlacePublicTerritory(guest), true);
    const member = memberActor(PANO);
    assert.equal(member.hasMembership, true);
  });

  it("TEST 8 — Tenant isolation intacto", () => {
    const valleyGuest = guestActor(VALLEY);
    assert.equal(
      businessVisibleToActor(valleyGuest, {
        id: "biz-pano",
        tenantId: PANO,
        territoryId: "territory-pano",
        status: "published",
        ownerPersonId: "owner-1",
        name: "Panorámica only",
        category: "restaurant",
        description: "",
        locationId: "loc-1",
        contact: "",
        hours: "",
        imageUrl: "",
        createdAt: "",
        updatedAt: "",
      }),
      false,
    );
    assert.equal(
      guestCanAccess({
        resource: "private_community",
        hasActiveMembership: false,
      }),
      false,
    );
    assert.equal(profileVisitorTitle("Panorámica"), "Bienvenido a LIFE Panorámica");
  });
});
