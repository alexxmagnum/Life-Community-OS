/**
 * Phase 18L-FIX-B — Help vs Services domain boundary isolation.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  COMMUNITY_CREATION_ACTIONS,
  helpHrefForCategory,
  helpRequestHref,
  workPostHref,
} from "@life-community-os/types";
import {
  actorCanViewBusinesses,
  businessVisibleToActor,
} from "@/lib/business/permissions";
import {
  actorCanCreateHelp,
  actorCanViewHelp,
} from "@/lib/help/permissions";
import { buildMagicPlusSections } from "@/lib/community/magic-plus-sections";
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
    permissions: ["community.local.view", "community.marketplace.view"],
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

describe("Phase 18L-FIX-B help services boundary", () => {
  it("TEST 1 — Ayuda no usa Services routing", () => {
    const helpComposer = readWeb("screens/HelpComposerScreen.tsx");
    assert.match(helpComposer, /router\.replace\(`\/help\/\$\{created\.request\.id\}`\)/);
    assert.match(helpComposer, /router\.push\("\/community"\)/);
    assert.doesNotMatch(helpComposer, /\/services\/neighbour-help/);

    const helpDetail = readWeb("screens/HelpDetailScreen.tsx");
    assert.match(helpDetail, /HelpDetailScreen/);
    assert.match(helpDetail, /router\.push\("\/community"\)/);

    const categoryPage = readWeb("app/(member)/services/[category]/page.tsx");
    assert.match(categoryPage, /neighbour-help[\s\S]*redirect\("\/community"\)/);

    assert.equal(helpRequestHref("help-1"), "/help/help-1");
    assert.equal(helpHrefForCategory("h-1", "neighbour"), "/help/h-1");
    assert.equal(helpHrefForCategory("w-1", "work"), "/services/work/w-1");

    const helpAction = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "help_request",
    );
    assert.ok(helpAction);
    assert.equal(helpAction.route, "/help/create");
  });

  it("TEST 2 — Services no muestra Help items", () => {
    const hub = readWeb("screens/ServicesHubScreen.tsx");
    assert.match(hub, /neighbour-help"\) continue/);
    assert.doesNotMatch(hub, /Una mano entre vecinos/);

    const discoverService = readWeb("lib/community/discover-experience-service.ts");
    assert.match(discoverService, /help: \[\]/);
    assert.doesNotMatch(discoverService, /listHelpRequestsServer/);

    const community = readWeb("screens/CommunityScreen.tsx");
    assert.match(community, /COMMUNITY_HELP_EMPTY_TITLE/);
    assert.match(community, /Vecinos ayudando vecinos/);
  });

  it("TEST 3 — Visitor puede ver servicios públicos", () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanViewBusinesses(guest), true);
    assert.equal(
      businessVisibleToActor(guest, {
        id: "biz-1",
        tenantId: PANO,
        territoryId: "territory-1",
        status: "published",
        ownerPersonId: "owner-1",
        name: "Fontanería",
        category: "plumbing",
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
    const discover = readWeb("screens/DiscoverScreen.tsx");
    assert.match(discover, /fetchBusinesses/);
  });

  it("TEST 4 — Visitor no puede participar en ayudas privadas", () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanViewHelp(guest), false);
    assert.equal(actorCanCreateHelp(guest), false);
    const helpDetail = readWeb("screens/HelpDetailScreen.tsx");
    assert.match(helpDetail, /visitorConversionLabel/);
    assert.match(helpDetail, /!authenticated \|\| !hasMembership/);
  });

  it("TEST 5 — Active member puede crear ayuda", () => {
    const member = memberActor(PANO);
    assert.equal(actorCanViewHelp(member), true);
    assert.equal(actorCanCreateHelp(member), true);
    const helpComposer = readWeb("screens/HelpComposerScreen.tsx");
    assert.match(helpComposer, /createHelpRequestRequest/);
    const community = readWeb("screens/CommunityScreen.tsx");
    assert.match(community, /COMMUNITY_HELP_EMPTY_CTA/);
  });

  it("TEST 6 — Professional puede crear servicio", () => {
    const offer = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "offer_service",
    );
    const business = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "business_create",
    );
    assert.ok(offer);
    assert.ok(business);
    assert.equal(offer.route, "/business/register");
    assert.equal(business.route, "/business/register");

    const work = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "work_create",
    );
    assert.ok(work);
    assert.equal(work.route, "/services/work/create");
    assert.equal(workPostHref("wp-1"), "/services/work/wp-1");

    const sections = buildMagicPlusSections(COMMUNITY_CREATION_ACTIONS, (action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      icon: action.icon,
      onSelect: () => undefined,
    }));
    const titles = sections.map((section) => section.title);
    assert.equal(titles.includes("Ayuda"), true);
    assert.equal(titles.includes("Trabajo y oficios"), true);
    assert.doesNotMatch(titles.join("|"), /Trabajo \/ servicio/i);
  });

  it("TEST 7 — Tenant isolation intacto", () => {
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
    const audit = readFileSync(
      path.join(HERE, "..", "..", "..", "..", "..", "DOMAIN_BOUNDARY_AUDIT.md"),
      "utf8",
    );
    assert.match(audit, /Help ≠ Services/);
  });
});
