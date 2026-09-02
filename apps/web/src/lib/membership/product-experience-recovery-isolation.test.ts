/**
 * Phase 18J — product experience recovery (navigation + Magic Plus + domain boundaries).
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  COMMUNITY_CREATION_ACTIONS,
  CommunityActionRegistry,
  communityCreationRoute,
  CAPABILITIES,
  EMPTY_PRODUCT_CAPABILITIES,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import { resolveMembershipAccessScope } from "@/lib/membership/membership-experience-scope";
import { buildMagicPlusSections } from "@/lib/community/magic-plus-sections";
import { COMPOSER_GLYPH_BY_ACTION } from "@/lib/community/composer-glyphs";
import { getTenantPack } from "@/lib/tenant/registry";
import { LIFE_PANORAMICA_TERRITORY_UUID } from "@/lib/tenant/ids";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");
const REPO_ROOT = path.join(HERE, "..", "..", "..", "..", "..");
const PANO = "life-panoramica";

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

describe("Phase 18J product experience recovery", () => {
  it("PASS — Visitor no parece miembro", () => {
    const shell = readWeb("components/MemberShell.tsx");
    assert.match(shell, /magicPlusMode !== "hidden"/);
    assert.match(shell, /return "hidden" as const/);
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /title="Acceso"/);
    const scope = resolveMembershipAccessScope({
      authenticated: false,
      hasMembership: false,
      membershipStatus: null,
      role: null,
    });
    assert.equal(scope.scope, "visitor");
  });

  it("PASS — Registered puede unirse", () => {
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /JoinCommunityPanel/);
    const scope = resolveMembershipAccessScope({
      authenticated: true,
      hasMembership: false,
      membershipStatus: null,
      role: null,
    });
    assert.equal(scope.scope, "registered");
  });

  it("PASS — Active Member puede crear", () => {
    const shell = readWeb("components/MemberShell.tsx");
    assert.match(shell, /¿Qué quieres crear\?/);
    assert.match(shell, /buildMagicPlusSections/);
    assert.match(shell, /showCreateFab/);
    const scope = resolveMembershipAccessScope({
      authenticated: true,
      hasMembership: true,
      membershipStatus: "active",
      role: "member",
    });
    assert.equal(scope.scope, "active");
  });

  it("PASS — Magic Plus enruta correctamente", () => {
    const pack = getTenantPack(PANO);
    const listed = CommunityActionRegistry.list({
      hasMembership: true,
      capabilities: permissionsForRole("member", PANO),
      productCapabilities: pack?.productCapabilities,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const sections = buildMagicPlusSections(listed, (action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      icon: action.icon,
      onSelect: () => undefined,
    }));
    const titles = sections.map((section) => section.title);
    assert.equal(titles.includes("Experiencia"), true);
    assert.equal(titles.includes("Aviso"), listed.some((a) => a.type === "announcement_create"));
    assert.equal(titles.includes("Comprar / vender"), listed.some((a) => a.type === "marketplace_listing"));
    assert.equal(titles.includes("Ayuda"), listed.some((a) => a.type === "help_request"));
    const announcement = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "announcement_create",
    );
    assert.ok(announcement);
    assert.equal(
      communityCreationRoute(announcement).includes("intent=announcement"),
      true,
    );
    const work = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "work_create",
    );
    assert.ok(work);
    assert.equal(work.route, "/services/work/create");
    const reservation = COMMUNITY_CREATION_ACTIONS.find(
      (item) => item.type === "reservation_create",
    );
    assert.ok(reservation);
    assert.equal(reservation.route, "/resources");
    assert.equal(
      sections.every((section) =>
        section.actions.every((action) => action.id !== "group_create"),
      ),
      true,
    );
  });

  it("PASS — Life Place no crea contenido", () => {
    const sheet = readWeb("components/life-place/LifePlaceSheet.tsx");
    assert.doesNotMatch(sheet, /Crear algo aquí/);
    assert.doesNotMatch(sheet, /primera historia/i);
  });

  it("PASS — Discover no contiene Community", () => {
    const discover = readWeb("screens/DiscoverScreen.tsx");
    assert.doesNotMatch(discover, /Ayuda entre vecinos/);
    assert.doesNotMatch(discover, /Comunidades/);
    assert.doesNotMatch(discover, /Profesionales/);
    assert.doesNotMatch(discover, /Experiencias cerca/);
    assert.doesNotMatch(discover, /Planes próximos/);
    assert.doesNotMatch(discover, /openActionComposer/);
    assert.doesNotMatch(discover, /fetchCommunityFeed/);
    assert.doesNotMatch(discover, /fetchHelpRequests/);
    assert.match(discover, /title="Lugares"/);
  });

  it("PASS — Services aparece en bottom nav", () => {
    const shell = readWeb("components/MemberShell.tsx");
    assert.match(shell, /label: "Servicios"/);
    assert.doesNotMatch(shell, /showMap/);
    assert.doesNotMatch(shell, /label: "Mapa"/);
    assert.doesNotMatch(shell, /label: "Descubrir"/);
    assert.match(shell, /buildNav\(\{\s*services: isModuleEnabled\("services"\)/);
  });

  it("PASS — Home enlaza a Services", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /Resolver algo/);
    assert.match(home, /router\.push\("\/services"\)/);
  });

  it("PASS — Explorar territorio en menú secundario", () => {
    const projector = readFileSync(
      path.join(
        REPO_ROOT,
        "tenants",
        "life-panoramica",
        "src",
        "navigation-projector.ts",
      ),
      "utf8",
    );
    assert.match(projector, /Explorar territorio/);
    assert.match(projector, /href: "\/map"/);
    assert.match(projector, /href: "\/discover"/);
    assert.match(projector, /territory-explore/);
  });

  it("PASS — Assets correctos por dominio", () => {
    const experience = COMPOSER_GLYPH_BY_ACTION.experience_create;
    const marketplace = COMPOSER_GLYPH_BY_ACTION.marketplace_listing;
    const reservation = COMPOSER_GLYPH_BY_ACTION.reservation_create;
    const help = COMPOSER_GLYPH_BY_ACTION.help_request;
    assert.ok(experience);
    assert.ok(marketplace);
    assert.ok(reservation);
    assert.ok(help);
    assert.match(experience, /\/assets\/3d\//);
    assert.match(marketplace, /\/assets\/3d\//);
    assert.match(reservation, /\/assets\/3d\//);
    assert.doesNotMatch(help, /map-pin|neighbours\/scene|location\/scene/i);
  });

  it("PASS — Tenant isolation intact (registry unchanged contract)", () => {
    const withoutMembership = CommunityActionRegistry.list({
      hasMembership: false,
      capabilities: permissionsForRole("member", PANO),
      productCapabilities: {
        ...EMPTY_PRODUCT_CAPABILITIES,
        ...getTenantPack(PANO)?.productCapabilities,
      },
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(withoutMembership.length, 0);
    assert.equal(
      COMMUNITY_CREATION_ACTIONS.some((item) => item.route === "/register"),
      false,
    );
  });

  it("PASS — Profile Mi vida aquí para miembros activos", () => {
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /Mi vida aquí/);
    assert.match(profile, /isActiveMember \?/);
  });
});
