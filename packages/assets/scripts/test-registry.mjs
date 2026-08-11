#!/usr/bin/env node
/**
 * Registry contract tests (node:test). No UI migration.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readJsonFile } from "./read-json.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const manifestPath = path.join(repoRoot, "apps/web/public/assets/3d/manifest.json");
const publicRoot = path.join(repoRoot, "apps/web/public");

const manifest = readJsonFile(manifestPath);
const registry = manifest.assets;
const tenantOverrides = {};

class MissingAssetError extends Error {
  constructor(k) {
    super(`Unknown assetKey: ${k}`);
    this.name = "MissingAssetError";
  }
}
class TenantIsolationError extends Error {
  constructor(k) {
    super(`Tenant isolation: ${k}`);
    this.name = "TenantIsolationError";
  }
}
class UnsafeAssetPathError extends Error {
  constructor(p) {
    super(`Unsafe path: ${p}`);
    this.name = "UnsafeAssetPathError";
  }
}

function assertSafe(pathStr) {
  if (!pathStr?.startsWith("/assets/3d/")) throw new UnsafeAssetPathError(pathStr);
  if (pathStr.includes("..")) throw new UnsafeAssetPathError(pathStr);
  if (/^[A-Za-z]:[\\/]/.test(pathStr) || pathStr.startsWith("\\\\")) throw new UnsafeAssetPathError(pathStr);
  if (/^https?:\/\//i.test(pathStr)) throw new UnsafeAssetPathError(pathStr);
}

function getAsset(key, options = {}) {
  const requestedTenant = options.tenant?.trim() || undefined;
  if (requestedTenant) {
    const overrideKey = tenantOverrides[requestedTenant]?.[key];
    if (overrideKey && registry[overrideKey]) {
      assertSafe(registry[overrideKey].path);
      return { key: overrideKey, ...registry[overrideKey] };
    }
  }
  if (!registry[key]) throw new MissingAssetError(key);
  const raw = registry[key];
  assertSafe(raw.path);
  if (raw.scope === "global") return { key, ...raw };
  if (requestedTenant && raw.tenant !== requestedTenant) {
    throw new TenantIsolationError(key);
  }
  return { key, ...raw };
}

function asset(key, options) {
  return getAsset(key, options).path;
}

test("1. professionals.electrician.scene → global path", () => {
  const p = asset("professionals.electrician.scene");
  assert.equal(
    p,
    "/assets/3d/platform/professionals/electrician/scene/electrician.webp",
  );
});

test("2. community.jobs.card → global path", () => {
  assert.equal(
    asset("community.jobs.card"),
    "/assets/3d/platform/community/jobs/card/jobs.webp",
  );
});

test("3. sports.football.card → global path", () => {
  assert.equal(
    asset("sports.football.card"),
    "/assets/3d/platform/sports/football/card/football.webp",
  );
});

test("4. professionals.waiter.scene → default variant", () => {
  const m = getAsset("professionals.waiter.scene");
  assert.equal(m.variant, "default");
  assert.equal(m.path, "/assets/3d/platform/professionals/waiter/scene/waiter.webp");
});

test("5. professionals.waiter.scene.alternate-1 → alternate", () => {
  const m = getAsset("professionals.waiter.scene.alternate-1");
  assert.equal(m.variant, "alternate-1");
  assert.equal(
    m.path,
    "/assets/3d/platform/professionals/waiter/scene/waiter--alternate-1.webp",
  );
});

test("6. Life Panoramica symbol → tenant asset", () => {
  const m = getAsset("branding.life-panoramica-symbol.branding.symbol");
  assert.equal(m.scope, "tenant");
  assert.equal(m.tenant, "life-panoramica");
  assert.match(m.path, /^\/assets\/3d\/tenants\/life-panoramica\//);
});

test("7. Life Panoramica wordmark → tenant asset", () => {
  const m = getAsset("branding.life-panoramica-wordmark.branding.wordmark");
  assert.equal(m.scope, "tenant");
  assert.equal(m.tenant, "life-panoramica");
});

test("8. unknown key → MissingAssetError", () => {
  assert.throws(() => asset("does.not.exist"), (e) => e.name === "MissingAssetError");
});

test("9. global asset with tenant context still resolves global", () => {
  const p = asset("professionals.electrician.scene", { tenant: "life-panoramica" });
  assert.equal(
    p,
    "/assets/3d/platform/professionals/electrician/scene/electrician.webp",
  );
  const p2 = asset("professionals.electrician.scene", { tenant: "future-community-a" });
  assert.equal(p, p2);
});

test("10. tenant A never receives tenant B branding", () => {
  assert.throws(
    () =>
      getAsset("branding.life-panoramica-symbol.branding.symbol", {
        tenant: "future-community-a",
      }),
    (e) => e.name === "TenantIsolationError",
  );
});

test("11. manifest path traversal rejected", () => {
  assert.throws(() => assertSafe("/assets/3d/../secret.webp"), (e) => e.name === "UnsafeAssetPathError");
  assert.throws(() => assertSafe("C:\\Windows\\x.webp"), (e) => e.name === "UnsafeAssetPathError");
  assert.throws(() => assertSafe("https://evil.example/x.webp"), (e) => e.name === "UnsafeAssetPathError");
});

test("12. all 48 manifest files exist under public/", () => {
  const keys = Object.keys(registry);
  assert.equal(keys.length, 48);
  for (const key of keys) {
    const web = registry[key].path;
    const rel = web.replace(/^\//, "").replace(/\//g, path.sep);
    const full = path.join(publicRoot, rel);
    assert.ok(fs.existsSync(full), `missing ${key} → ${full}`);
  }
});

test("multi-tenant: branding remains tenant-only", () => {
  const branding = Object.values(registry).filter((a) => a.type === "branding");
  assert.equal(branding.length, 2);
  for (const b of branding) {
    assert.equal(b.scope, "tenant");
    assert.equal(b.tenant, "life-panoramica");
  }
});

test("counts: 46 global / 2 tenant", () => {
  const values = Object.values(registry);
  assert.equal(values.filter((a) => a.scope === "global").length, 46);
  assert.equal(values.filter((a) => a.scope === "tenant").length, 2);
});

function listAssets() {
  return Object.keys(registry).map((key) => ({ key, ...registry[key] }));
}

function getAssetConceptId(meta) {
  const key = typeof meta === "string" ? meta : meta.key;
  const parts = key.split(".");
  if (parts.length < 2) return key;
  return `${parts[0]}.${parts[1]}`;
}

test("listAssets().length === 48 with expected distribution", () => {
  const assets = listAssets();
  assert.equal(assets.length, 48);
  assert.equal(new Set(assets.map((a) => a.key)).size, 48);
  assert.equal(assets.filter((a) => a.scope === "global").length, 46);
  assert.equal(assets.filter((a) => a.scope === "tenant").length, 2);
  assert.equal(assets.filter((a) => a.type === "symbol").length, 7);
  assert.equal(assets.filter((a) => a.type === "card").length, 14);
  assert.equal(assets.filter((a) => a.type === "object").length, 5);
  assert.equal(assets.filter((a) => a.type === "scene").length, 20);
  assert.equal(assets.filter((a) => a.type === "hero").length, 0);
  assert.equal(assets.filter((a) => a.type === "branding").length, 2);
});

test("filters derive from registry domains/tenants", () => {
  const assets = listAssets();
  const domains = [...new Set(assets.map((a) => a.domain))].sort();
  const tenants = [...new Set(assets.filter((a) => a.tenant).map((a) => a.tenant))].sort();
  assert.ok(domains.includes("professionals"));
  assert.ok(domains.includes("sports"));
  assert.deepEqual(tenants, ["life-panoramica"]);
});

test("family grouping: waiter variants share concept; football not merged with waiter", () => {
  const waiterConcept = getAssetConceptId("professionals.waiter.scene");
  const altConcept = getAssetConceptId("professionals.waiter.scene.alternate-1");
  const footballConcept = getAssetConceptId("sports.football.card");
  assert.equal(waiterConcept, "professionals.waiter");
  assert.equal(altConcept, "professionals.waiter");
  assert.equal(footballConcept, "sports.football");
  assert.notEqual(waiterConcept, footballConcept);

  const waiterFamily = listAssets().filter((a) => getAssetConceptId(a) === waiterConcept);
  assert.ok(waiterFamily.every((a) => a.key.includes("waiter")));
  assert.ok(!waiterFamily.some((a) => a.key.includes("football")));

  const waiterVariants = waiterFamily.filter((a) => a.type === "scene");
  assert.equal(waiterVariants.length, 2);
  assert.ok(waiterVariants.some((a) => a.variant === "default"));
  assert.ok(waiterVariants.some((a) => a.variant === "alternate-1"));
});

test("tenant metadata preserved on branding assets", () => {
  const branding = listAssets().filter((a) => a.type === "branding");
  assert.equal(branding.length, 2);
  for (const b of branding) {
    assert.equal(b.scope, "tenant");
    assert.equal(b.tenant, "life-panoramica");
    assert.ok(b.path.includes("/tenants/life-panoramica/"));
  }
});
