/**
 * Phase 18I-P2 — experience alignment + user state validation lock.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { resolveMembershipAccessScope } from "@/lib/membership/membership-experience-scope";
import { permissionsForRole as webPermissionsForRole } from "@/lib/auth/permissions";
import {
  CAPABILITIES,
  LIVING_EMPTY_DESCRIPTION,
  LIVING_EMPTY_TITLE,
  LIVING_PLACE_EMPTY_CTA,
  LIVING_PLACE_EMPTY_TITLE,
  buildLifePlaceActions,
  createLifePlaceContext,
  createLocation,
  projectLocationToLifePlaceView,
} from "@life-community-os/types";
import {
  cardAssetKeyForCategory,
  cardAssetPathForCategory,
  communityFeedCardImageUrl,
  locationCardImageUrl,
} from "@/lib/location/location-card-asset";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");
const TERRITORY = "10000000-0000-4000-8000-000000000002";
const PANO = "life-panoramica";

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

describe("Phase 18I-P2 experience alignment", () => {
  it("PASS — Visitor no parece miembro", () => {
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /profileVisitorTitle/);
    assert.match(profile, /Explora el territorio/);
    assert.match(profile, /Únete a LIFE/);
    assert.match(profile, /Explorar lugares/);
    assert.match(profile, /isActiveMember \?/);
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
    assert.match(profile, /JoinCommunityExperience/);
    assert.match(profile, /canonicalUserStateView|UserStateCard/);
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
    assert.match(shell, /createFabLabel/);
    assert.match(shell, /¿Qué quieres crear\?/);
    assert.match(shell, /ActionComposer/);
    assert.match(shell, /magicPlusMode/);
    assert.match(shell, /return "active" as const/);
    const scope = resolveMembershipAccessScope({
      authenticated: true,
      hasMembership: true,
      membershipStatus: "active",
      role: "member",
    });
    assert.equal(scope.scope, "active");
  });

  it("PASS — Admin puede gestionar comunidad", () => {
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /CAPABILITIES\.manageEnter/);
    assert.match(profile, /Abrir panel/);
    const adminPerms = webPermissionsForRole("administrator", PANO);
    assert.equal(adminPerms.includes(CAPABILITIES.manageEnter), true);
  });

  it("PASS — Life Place enruta creación por Magic Plus", () => {
    const sheet = readWeb("components/life-place/LifePlaceSheet.tsx");
    const host = readWeb("components/life-place/LifePlaceHost.tsx");
    assert.doesNotMatch(sheet, /Crear algo aquí/);
    assert.doesNotMatch(sheet, /router\.push\("\/experiences\/create"\)/);
    assert.match(host, /openActionComposerWithIntent\("experience_create"/);
    assert.match(sheet, /LIVING_PLACE_EMPTY_TITLE/);
    assert.match(sheet, /LIVING_PLACE_CREATE_CTA/);
  });

  it("PASS — Magic Plus inicia creación", () => {
    const shell = readWeb("components/MemberShell.tsx");
    assert.match(shell, /onCreate=/);
    assert.match(shell, /showCreateFab/);
    assert.doesNotMatch(shell, /CreatePostSheet/);
    assert.doesNotMatch(shell, /lcos:open-post/);
  });

  it("PASS — Lugar solo aporta contexto", () => {
    const pool = createLocation({
      id: "loc-pool",
      tenantId: PANO,
      territoryId: TERRITORY,
      type: "facility",
      name: "Piscina",
      address: "Club",
      latitude: 37.41,
      longitude: -4.75,
      category: "pool",
      visibility: "public",
    });
    const view = projectLocationToLifePlaceView(pool);
    const actions = buildLifePlaceActions({
      location: view,
      currentActivity: [],
      experiences: [],
      reservations: [],
      canCreateActivity: true,
    });
    assert.equal(
      actions.some((action) => action.kind === "create_activity"),
      true,
    );
    assert.equal(
      actions.some((action) => action.kind === "navigate"),
      true,
    );
    assert.equal(
      actions.some((action) => action.kind === "view_experiences"),
      true,
    );
    const context = createLifePlaceContext({
      tenantId: PANO,
      territoryId: TERRITORY,
      location: pool,
    });
    assert.equal(context.actions.some((a) => a.kind === "navigate"), true);
  });

  it("PASS — Cards resuelven asset por categoría", () => {
    assert.equal(cardAssetKeyForCategory("golf", "facility"), "sports.golf.card");
    assert.equal(
      cardAssetKeyForCategory("restaurant", "business"),
      "experiences.eat.card",
    );
    assert.match(
      cardAssetPathForCategory("restaurant", "business"),
      /\/assets\/3d\//,
    );
    assert.doesNotMatch(
      locationCardImageUrl({
        category: "golf",
        type: "facility",
        imageUrl: undefined,
      }),
      /map-pin/,
    );
    assert.doesNotMatch(
      communityFeedCardImageUrl({
        id: "x",
        tenantId: PANO,
        territoryId: TERRITORY,
        type: "experience",
        title: "Plan",
        actions: { primary: "join" },
      }),
      /neighbours\/scene/,
    );
  });

  it("PASS — No existe copy de historias sociales", () => {
    assert.doesNotMatch(LIVING_EMPTY_DESCRIPTION, /historia/i);
    assert.doesNotMatch(LIVING_PLACE_EMPTY_TITLE, /historia/i);
    assert.equal(LIVING_EMPTY_TITLE, "La comunidad empieza contigo");
    assert.equal(
      LIVING_PLACE_EMPTY_TITLE,
      "Aún no hay experiencias aquí",
    );
    assert.equal(LIVING_PLACE_EMPTY_CTA, "Ver experiencias");
    const discover = readWeb("screens/DiscoverScreen.tsx");
    assert.doesNotMatch(discover, /Lugares vivos/);
    assert.doesNotMatch(discover, /Crear algo cerca/);
    assert.doesNotMatch(discover, /primera historia/i);
    assert.doesNotMatch(discover, /openActionComposer/);
  });
});
