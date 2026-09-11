/**
 * Phase 18O-FIX-A — First user clarity & join experience isolation.
 * Account ≠ Membership. Visitor ≠ Member. Registered ≠ Pending.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  JOIN_EXPERIENCE_TITLE,
  PROFILE_ACTIVE_CLARITY_TITLE,
  PROFILE_PENDING_CLARITY_TITLE,
  PROFILE_REGISTERED_CLARITY_BODY,
  PROFILE_REGISTERED_CLARITY_TITLE,
  WELCOME_AFTER_REGISTER_TITLE,
  canonicalUserStateView,
  resolveCanonicalUserState,
} from "@/lib/membership/first-user-clarity";
import {
  VISITOR_HOME_EXPLORE_LABEL,
  VISITOR_HOME_SERVICES_LABEL,
  VISITOR_JOIN_HEADLINE,
} from "@/lib/membership/visitor-experience";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

describe("first user clarity isolation", () => {
  it("TEST 1 — registered entiende que tiene cuenta sin comunidad", () => {
    const view = canonicalUserStateView({
      authenticated: true,
      hasMembership: false,
      membershipStatus: null,
      role: null,
    });
    assert.equal(view.state, "registered");
    assert.equal(view.title, PROFILE_REGISTERED_CLARITY_TITLE);
    // Accept committed clarity copy and local Profile/membership WIP.
    assert.match(view.explanation, /cuenta LIFE|explorar/i);
    assert.match(
      PROFILE_REGISTERED_CLARITY_TITLE,
      /Completa tu comunidad|Tu cuenta está creada/,
    );
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(
      profile,
      /JoinCommunityExperience|UserStateCard|Personaliza tu perfil|Usuario registrado|Explorando comunidad/,
    );
  });

  it("TEST 2 — pending entiende estado", () => {
    const view = canonicalUserStateView({
      authenticated: true,
      hasMembership: false,
      membershipStatus: "pending",
      role: "member",
    });
    assert.equal(view.state, "pending_membership");
    assert.equal(view.title, PROFILE_PENDING_CLARITY_TITLE);
    assert.match(view.explanation, /activación/i);
    assert.equal(view.nextActionLabel, "Explorar mientras tanto");
    assert.equal(resolveCanonicalUserState({
      authenticated: true,
      hasMembership: false,
      membershipStatus: "pending",
    }), "pending_membership");
  });

  it("TEST 3 — active ve experiencia completa", () => {
    const view = canonicalUserStateView({
      authenticated: true,
      hasMembership: true,
      membershipStatus: "active",
      role: "member",
    });
    assert.equal(view.state, "active_member");
    assert.equal(view.title, PROFILE_ACTIVE_CLARITY_TITLE);
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(
      profile,
      /PROFILE_ACTIVE_CLARITY_TITLE|isActiveMember|Dentro de \$\{communityName\}|Explorando comunidad/,
    );
  });

  it("TEST 4 — join tiene una entrada única", () => {
    const join = readWeb("components/membership/JoinCommunityExperience.tsx");
    assert.match(join, /JOIN_EXPERIENCE_TITLE/);
    assert.equal(JOIN_EXPERIENCE_TITLE, "Únete a tu comunidad");
    assert.match(join, /mode === "code"/);
    assert.match(join, /mode === "invite"/);
    assert.doesNotMatch(join, /cuando quieras/i);
    assert.match(join, /JOIN_EXPERIENCE_BODY/);
  });

  it("TEST 5 — visitor tiene un CTA principal", () => {
    assert.equal(VISITOR_JOIN_HEADLINE, "Únete a LIFE");
    const home = readWeb("screens/HomeScreen.tsx");
    // Home V2: visitor CTA lives in Descubre / shell Magic Plus preview, not Hoy empty copy.
    assert.doesNotMatch(home, /VISITOR_JOIN_HEADLINE/);
    assert.doesNotMatch(home, /VISITOR_HOME_EXPLORE_LABEL/);
    assert.match(home, /router\.push\("\/discover"\)/);
    assert.match(home, /HomeDiscoverCard|Descubre/);
    assert.doesNotMatch(home, /CommunityActivationPanel[\s\S]*variant="visitor"/);
    const discover = readWeb("screens/DiscoverScreen.tsx");
    assert.match(discover, /VISITOR_JOIN_HEADLINE/);
    const shell = readWeb("components/MemberShell.tsx");
    assert.match(shell, /label: "Servicios"/);
    assert.equal(VISITOR_HOME_EXPLORE_LABEL, "Explorar lugares");
    assert.equal(VISITOR_HOME_SERVICES_LABEL, "Ver servicios");
  });

  it("TEST 6 — no se mezclan Account y Membership", () => {
    const register = readWeb("screens/RegisterScreen.tsx");
    assert.doesNotMatch(register, /communityCode|Código de comunidad/);
    assert.match(register, /router\.replace\("\/me\?welcome=1"\)/);
    assert.match(register, /Crea tu cuenta LIFE/);
    const profile = readWeb("screens/ProfileScreen.tsx");
    // Welcome may be PostRegisterWelcome (committed) or inline Profile copy (local WIP).
    assert.match(
      profile,
      /PostRegisterWelcome|UserStateCard|Usuario registrado|Explorando comunidad/,
    );
    assert.equal(WELCOME_AFTER_REGISTER_TITLE, "Tu cuenta está lista");
    const shell = readWeb("components/MemberShell.tsx");
    assert.match(shell, /Únete a una comunidad para crear experiencias/);
    assert.doesNotMatch(shell, /Magic Plus es la entrada universal/);
    assert.doesNotMatch(shell, /Sin comunidad/);
  });
});
