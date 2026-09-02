/**
 * Phase 18K-FIX-A — visitor activation and public territory discovery.
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

describe("Phase 18K-FIX-A visitor activation", () => {
  it("PASS — Visitor puede abrir Discover público", () => {
    const discover = readWeb("screens/DiscoverScreen.tsx");
    assert.doesNotMatch(
      discover,
      /!authenticated[\s\S]*!hasMembership[\s\S]*fetchBusinesses/,
    );
    assert.match(discover, /fetchBusinesses/);
    assert.match(discover, /VISITOR_JOIN_HEADLINE/);
  });

  it("PASS — Visitor puede ver negocios públicos", () => {
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
  });

  it("PASS — Visitor puede abrir Life Place público", () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanOpenLifePlace(guest), true);
    assert.equal(actorCanReadLifePlacePublicTerritory(guest), true);
    const host = readWeb("components/life-place/LifePlaceHost.tsx");
    assert.match(host, /LIFE_PLACE_MEMBER_ACTION_KINDS/);
  });

  it("PASS — Visitor no accede a datos privados", () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanReadLifePlaceLife(guest), false);
    assert.equal(actorCanViewHelp(guest), false);
    const sheet = readWeb("components/life-place/LifePlaceSheet.tsx");
    assert.match(sheet, /nearbyHelp.*!isVisitor/);
    assert.match(sheet, /context\.community && !isVisitor/);
  });

  it("PASS — Visitor recibe CTA correcto para registrarse", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /VISITOR_JOIN_HEADLINE/);
    assert.match(home, /visitorConversionLabel/);
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /PROFILE_VISITOR_TITLE/);
    assert.match(profile, /Crear cuenta/);
    const services = readWeb("screens/ServicesCategoryScreen.tsx");
    assert.match(services, /visitorConversionHref/);
    assert.match(services, /visitorConversionLabel/);
    assert.match(
      services,
      /!canAccessMemberData[\s\S]*visitorConversionHref/,
    );
  });

  it("PASS — Services público no devuelve 401", () => {
    const services = readWeb("screens/ServicesCategoryScreen.tsx");
    assert.match(services, /const canWork =[\s\S]*canAccessMemberData/);
    assert.match(services, /const canMarket =[\s\S]*canAccessMemberData/);
    assert.match(services, /hub\.content\.kind === "work" && canWork/);
    assert.match(services, /hub\.content\.kind === "neighbour-help" && canMarket/);
    assert.match(services, /hub\.content\.kind === "local-entities"/);
    assert.match(services, /canLocal[\s\S]*filterLocationsByLocalKinds/);
    assert.match(
      services,
      /if \(!canAccessMemberData\)[\s\S]*Accede para ver trabajos/,
    );
    const commerce = readWeb("lib/marketplace/commerce-client.ts");
    assert.match(commerce, /if \(!res\.ok\) return \[\]/);
  });

  it("PASS — Servicios privados siguen protegidos", () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanViewHelp(guest), false);
    assert.equal(
      guestCanAccess({
        resource: "private_community",
        hasActiveMembership: false,
      }),
      false,
    );
  });

  it("PASS — Visitor no cruza tenants", () => {
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
    const panoMember = memberActor(PANO);
    assert.equal(actorCanViewBusinesses(panoMember), true);
  });
});
