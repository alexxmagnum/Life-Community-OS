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

const BRANDING_SYMBOL = "branding.life-panoramica-symbol.branding.symbol";
const BRANDING_WORDMARK = "branding.life-panoramica-wordmark.branding.wordmark";
const PLATFORM_SCENE = "professionals.electrician.scene";
const LOGICAL_BRANDING_SYMBOL = "branding.symbol";
const LOGICAL_BRANDING_WORDMARK = "branding.wordmark";

/** Mirrors packages/assets/src/tenant-pack.ts foundation pack. */
const tenantPacks = {
  "life-panoramica": {
    tenant: "life-panoramica",
    assets: {
      [LOGICAL_BRANDING_SYMBOL]: {
        path: registry[BRANDING_SYMBOL].path,
        type: "branding",
        domain: "branding",
        variant: "symbol",
        scope: "tenant",
        tenant: "life-panoramica",
        width: registry[BRANDING_SYMBOL].width,
        height: registry[BRANDING_SYMBOL].height,
      },
      [LOGICAL_BRANDING_WORDMARK]: {
        path: registry[BRANDING_WORDMARK].path,
        type: "branding",
        domain: "branding",
        variant: "wordmark",
        scope: "tenant",
        tenant: "life-panoramica",
        width: registry[BRANDING_WORDMARK].width,
        height: registry[BRANDING_WORDMARK].height,
      },
    },
  },
};

function packDefines(logicalKey) {
  return Object.values(tenantPacks).some((p) => logicalKey in p.assets);
}

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

/** Mirrors packages/assets/src/resolve.ts — platform first, then tenant pack. */
function getAsset(key, options = {}) {
  const requestedTenant = options.tenant?.trim() || undefined;
  if (requestedTenant) {
    const overrideKey = tenantOverrides[requestedTenant]?.[key];
    if (overrideKey && registry[overrideKey]) {
      assertSafe(registry[overrideKey].path);
      return { key: overrideKey, ...registry[overrideKey] };
    }
  }
  if (registry[key]) {
    const raw = registry[key];
    assertSafe(raw.path);
    if (raw.scope === "global") return { key, ...raw };
    if (!requestedTenant || raw.tenant !== requestedTenant) {
      throw new TenantIsolationError(key);
    }
    return { key, ...raw };
  }
  if (!requestedTenant) {
    if (packDefines(key)) throw new TenantIsolationError(key);
    throw new MissingAssetError(key);
  }
  const entry = tenantPacks[requestedTenant]?.assets[key];
  if (!entry) throw new MissingAssetError(key);
  assertSafe(entry.path);
  return { key, ...entry };
}

function resolveAsset(logicalKey, options) {
  return getAsset(logicalKey, options);
}

function asset(key, options) {
  return getAsset(key, options).path;
}

function listAssets(options = {}) {
  const requestedTenant = options.tenant?.trim() || undefined;
  const fromPlatform = Object.keys(registry)
    .filter((key) => {
      const raw = registry[key];
      if (raw.scope === "global") return true;
      return Boolean(requestedTenant && raw.tenant === requestedTenant);
    })
    .map((key) => getAsset(key, options));

  if (!requestedTenant) return fromPlatform;

  const pack = tenantPacks[requestedTenant];
  if (!pack) return fromPlatform;

  const fromPack = Object.keys(pack.assets)
    .filter((logicalKey) => !registry[logicalKey])
    .map((logicalKey) => getAsset(logicalKey, options));

  return [...fromPlatform, ...fromPack];
}

function getAssetConceptId(meta) {
  const key = typeof meta === "string" ? meta : meta.key;
  const parts = key.split(".");
  if (parts.length < 2) return key;
  return `${parts[0]}.${parts[1]}`;
}

test("1. professionals.electrician.scene → global path", () => {
  const p = asset(PLATFORM_SCENE);
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

test("6. platform asset without tenant resolves", () => {
  const m = getAsset(PLATFORM_SCENE);
  assert.equal(m.scope, "global");
  assert.equal(m.tenant, null);
});

test("7. tenant asset with matching tenant resolves", () => {
  const m = getAsset(BRANDING_SYMBOL, { tenant: "life-panoramica" });
  assert.equal(m.scope, "tenant");
  assert.equal(m.tenant, "life-panoramica");
  assert.match(m.path, /^\/assets\/3d\/tenants\/life-panoramica\//);
});

test("8. unknown key → MissingAssetError", () => {
  assert.throws(() => asset("does.not.exist"), (e) => e.name === "MissingAssetError");
});

test("9. global asset with tenant context still resolves global", () => {
  const p = asset(PLATFORM_SCENE, { tenant: "life-panoramica" });
  assert.equal(
    p,
    "/assets/3d/platform/professionals/electrician/scene/electrician.webp",
  );
  const p2 = asset(PLATFORM_SCENE, { tenant: "future-community-a" });
  assert.equal(p, p2);
});

test("10. tenant asset without tenant → TenantIsolationError", () => {
  assert.throws(
    () => getAsset(BRANDING_SYMBOL),
    (e) => e.name === "TenantIsolationError",
  );
  assert.throws(
    () => getAsset(BRANDING_WORDMARK),
    (e) => e.name === "TenantIsolationError",
  );
});

test("11. tenant asset cross-tenant → TenantIsolationError", () => {
  assert.throws(
    () =>
      getAsset(BRANDING_SYMBOL, {
        tenant: "future-community-a",
      }),
    (e) => e.name === "TenantIsolationError",
  );
});

test("12. manifest path traversal rejected", () => {
  assert.throws(() => assertSafe("/assets/3d/../secret.webp"), (e) => e.name === "UnsafeAssetPathError");
  assert.throws(() => assertSafe("C:\\Windows\\x.webp"), (e) => e.name === "UnsafeAssetPathError");
  assert.throws(() => assertSafe("https://evil.example/x.webp"), (e) => e.name === "UnsafeAssetPathError");
});

test("13. all 48 manifest files exist under public/", () => {
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

test("listAssets() without tenant → global only (46)", () => {
  const assets = listAssets();
  assert.equal(assets.length, 46);
  assert.equal(assets.filter((a) => a.scope === "global").length, 46);
  assert.equal(assets.filter((a) => a.scope === "tenant").length, 0);
  assert.equal(assets.filter((a) => a.type === "branding").length, 0);
});

test("listAssets({ tenant }) includes registry branding + pack logical keys", () => {
  const assets = listAssets({ tenant: "life-panoramica" });
  // 46 global + 2 legacy tenant keys + 2 logical pack keys
  assert.equal(assets.length, 50);
  assert.equal(assets.filter((a) => a.scope === "global").length, 46);
  assert.equal(assets.filter((a) => a.scope === "tenant").length, 4);
  assert.equal(assets.filter((a) => a.type === "branding").length, 4);
  assert.ok(assets.some((a) => a.key === LOGICAL_BRANDING_SYMBOL));
  assert.ok(assets.some((a) => a.key === LOGICAL_BRANDING_WORDMARK));
});

test("listAssets({ tenant: other }) excludes Panoramica branding", () => {
  const assets = listAssets({ tenant: "future-community-a" });
  assert.equal(assets.length, 46);
  assert.equal(assets.filter((a) => a.type === "branding").length, 0);
});

test("filters derive from registry domains; visible tenants need context", () => {
  const without = listAssets();
  const domains = [...new Set(without.map((a) => a.domain))].sort();
  assert.ok(domains.includes("professionals"));
  assert.ok(domains.includes("sports"));
  assert.deepEqual(
    [...new Set(without.filter((a) => a.tenant).map((a) => a.tenant))],
    [],
  );

  const withTenant = listAssets({ tenant: "life-panoramica" });
  const tenants = [
    ...new Set(withTenant.filter((a) => a.tenant).map((a) => a.tenant)),
  ].sort();
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

test("tenant metadata preserved on branding when listed with tenant", () => {
  const branding = listAssets({ tenant: "life-panoramica" }).filter(
    (a) => a.type === "branding",
  );
  assert.equal(branding.length, 4);
  for (const b of branding) {
    assert.equal(b.scope, "tenant");
    assert.equal(b.tenant, "life-panoramica");
    assert.ok(b.path.includes("/tenants/life-panoramica/"));
  }
});

test("pack: resolveAsset(branding.symbol, { tenant }) works", () => {
  const m = resolveAsset(LOGICAL_BRANDING_SYMBOL, { tenant: "life-panoramica" });
  assert.equal(m.key, LOGICAL_BRANDING_SYMBOL);
  assert.equal(m.scope, "tenant");
  assert.equal(m.tenant, "life-panoramica");
  assert.equal(m.path, registry[BRANDING_SYMBOL].path);
});

test("pack: branding.symbol without tenant → TenantIsolationError", () => {
  assert.throws(
    () => getAsset(LOGICAL_BRANDING_SYMBOL),
    (e) => e.name === "TenantIsolationError",
  );
});

test("pack: branding.symbol cross-tenant → MissingAssetError", () => {
  assert.throws(
    () => getAsset(LOGICAL_BRANDING_SYMBOL, { tenant: "future-community-a" }),
    (e) => e.name === "MissingAssetError",
  );
});

test("pack: platform key still preferred over pack", () => {
  const m = getAsset(PLATFORM_SCENE, { tenant: "life-panoramica" });
  assert.equal(m.scope, "global");
  assert.equal(m.tenant, null);
});

test("legacy slug branding keys still resolve with tenant", () => {
  const m = getAsset(BRANDING_SYMBOL, { tenant: "life-panoramica" });
  assert.equal(m.scope, "tenant");
  assert.match(m.key, /life-panoramica/);
});
