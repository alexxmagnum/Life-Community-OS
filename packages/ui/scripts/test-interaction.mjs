import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const presets = readFileSync(join(root, "src/interaction/presets.ts"), "utf8");
const css = readFileSync(join(root, "src/interaction/interaction.css"), "utf8");
const feedback = readFileSync(
  join(root, "src/interaction/ActionFeedback.tsx"),
  "utf8",
);
const barrel = readFileSync(join(root, "src/index.ts"), "utf8");
const door = readFileSync(
  join(root, "src/content/CategoryDoorCard.tsx"),
  "utf8",
);
const assetPad = readFileSync(join(root, "src/content/AssetPad.tsx"), "utf8");
const assetPadCss = readFileSync(
  join(root, "src/content/asset-pad.css"),
  "utf8",
);
const assetCardAlias = readFileSync(
  join(root, "src/content/AssetCard.tsx"),
  "utf8",
);
const pkg = readFileSync(join(root, "package.json"), "utf8");

test("interactionPreset API surface", () => {
  assert.match(presets, /export function interactionPreset/);
  assert.match(presets, /export function staggerItemProps/);
  assert.match(presets, /export function clampStaggerIndex/);
  assert.match(presets, /INTERACTION_STAGGER_MAX_INDEX = 3/);
  assert.match(presets, /press: "ui-press"/);
  assert.match(presets, /lift: "ui-lift"/);
  assert.match(presets, /pop: "ui-pop"/);
  assert.match(presets, /stagger: "ui-stagger-item"/);
});

test("CSS presets use motion tokens and honor reduced-motion", () => {
  assert.match(css, /\.ui-press/);
  assert.match(css, /\.ui-lift/);
  assert.match(css, /\.ui-pop/);
  assert.match(css, /\.ui-stagger-item/);
  assert.match(css, /var\(--motion-fast\)/);
  assert.match(css, /var\(--motion-easing\)/);
  assert.match(css, /\.ui-press:focus-visible/);
  assert.match(css, /@media \(hover: hover\)/);
  assert.match(css, /\.ui-press:active \.ui-lift/);
  assert.match(css, /translateY\(-2px\)/);
  assert.match(css, /translateY\(4px\)/);
  assert.match(css, /animation-delay: 36ms/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation-delay:\s*0ms\s*!important/);
  assert.equal(css.includes('data-stagger-index="3"'), true);
  assert.equal(css.includes('data-stagger-index="4"'), false);
});

test("CategoryDoorCard allows lift overflow and keeps stable well", () => {
  assert.match(door, /overflow-visible/);
  assert.match(door, /h-14 w-14/);
  assert.doesNotMatch(door, /overflow-hidden/);
});

test("AssetPad supports optional asset + layout-stable placeholder", () => {
  assert.match(assetPad, /assetSrc\?:/);
  assert.match(assetPad, /tone\?:/);
  assert.match(assetPad, /AssetPadTone/);
  assert.match(assetPad, /ui-asset-pad/);
  assert.match(assetPad, /interactionPreset\("press"\)/);
  assert.match(assetPad, /interactionPreset\("lift"\)/);
  assert.match(assetPad, /aria-hidden/);
  assert.doesNotMatch(assetPad, /@life-community-os\/assets/);
  assert.doesNotMatch(assetPad, /panoramica/i);
  assert.doesNotMatch(assetPad, /\/assets\/3d\//);
  assert.doesNotMatch(assetPad, /professionals/);
  assert.doesNotMatch(assetPad, /community\.jobs/);
});

test("AssetPad CSS tones + static tonal wave", () => {
  assert.match(assetPadCss, /\[data-tone="cyan"\]/);
  assert.match(assetPadCss, /\[data-tone="copper"\]/);
  assert.match(assetPadCss, /\[data-tone="green"\]/);
  assert.match(assetPadCss, /\[data-tone="blue"\]/);
  assert.match(assetPadCss, /\[data-tone="purple"\]/);
  assert.match(assetPadCss, /\[data-tone="berry"\]/);
  assert.match(assetPadCss, /\[data-tone="teal"\]/);
  assert.match(assetPadCss, /\.ui-asset-pad__wave/);
  assert.doesNotMatch(assetPadCss, /@keyframes/);
  assert.doesNotMatch(assetPadCss, /animation:/);
  assert.doesNotMatch(assetPadCss, /panoramica/i);
  assert.match(pkg, /asset-pad\.css/);
});

test("AssetCard remains deprecated alias of AssetPad", () => {
  assert.match(assetCardAlias, /@deprecated/);
  assert.match(assetCardAlias, /AssetPad as AssetCard/);
});

test("ActionFeedback is accessible without motion-only meaning", () => {
  assert.match(feedback, /role="status"/);
  assert.match(feedback, /aria-live="polite"/);
  assert.match(feedback, /label: string/);
});

test("public barrel exports AssetPad", () => {
  assert.match(barrel, /AssetPad/);
  assert.match(barrel, /AssetPadTone/);
  assert.match(barrel, /interactionPreset/);
  assert.match(barrel, /staggerItemProps/);
  assert.match(barrel, /ActionFeedback/);
});

test("tenant-agnostic: no tenant-specific references", () => {
  const blob = `${presets}\n${css}\n${feedback}\n${door}\n${assetPad}\n${assetPadCss}\n${assetCardAlias}`;
  assert.doesNotMatch(blob, /panoramica/i);
  assert.doesNotMatch(blob, /life-panoramica/i);
  assert.doesNotMatch(blob, /IKON/);
  assert.doesNotMatch(blob, /\/tenants\//);
});
