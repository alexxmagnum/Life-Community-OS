/**
 * Phase 18N — Mobile-first onboarding & auth experience isolation.
 * Account ≠ Membership. Authentication ≠ Community. Visitor ≠ Member.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  AUTH_EMAIL_EXISTS,
  AUTH_EMAIL_INVALID,
  AUTH_PASSWORD_MISMATCH,
  AUTH_PASSWORD_WEAK,
  isStrongEnoughPassword,
  isValidAuthEmail,
  mapRegisterError,
  passwordsMatch,
} from "@/lib/auth/auth-form-messages";
import { resolveMembershipAccessScope } from "@/lib/membership/membership-experience-scope";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

describe("auth onboarding experience isolation", () => {
  it("TEST 1 — registro solo requiere email/password/password confirmation", () => {
    const register = readWeb("screens/RegisterScreen.tsx");
    assert.match(register, /RequiredFieldLabel>Email/);
    assert.match(register, /RequiredFieldLabel>Contraseña/);
    assert.match(register, /RequiredFieldLabel>Confirmar contraseña/);
    assert.match(register, /passwordConfirm/);
    assert.doesNotMatch(register, /displayName|setDisplayName/);
    assert.doesNotMatch(register, /Nombre completo|intereses|dirección/i);
  });

  it("TEST 2 — no existe código comunidad en registro", () => {
    const register = readWeb("screens/RegisterScreen.tsx");
    assert.doesNotMatch(register, /communityCode|Código de comunidad|Código comunidad/);
    assert.doesNotMatch(register, /\/api\/auth\/community-code/);
    const join = readWeb("components/membership/JoinCommunityPanel.tsx");
    assert.match(join, /Únete a tu comunidad/);
    assert.match(join, /Código comunidad/);
  });

  it("TEST 3 — password confirmation funciona", () => {
    assert.equal(passwordsMatch("secreta12", "secreta12"), true);
    assert.equal(passwordsMatch("secreta12", "otra"), false);
    assert.equal(AUTH_PASSWORD_MISMATCH, "Las contraseñas no coinciden");
    const register = readWeb("screens/RegisterScreen.tsx");
    assert.match(register, /AUTH_PASSWORD_MISMATCH/);
    assert.match(register, /passwordsMatch/);
  });

  it("TEST 4 — registro inicia sesión automáticamente", () => {
    const route = readWeb("app/api/auth/register/route.ts");
    assert.match(route, /setAuthCookie/);
    assert.match(route, /AUTH_COOKIE\.access/);
    assert.match(route, /AUTH_COOKIE\.refresh/);
    assert.match(route, /data\.session/);
    const register = readWeb("screens/RegisterScreen.tsx");
    assert.doesNotMatch(register, /router\.replace\("\/login"\)/);
    assert.match(register, /router\.replace\("\/me"\)/);
  });

  it("TEST 5 — usuario vuelve autenticado (sesión persistente)", () => {
    const cookies = readWeb("lib/auth/session-cookies.ts");
    assert.match(cookies, /maxAge/);
    assert.match(cookies, /lcos-refresh-token/);
    const route = readWeb("app/api/auth/register/route.ts");
    assert.match(route, /60 \* 60 \* 24 \* 30/);
    const login = readWeb("app/api/auth/login/route.ts");
    assert.match(login, /setAuthCookie/);
    assert.match(login, /AUTH_COOKIE\.refresh/);
  });

  it("TEST 6 — después de registro llega a /me", () => {
    const register = readWeb("screens/RegisterScreen.tsx");
    assert.match(register, /router\.replace\("\/me"\)/);
    assert.doesNotMatch(register, /router\.replace\("\/"\)/);
    assert.match(register, /Únete a LIFE y descubre tu comunidad/);
  });

  it("TEST 7 — join community separado", () => {
    const profile = readWeb("screens/ProfileScreen.tsx");
    assert.match(profile, /JoinCommunityPanel/);
    const join = readWeb("components/membership/JoinCommunityPanel.tsx");
    assert.match(join, /!currentUser\.authenticated \|\| currentUser\.hasMembership/);
    assert.match(join, /Únete a tu comunidad/);
    const route = readWeb("app/api/auth/register/route.ts");
    assert.match(route, /status: "pending"/);
    assert.match(route, /membershipGrantsCommunityAccess/);
    const scope = resolveMembershipAccessScope({
      authenticated: true,
      hasMembership: false,
      membershipStatus: "pending",
      role: null,
    });
    assert.equal(scope.scope, "pending");
    assert.equal(scope.canAccessCommunity, false);
  });

  it("TEST 8 — visitor sigue siendo visitor", () => {
    const scope = resolveMembershipAccessScope({
      authenticated: false,
      hasMembership: false,
      membershipStatus: null,
      role: null,
    });
    assert.equal(scope.scope, "visitor");
    assert.equal(scope.canMutateCommunity, false);
    assert.equal(isValidAuthEmail("bad"), false);
    assert.equal(isValidAuthEmail("a@b.co"), true);
    assert.equal(isStrongEnoughPassword("short"), false);
    assert.equal(isStrongEnoughPassword("segura12"), true);
    assert.equal(mapRegisterError("User already registered"), AUTH_EMAIL_EXISTS);
    assert.equal(AUTH_EMAIL_INVALID.length > 0, true);
    assert.equal(AUTH_PASSWORD_WEAK.length > 0, true);
    const login = readWeb("screens/LoginScreen.tsx");
    assert.match(login, /Bienvenido de nuevo/);
    assert.match(login, /Iniciar sesión/);
    assert.match(login, /Crear cuenta/);
    assert.match(login, /olvidado tu contraseña/i);
    assert.match(login, /RequiredFieldLabel/);
  });
});
