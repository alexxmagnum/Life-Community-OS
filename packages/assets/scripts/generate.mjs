#!/usr/bin/env node
/**
 * Deterministic generator: apps/web/public/assets/3d/manifest.json
 * → packages/assets/src/registry.generated.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonFile } from "./read-json.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const manifestPath = path.join(repoRoot, "apps/web/public/assets/3d/manifest.json");
const outPath = path.join(packageRoot, "src/registry.generated.ts");

function fail(msg) {
  console.error(`[assets:generate] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  fail(`Missing runtime manifest: ${manifestPath}`);
}

let manifest;
try {
  manifest = readJsonFile(manifestPath);
} catch (e) {
  fail(`Invalid JSON: ${e.message}`);
}

if (!manifest.assets || typeof manifest.assets !== "object") {
  fail("manifest.assets missing");
}

const keys = Object.keys(manifest.assets).sort((a, b) => a.localeCompare(b));
if (keys.length === 0) fail("manifest has zero assets");

const lines = [];
lines.push("/* eslint-disable */");
lines.push("/**");
lines.push(" * AUTO-GENERATED FILE — do not edit by hand.");
lines.push(" * Source: apps/web/public/assets/3d/manifest.json");
lines.push(" * Regenerate: pnpm assets:generate");
lines.push(` * AssetCount: ${keys.length}`);
lines.push(` * SchemaVersion: ${JSON.stringify(manifest.schemaVersion ?? null)}`);
lines.push(" */");
lines.push("");
lines.push('import type { AssetType, AssetScope } from "./types";');
lines.push("");
lines.push("export type GeneratedAssetEntry = {");
lines.push("  readonly path: string;");
lines.push("  readonly type: AssetType;");
lines.push("  readonly domain: string;");
lines.push("  readonly variant: string;");
lines.push("  readonly scope: AssetScope;");
lines.push("  readonly tenant: string | null;");
lines.push("  readonly width: number;");
lines.push("  readonly height: number;");
lines.push("};");
lines.push("");
lines.push("export const assetRegistry = {");

for (const key of keys) {
  const a = manifest.assets[key];
  const tenant =
    a.tenant === null || a.tenant === undefined ? "null" : JSON.stringify(String(a.tenant));
  lines.push(`  ${JSON.stringify(key)}: {`);
  lines.push(`    path: ${JSON.stringify(a.path)},`);
  lines.push(`    type: ${JSON.stringify(a.type)},`);
  lines.push(`    domain: ${JSON.stringify(a.domain)},`);
  lines.push(`    variant: ${JSON.stringify(a.variant)},`);
  lines.push(`    scope: ${JSON.stringify(a.scope)},`);
  lines.push(`    tenant: ${tenant},`);
  lines.push(`    width: ${Number(a.width)},`);
  lines.push(`    height: ${Number(a.height)},`);
  lines.push(`  },`);
}

lines.push("} as const satisfies Record<string, GeneratedAssetEntry>;");
lines.push("");
lines.push("export type AssetKey = keyof typeof assetRegistry;");
lines.push("");

const next = lines.join("\n") + "\n";
const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";

if (prev === next) {
  console.log(`[assets:generate] Unchanged (${keys.length} keys)`);
} else {
  fs.writeFileSync(outPath, next, "utf8");
  console.log(`[assets:generate] Wrote ${keys.length} keys → ${path.relative(repoRoot, outPath)}`);
}
