import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9340);
const OUT = process.argv[2];
const URL = process.argv[3] || "http://localhost:3000/";
const USER_DATA = `${process.env.TEMP}\\life-hero-cdp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

if (!OUT) {
  console.error("Usage: node capture-home-hero.mjs <out.png> [url]");
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
  const hero = document.querySelector('.life-hero');
  const header = document.querySelector('.life-hero__header');
  const life = header?.querySelector('button span');
  const territory = [...(header?.querySelectorAll('button span') || [])][1];
  const controls = [...(header?.querySelectorAll('button[aria-label]') || [])].filter((b) =>
    /Buscar|Notificaciones|perfil/i.test(b.getAttribute('aria-label') || ''),
  );
  const greeting = hero?.querySelector('.life-hero__content p');
  const name = hero?.querySelector('.life-hero__content h1');
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      text: (el.textContent || '').trim().slice(0, 40),
      x: +r.x.toFixed(1),
      y: +r.y.toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
    };
  };
  const hb = hero?.getBoundingClientRect();
  const style = hero ? getComputedStyle(hero) : null;
  return {
    hero: hb
      ? {
          y: +hb.y.toFixed(1),
          h: +hb.height.toFixed(1),
          bottom: +(hb.y + hb.height).toFixed(1),
          radius: style?.borderBottomLeftRadius,
          padX: getComputedStyle(hero.querySelector('.life-hero__content')).paddingLeft,
        }
      : null,
    life: box(life),
    territory: box(territory),
    control: controls[0]
      ? {
          d: +controls[0].getBoundingClientRect().width.toFixed(1),
          count: controls.length,
        }
      : null,
    greeting: box(greeting),
    name: box(name),
    splashVisible: [...document.querySelectorAll('body *')].some((el) => {
      const s = getComputedStyle(el);
      if (s.position !== 'fixed') return false;
      const z = Number(s.zIndex);
      if (!(z >= 35)) return false;
      if (s.opacity === '0') return false;
      const r = el.getBoundingClientRect();
      return r.height > 200 && !!el.querySelector('img');
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

  let info = null;
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    const r = await send("Runtime.evaluate", {
      expression: probeExpr,
      returnByValue: true,
    });
    info = r.result?.value ?? r.result;
    if (info?.hero && info?.greeting && !info?.splashVisible) {
      const needsAlex = URL.includes("heroVisual=alex");
      if (!needsAlex || info?.name?.text === "Alex") break;
    }
  }
  console.log(JSON.stringify(info, null, 2));

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
