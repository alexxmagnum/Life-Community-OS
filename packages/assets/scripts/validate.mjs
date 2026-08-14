#!/usr/bin/env node
/**
 * Validate runtime manifest + generated registry + physical files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonFile } from "./read-json.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const manifestPath = path.join(repoRoot, "apps/web/public/assets/3d/manifest.json");
const publicRoot = path.join(repoRoot, "apps/web/public");
const generatedPath = path.join(packageRoot, "src/registry.generated.ts");

const VALID_TYPES = new Set([
  "symbol",
  "card",
  "object",
  "scene",
  "hero",
  "branding",
  "spatial_object",
  "terrain",
  "building",
  "avatar",
]);
const SPATIAL_TYPES = new Set(["spatial_object", "terrain", "building", "avatar"]);
const SPATIAL_LIBRARY_CATEGORIES = new Set([
  "terrain",
  "building",
  "place",
  "mobility",
  "community",
  "recreation",
  "nature",
  "avatar",
  "utility",
  // legacy aliases still accepted
  "poi",
  "structure",
  "character",
  "decoration",
  "amenity",
]);
const VALID_SCOPES = new Set(["global", "tenant"]);
const EXPECTED = {
  total: 48,
  global: 46,
  tenant: 2,
  byType: { symbol: 7, card: 14, object: 5, scene: 20, hero: 0, branding: 2 },
};

const errors = [];
const warnings = [];

function err(m) {
  errors.push(m);
}
function warn(m) {
  warnings.push(m);
}

if (!fs.existsSync(manifestPath)) err(`Missing manifest: ${manifestPath}`);
if (!fs.existsSync(generatedPath)) err(`Missing generated registry: ${generatedPath}`);

let manifest;
try {
  manifest = readJsonFile(manifestPath);
} catch (e) {
  err(`Manifest JSON invalid: ${e.message}`);
}

if (!manifest) {
  console.error("VALIDATION FAIL");
  process.exit(1);
}

if (!manifest.schemaVersion) err("Missing schemaVersion");
if (!manifest.assets || typeof manifest.assets !== "object") err("Missing assets");

const keys = Object.keys(manifest.assets || {});
const seen = new Set();
let global = 0;
let tenant = 0;
const byType = {
  symbol: 0,
  card: 0,
  object: 0,
  scene: 0,
  hero: 0,
  branding: 0,
  spatial_object: 0,
  terrain: 0,
  building: 0,
  avatar: 0,
};
let filesOk = 0;

for (const key of keys) {
  if (seen.has(key)) err(`Duplicate key: ${key}`);
  seen.add(key);
  const a = manifest.assets[key];
  if (!a.path) err(`${key}: missing path`);
  else {
    if (!a.path.startsWith("/assets/3d/")) err(`${key}: path must start with /assets/3d/`);
    if (a.path.includes("..")) err(`${key}: path traversal`);
    if (/^[A-Za-z]:[\\/]/.test(a.path) || a.path.startsWith("\\\\")) err(`${key}: absolute windows path`);
    if (/^https?:\/\//i.test(a.path)) err(`${key}: external url`);
    const rel = a.path.replace(/^\//, "").replace(/\//g, path.sep);
    const full = path.join(publicRoot, rel);
    if (!fs.existsSync(full)) err(`${key}: file missing → ${full}`);
    else filesOk += 1;
  }
  if (!VALID_TYPES.has(a.type)) err(`${key}: invalid type ${a.type}`);
  else byType[a.type] = (byType[a.type] || 0) + 1;
  if (!a.domain) err(`${key}: missing domain`);
  if (!VALID_SCOPES.has(a.scope)) err(`${key}: invalid scope ${a.scope}`);
  if (a.scope === "global") {
    global += 1;
    if (a.tenant !== null && a.tenant !== undefined && String(a.tenant) !== "") {
      err(`${key}: global but tenant=${a.tenant}`);
    }
  }
  if (a.scope === "tenant") {
    tenant += 1;
    if (!a.tenant) err(`${key}: tenant scope missing tenant`);
  }
  if (!(Number(a.width) > 0)) err(`${key}: invalid width`);
  if (!(Number(a.height) > 0)) err(`${key}: invalid height`);
  if (a.spatial !== undefined && a.spatial !== null) {
    if (typeof a.spatial !== "object" || Array.isArray(a.spatial)) {
      err(`${key}: spatial metadata must be an object`);
    } else {
      if (!a.spatial.category || typeof a.spatial.category !== "string") {
        err(`${key}: spatial.category required when spatial is set`);
      } else if (!SPATIAL_LIBRARY_CATEGORIES.has(a.spatial.category)) {
        warn(
          `${key}: spatial.category "${a.spatial.category}" not in Spatial Library vocabulary`,
        );
      }
      if (a.spatial.subtype !== undefined && typeof a.spatial.subtype !== "string") {
        err(`${key}: spatial.subtype must be a string when set`);
      }
      if (a.spatial.behaviour !== undefined && typeof a.spatial.behaviour !== "string") {
        err(`${key}: spatial.behaviour must be a string when set`);
      }
      if (
        a.spatial.interaction !== undefined &&
        typeof a.spatial.interaction !== "string"
      ) {
        err(`${key}: spatial.interaction must be a string when set`);
      }
      if (!SPATIAL_TYPES.has(a.type)) {
        warn(`${key}: spatial metadata on non-spatial type ${a.type}`);
      }
      if (a.spatial.modelPath) {
        const mp = String(a.spatial.modelPath);
        if (!mp.startsWith("/assets/3d/") || mp.includes("..")) {
          err(`${key}: spatial.modelPath must be a safe /assets/3d/ path`);
        }
      }
    }
  } else if (SPATIAL_TYPES.has(a.type)) {
    warn(`${key}: spatial type without spatial metadata (category recommended)`);
  }
}

if (keys.length !== EXPECTED.total) err(`Expected ${EXPECTED.total} entries, got ${keys.length}`);
if (global !== EXPECTED.global) err(`Expected ${EXPECTED.global} global, got ${global}`);
if (tenant !== EXPECTED.tenant) err(`Expected ${EXPECTED.tenant} tenant, got ${tenant}`);
for (const [t, n] of Object.entries(EXPECTED.byType)) {
  if ((byType[t] || 0) !== n) err(`Expected ${n} ${t}, got ${byType[t] || 0}`);
}

if (fs.existsSync(generatedPath)) {
  const generated = fs.readFileSync(generatedPath, "utf8");
  for (const key of keys) {
    if (!generated.includes(JSON.stringify(key))) {
      err(`Generated registry missing key: ${key}`);
    }
  }
  if (!generated.includes("export type AssetKey")) {
    err("Generated registry missing AssetKey type");
  }

  // Stale check: generated keys count
  const genKeyMatches = [...generated.matchAll(/^\s+"([^"]+)": \{/gm)].map((m) => m[1]);
  if (genKeyMatches.length !== keys.length) {
    warn(
      `Generated key literals=${genKeyMatches.length}, manifest=${keys.length} (run pnpm assets:generate)`,
    );
    err("Generated registry out of sync with manifest");
  }
}

console.log("");
console.log("ASSETS VALIDATE");
console.log(`Manifest entries:  ${keys.length}`);
console.log(`Global:            ${global}`);
console.log(`Tenant:            ${tenant}`);
console.log(`Files present:     ${filesOk}/${keys.length}`);
console.log(`Types:             ${JSON.stringify(byType)}`);
if (warnings.length) {
  console.log("Warnings:");
  warnings.forEach((w) => console.log(` - ${w}`));
}
if (errors.length) {
  console.log("");
  console.log("VALIDATION: FAIL");
  errors.forEach((e) => console.log(` - ${e}`));
  process.exit(1);
}
console.log("");
console.log("VALIDATION: PASS");
process.exit(0);
