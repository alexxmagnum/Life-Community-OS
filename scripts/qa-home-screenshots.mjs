/**
 * Visual QA for the Home experience (400x824).
 *
 * Requires the dev server on :3000 and a local `playwright` install
 * (intentionally not a repo dependency).
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

/** Resolve Playwright from a sandbox install when it is not in the workspace. */
const require = createRequire(
  process.env.QA_PLAYWRIGHT_ROOT
    ? pathToFileURL(path.join(process.env.QA_PLAYWRIGHT_ROOT, "noop.js"))
    : import.meta.url,
);
const { chromium } = require(process.env.QA_PLAYWRIGHT_MODULE ?? "playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "qa-screenshots");
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const VIEWPORT = { width: 400, height: 824 };

async function shot(page, name, fullPage = false) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  console.log("saved", file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  const page = await browser.newPage({ viewport: VIEWPORT });
  const failed = new Set();
  page.on("response", (response) => {
    if (response.status() >= 400) failed.add(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 90000 });
  /* The tenant splash covers the hero on first paint. */
  await page.waitForTimeout(6000);

  const height = await page.evaluate(() => document.body.scrollHeight);
  console.log("page height:", height);

  const headings = await page
    .locator("main h1, main h2, main h3")
    .allInnerTexts();
  console.log("HEADINGS:", JSON.stringify(headings, null, 1));

  const hero = await page.evaluate(() => {
    const img = document.querySelector("main img");
    const box = img?.closest("section")?.getBoundingClientRect();
    return box ? { w: Math.round(box.width), h: Math.round(box.height) } : null;
  });
  console.log("hero box:", JSON.stringify(hero));

  const heroText = await page.locator("main section").first().innerText();
  console.log("HERO TEXT:", JSON.stringify(heroText));

  const joinButtons = await page.locator('button:has-text("Unirme")').count();
  console.log("join buttons:", joinButtons);

  const stacked = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("main img"));
    return imgs.filter((i) => i.className.includes("rounded-full")).length;
  });
  console.log("stacked avatars:", stacked);

  await shot(page, "home-01-hero");
  await shot(page, "home-full", true);

  const positions = [700, 1400, 2100, 2800, 3500];
  for (const [index, top] of positions.entries()) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
    await page.waitForTimeout(600);
    await shot(page, `home-0${index + 2}-scroll-${top}`);
  }

  // Join flow from the main moment card.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await page.waitForTimeout(400);
  const firstJoin = page.locator('button:has-text("Unirme")').first();
  if (await firstJoin.count()) {
    await firstJoin.scrollIntoViewIfNeeded();
    await firstJoin.click();
    await page.waitForURL(/\/experiences\/.+\/join/, { timeout: 20000 }).catch(() => {});
    console.log("after Unirme:", page.url());
    await shot(page, "home-10-unirme");
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
  }

  // Quick action scrolls to today.
  const quick = page.locator('button:has-text("Qué pasa hoy")').first();
  if (await quick.count()) {
    await quick.click();
    await page.waitForTimeout(1200);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    console.log("scrollY after quick action:", y);
    await shot(page, "home-11-quick-action");
  }

  const brokenImages = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
  );
  console.log("BROKEN IMAGES:", JSON.stringify(brokenImages, null, 1));
  console.log("FAILED RESPONSES:", JSON.stringify([...failed], null, 1));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
