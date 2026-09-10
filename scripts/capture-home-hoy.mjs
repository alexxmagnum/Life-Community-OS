/**
 * Capture Home at 412×915 for ETAPA 2 Hoy visual validation.
 * Usage: node scripts/capture-home-hoy.mjs <out.png> [url]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9341);
const OUT = process.argv[2];
const URL = process.argv[3] || "http://localhost:3000/";
const USER_DATA = `${process.env.TEMP}\\life-hoy-cdp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

if (!OUT) {
  console.error("Usage: node capture-home-hoy.mjs <out.png> [url]");
  process.exit(1);
}

function getJson(p) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${PORT}${p}`, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function cdp(ws) {
  let nextId = 1;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(String(ev.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  return (method, params) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
}

const probeExpr = `(() => {
  const hoy = [...document.querySelectorAll("section")].find((s) =>
    /Hoy en/i.test(s.textContent || ""),
  );
  const make = [...document.querySelectorAll("section")].find((s) =>
    /Haz que pase/i.test(s.textContent || ""),
  );
  const hero = document.querySelector(".life-hero");
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      text: (el.textContent || "").trim().slice(0, 60),
      x: +r.x.toFixed(1),
      y: +r.y.toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
    };
  };
  const title = hoy?.querySelector("h2");
  const verTodo = [...(hoy?.querySelectorAll("button") || [])].find((b) =>
    /Ver todo/i.test(b.textContent || ""),
  );
  const tabs = hoy?.querySelector('[role="tablist"]');
  const tabBtns = [...(tabs?.querySelectorAll('[role="tab"]') || [])];
  const grid = hoy?.querySelector(".grid");
  const primary =
    hoy?.querySelector('[data-dev-placeholder="hoy-primary"]') ||
    hoy?.querySelector('[data-today-visual-harness] article') ||
    grid?.children?.[0];
  const sideCol = grid?.children?.[1];
  const sides = sideCol ? [...sideCol.children] : [];
  const discoverInHoy = /Descubre tu territorio/i.test(hoy?.textContent || "");
  const harness = !!hoy?.querySelector("[data-today-visual-harness]");
  const placeholders = hoy?.querySelectorAll("[data-dev-placeholder]")?.length || 0;
  return {
    hero: box(hero),
    hoy: box(hoy),
    make: box(make),
    title: box(title),
    verTodo: box(verTodo),
    tabs: box(tabs),
    tabFont: tabBtns[0] ? getComputedStyle(tabBtns[0]).fontSize : null,
    tabHeight: tabBtns[0]
      ? +tabBtns[0].getBoundingClientRect().height.toFixed(1)
      : null,
    primary: box(primary),
    secondary0: box(sides[0]),
    secondary1: box(sides[1]),
    columnGap: grid ? getComputedStyle(grid).columnGap : null,
    discoverInHoy,
    harness,
    placeholders,
    splashVisible: [...document.querySelectorAll("body *")].some((el) => {
      const s = getComputedStyle(el);
      if (s.position !== "fixed") return false;
      const z = Number(s.zIndex);
      if (!(z >= 35)) return false;
      if (s.opacity === "0") return false;
      const r = el.getBoundingClientRect();
      return r.height > 200 && !!el.querySelector("img");
    }),
  };
})()`;

fs.mkdirSync(USER_DATA, { recursive: true });
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    "--window-size=412,915",
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  let tabs;
  for (let i = 0; i < 40; i++) {
    try {
      tabs = await getJson("/json/list");
      if (tabs?.length) break;
    } catch {}
    await sleep(150);
  }
  if (!tabs?.length) throw new Error("Chrome CDP not ready");

  const page = tabs.find((t) => t.type === "page") || tabs[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res);
    ws.addEventListener("error", rej);
  });
  const send = cdp(ws);

  await send("Emulation.setDeviceMetricsOverride", {
    width: 412,
    height: 915,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });

  const needsHarness =
    URL.includes("todayVisual=1") || URL.includes("homeVisual=hoy");
  let info = null;
  for (let i = 0; i < 60; i++) {
    await sleep(200);
    const r = await send("Runtime.evaluate", {
      expression: probeExpr,
      returnByValue: true,
    });
    info = r.result?.value ?? r.result;
    if (!info?.hoy || info?.splashVisible) continue;
    if (needsHarness && !info.harness) continue;
    if (!needsHarness && info.placeholders < 1 && !info.primary) continue;
    if (info.title && info.tabs && info.primary && info.secondary0) break;
  }
  console.log(JSON.stringify(info, null, 2));

  // Scroll Hoy into comfortable view if needed (keep Hero visible when possible).
  await send("Runtime.evaluate", {
    expression: `(() => {
      const hoy = [...document.querySelectorAll("section")].find((s) =>
        /Hoy en/i.test(s.textContent || ""),
      );
      hoy?.scrollIntoView({ block: "nearest" });
    })()`,
  });
  await sleep(150);

  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(data, "base64"));
  console.log(`wrote ${OUT} (${fs.statSync(OUT).size} bytes)`);
  ws.close();
} finally {
  chrome.kill();
}
