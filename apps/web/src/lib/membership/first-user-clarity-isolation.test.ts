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
    assert.match(view.explanation, /cuenta LIFE/i);
    assert.equal(PROFILE_REGISTERED_CLARITY_BODY.includes("únete a una comunidad"), true);
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /JoinCommunityExperience/);
    assert.match(profile, /UserStateCard/);
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
    assert.match(profile, /PROFILE_ACTIVE_CLARITY_TITLE/);
    assert.match(profile, /isActiveMember \? \(/);
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
    assert.match(home, /VISITOR_JOIN_HEADLINE/);
    assert.match(home, /VISITOR_HOME_EXPLORE_LABEL/);
    assert.match(home, /VISITOR_HOME_SERVICES_LABEL/);
    assert.match(home, /router\.push\("\/discover"\)/);
    assert.doesNotMatch(home, /CommunityActivationPanel[\s\S]*variant="visitor"/);
    assert.equal(VISITOR_HOME_EXPLORE_LABEL, "Explorar lugares");
    assert.equal(VISITOR_HOME_SERVICES_LABEL, "Ver servicios");
  });

  it("TEST 6 — no se mezclan Account y Membership", () => {
    const register = readWeb("screens/RegisterScreen.tsx");
    assert.doesNotMatch(register, /communityCode|Código de comunidad/);
    assert.match(register, /router\.replace\("\/me\?welcome=1"\)/);
    assert.match(register, /Crea tu cuenta LIFE/);
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /PostRegisterWelcome/);
    assert.equal(WELCOME_AFTER_REGISTER_TITLE, "Tu cuenta está lista");
    const shell = readWeb("components/MemberShell.tsx");
    assert.match(shell, /Únete a una comunidad para crear experiencias/);
    assert.doesNotMatch(shell, /Magic Plus es la entrada universal/);
    assert.doesNotMatch(shell, /Sin comunidad/);
  });
});
