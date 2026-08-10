/**
 * Visual QA screenshots for conversation UX (400x824).
 *
 * Requires the dev server on :3000 and a local `playwright` install
 * (intentionally not a repo dependency).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "qa-screenshots");
const BASE = "http://localhost:3000";
const VIEWPORT = { width: 400, height: 824 };

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
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

  await page.goto(`${BASE}/community?tab=grupos`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(1000);
  await shot(page, "01-comunidad");

  const groupLink = page.locator('button:has-text("miembros")').first();
  await groupLink.click();
  await page.waitForURL(/\/conversation/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, "02-entrada-grupo-chat");
  await shot(page, "03-chat-abierto");

  const headerBtn = page
    .locator('header button[aria-label*="Conversación"]')
    .first();
  if ((await headerBtn.count()) > 0) {
    await headerBtn.click();
    await page.waitForTimeout(700);
    await shot(page, "04-header-info");
    const back = page.locator('button[aria-label="Cerrar"]').first();
    if ((await back.count()) > 0) await back.click();
    await page.waitForTimeout(400);
  }

  const emojiBtn = page.locator('button[aria-label="Emoji"]').first();
  if ((await emojiBtn.count()) > 0) {
    await emojiBtn.click();
    await page.waitForTimeout(600);
    await shot(page, "05-emoji-picker");
    const listo = page.locator('button:has-text("Listo")').first();
    if ((await listo.count()) > 0) await listo.click();
    await page.waitForTimeout(300);
  }

  const ta = page.locator("textarea").first();
  if ((await ta.count()) > 0) {
    await ta.fill("Hola");
    await page.waitForTimeout(500);
    await shot(page, "06-composer-escribiendo");
  }

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
