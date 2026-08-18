/**
 * Premium place visual catalog — Aman / Airbnb / Apple Maps identity.
 * Same LifeMap3D spatial contract; richer venue meshes (not CAD boxes).
 */

import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from "three";

import type { LifeMap3DAssetVisualKind } from "../asset-visual";

function mat(
  color: string,
  opts?: {
    opacity?: number;
    metalness?: number;
    roughness?: number;
    emissive?: number;
  },
) {
  const opacity = opts?.opacity ?? 1;
  return new MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.42,
    metalness: opts?.metalness ?? 0.08,
    transparent: opacity < 1,
    opacity,
    emissive: color,
    emissiveIntensity: opts?.emissive ?? 0.04,
  });
}

function add(g: Group, ...meshes: Mesh[]) {
  for (const mesh of meshes) g.add(mesh);
}

/** Soft landscaped ground plate under every venue. */
function groundPlate(w: number, d: number, color = "#7a9a62"): Mesh {
  const m = new Mesh(
    new BoxGeometry(w, 0.12, d),
    mat(color, { roughness: 0.92, emissive: 0.02 }),
  );
  m.position.y = 0.04;
  return m;
}

function planter(x: number, z: number, scale = 1): Group {
  const g = new Group();
  const pot = new Mesh(
    new CylinderGeometry(0.45 * scale, 0.55 * scale, 0.55 * scale, 10),
    mat("#c4b49a", { roughness: 0.7 }),
  );
  pot.position.y = 0.28 * scale;
  const bush = new Mesh(
    new SphereGeometry(0.55 * scale, 10, 8),
    mat("#3f7a3a", { roughness: 0.78, emissive: 0.05 }),
  );
  bush.position.y = 0.85 * scale;
  g.add(pot, bush);
  g.position.set(x, 0, z);
  return g;
}

function outdoorTable(x: number, z: number, rot = 0): Group {
  const g = new Group();
  const top = new Mesh(
    new CylinderGeometry(0.55, 0.55, 0.08, 16),
    mat("#efe6d6", { roughness: 0.35, metalness: 0.12 }),
  );
  top.position.y = 0.78;
  const leg = new Mesh(
    new CylinderGeometry(0.06, 0.08, 0.74, 8),
    mat("#8a8070", { metalness: 0.35, roughness: 0.35 }),
  );
  leg.position.y = 0.37;
  g.add(top, leg);
  // Chairs
  for (const [cx, cz] of [
    [0.85, 0],
    [-0.85, 0],
    [0, 0.85],
    [0, -0.85],
  ] as const) {
    const seat = new Mesh(
      new BoxGeometry(0.42, 0.06, 0.42),
      mat("#d8c8b0", { roughness: 0.55 }),
    );
    seat.position.set(cx, 0.48, cz);
    const back = new Mesh(
      new BoxGeometry(0.42, 0.45, 0.06),
      mat("#d8c8b0", { roughness: 0.55 }),
    );
    back.position.set(cx, 0.72, cz + (cz === 0 ? (cx > 0 ? 0.18 : -0.18) : cz > 0 ? 0.18 : -0.18));
    g.add(seat, back);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}

function umbrella(x: number, z: number, fabric = "#f2e6d4"): Group {
  const g = new Group();
  const pole = new Mesh(
    new CylinderGeometry(0.05, 0.06, 2.6, 8),
    mat("#e8e0d4", { metalness: 0.2 }),
  );
  pole.position.y = 1.3;
  const canopy = new Mesh(
    new ConeGeometry(1.55, 0.55, 12),
    mat(fabric, { roughness: 0.55, emissive: 0.06 }),
  );
  canopy.position.y = 2.55;
  const tip = new Mesh(
    new SphereGeometry(0.08, 8, 6),
    mat("#c4b49a", { metalness: 0.4 }),
  );
  tip.position.y = 2.85;
  g.add(pole, canopy, tip);
  g.position.set(x, 0, z);
  return g;
}

function loungeChair(x: number, z: number, rot = 0): Group {
  const g = new Group();
  const base = new Mesh(
    new BoxGeometry(0.7, 0.12, 1.9),
    mat("#e8dcc8", { roughness: 0.5 }),
  );
  base.position.y = 0.28;
  const back = new Mesh(
    new BoxGeometry(0.7, 0.55, 0.12),
    mat("#e8dcc8", { roughness: 0.5 }),
  );
  back.position.set(0, 0.55, -0.85);
  back.rotation.x = -0.35;
  const towel = new Mesh(
    new BoxGeometry(0.55, 0.04, 1.4),
    mat("#f5f0e8", { roughness: 0.7, emissive: 0.04 }),
  );
  towel.position.y = 0.36;
  g.add(base, back, towel);
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}

/** Restaurant — warm venue with terrace life. */
export function buildPremiumRestaurant(color: string): Group {
  const g = new Group();
  g.add(groundPlate(16, 14, "#6f9260"));

  // Stone terrace
  const terrace = new Mesh(
    new BoxGeometry(12.5, 0.22, 9.5),
    mat("#d8cfc0", { roughness: 0.68 }),
  );
  terrace.position.y = 0.14;
  add(g, terrace);

  // Main volume — warm plaster + timber accents
  const body = new Mesh(
    new BoxGeometry(7.4, 5.8, 6.2),
    mat(color, { roughness: 0.4, emissive: 0.1 }),
  );
  body.position.y = 3.05;
  const trim = new Mesh(
    new BoxGeometry(7.6, 0.28, 6.4),
    mat("#ebe3d4", { metalness: 0.1 }),
  );
  trim.position.y = 6.05;
  const roof = new Mesh(
    new BoxGeometry(8.2, 0.45, 7.0),
    mat("#f3ebe0", { metalness: 0.12, roughness: 0.38 }),
  );
  roof.position.y = 6.45;

  // Floor-to-ceiling glass facade
  const glass = new Mesh(
    new BoxGeometry(5.8, 3.4, 0.12),
    mat("#9ecfe4", { opacity: 0.92, metalness: 0.45, roughness: 0.18, emissive: 0.12 }),
  );
  glass.position.set(0, 3.0, 3.15);

  // Warm awning
  const awning = new Mesh(
    new BoxGeometry(6.4, 0.16, 2.4),
    mat("#8a5240", { roughness: 0.55, emissive: 0.12 }),
  );
  awning.position.set(0, 4.15, 4.0);

  // Soft interior glow (lanterns)
  const lanternL = new Mesh(
    new SphereGeometry(0.28, 12, 10),
    mat("#ffe8c0", { emissive: 0.45, metalness: 0.2, roughness: 0.3 }),
  );
  lanternL.position.set(-2.2, 4.5, 2.9);
  const lanternR = lanternL.clone();
  lanternR.position.x = 2.2;

  add(g, body, trim, roof, glass, awning, lanternL, lanternR);

  // Terrace furniture
  g.add(outdoorTable(-3.4, 5.4, 0.2));
  g.add(outdoorTable(0.2, 5.6, -0.1));
  g.add(outdoorTable(3.5, 5.3, 0.35));
  g.add(umbrella(-3.4, 5.4, "#f0e2cc"));
  g.add(umbrella(0.2, 5.6, "#e8d4b8"));
  g.add(umbrella(3.5, 5.3, "#f2e8d6"));
  g.add(planter(-5.6, 4.2, 1.1));
  g.add(planter(5.6, 4.2, 1.1));
  g.add(planter(-5.4, -2.8, 0.95));
  g.add(planter(5.4, -2.8, 0.95));

  return g;
}

/** Cafe / lounge — softer social venue. */
export function buildPremiumCafe(color: string): Group {
  const g = new Group();
  g.add(groundPlate(13, 12, "#6f9260"));
  const deck = new Mesh(
    new BoxGeometry(10, 0.18, 8.5),
    mat("#d4cbb8", { roughness: 0.7 }),
  );
  deck.position.y = 0.12;
  const body = new Mesh(
    new BoxGeometry(6.0, 4.6, 5.4),
    mat(color, { roughness: 0.42, emissive: 0.09 }),
  );
  body.position.y = 2.45;
  const bar = new Mesh(
    new BoxGeometry(3.6, 1.15, 1.35),
    mat("#efe6d8", { roughness: 0.4 }),
  );
  bar.position.set(0, 0.75, 3.2);
  const roof = new Mesh(
    new BoxGeometry(6.8, 0.38, 6.0),
    mat("#f5efe6", { metalness: 0.1 }),
  );
  roof.position.y = 4.9;
  const glass = new Mesh(
    new BoxGeometry(4.6, 2.6, 0.1),
    mat("#a8d4e4", { opacity: 0.88, metalness: 0.4, emissive: 0.1 }),
  );
  glass.position.set(0, 2.5, 2.75);
  add(g, deck, body, bar, roof, glass);
  g.add(outdoorTable(-2.8, 4.6));
  g.add(outdoorTable(2.8, 4.5));
  g.add(umbrella(-2.8, 4.6, "#efe2ce"));
  g.add(umbrella(2.8, 4.5, "#efe2ce"));
  g.add(planter(-4.6, 3.2));
  g.add(planter(4.6, 3.2));
  return g;
}

/** Pool — resort water + relax deck. */
export function buildPremiumPool(color: string): Group {
  const g = new Group();
  g.add(groundPlate(20, 16, "#6a8f5c"));

  const deck = new Mesh(
    new BoxGeometry(17, 0.2, 12),
    mat("#e6ddd0", { roughness: 0.62 }),
  );
  deck.position.y = 0.12;

  // Outer basin rim
  const rim = new Mesh(
    new BoxGeometry(13.2, 0.55, 7.6),
    mat("#c8d4d8", { metalness: 0.25, roughness: 0.4 }),
  );
  rim.position.y = 0.4;

  // Water volume — premium reflective cyan
  const water = new Mesh(
    new BoxGeometry(12.2, 0.48, 6.6),
    mat(color, {
      opacity: 0.78,
      metalness: 0.62,
      roughness: 0.12,
      emissive: 0.14,
    }),
  );
  water.position.y = 0.42;

  // Inner darker depth cue
  const depth = new Mesh(
    new BoxGeometry(10.5, 0.2, 5.2),
    mat("#1a6a92", { opacity: 0.85, metalness: 0.35, roughness: 0.25 }),
  );
  depth.position.y = 0.22;

  // Steps into water
  const step1 = new Mesh(
    new BoxGeometry(2.4, 0.18, 0.7),
    mat("#d0d8dc", { metalness: 0.2 }),
  );
  step1.position.set(5.2, 0.35, 0);
  const step2 = step1.clone();
  step2.position.set(4.4, 0.22, 0);
  step2.scale.set(1, 1, 1.1);

  add(g, deck, rim, depth, water, step1, step2);

  // Lounge row
  g.add(loungeChair(-5.2, 4.6, 0.08));
  g.add(loungeChair(-3.2, 4.65, -0.05));
  g.add(loungeChair(-1.2, 4.55, 0.12));
  g.add(loungeChair(1.0, 4.6, -0.08));
  g.add(umbrella(-4.2, 5.3, "#f4ead8"));
  g.add(umbrella(0, 5.25, "#efe2ce"));

  // Side daybed
  const daybed = new Mesh(
    new BoxGeometry(2.2, 0.35, 2.2),
    mat("#e8dcc8", { roughness: 0.55 }),
  );
  daybed.position.set(5.8, 0.35, 4.2);
  const cushion = new Mesh(
    new BoxGeometry(1.9, 0.18, 1.9),
    mat("#f7f1e8", { roughness: 0.65, emissive: 0.04 }),
  );
  cushion.position.set(5.8, 0.58, 4.2);
  add(g, daybed, cushion);

  g.add(planter(-7.5, -3.5, 1.2));
  g.add(planter(7.5, -3.5, 1.2));
  g.add(planter(-7.5, 4.0, 1.15));
  g.add(planter(7.5, 4.0, 1.15));

  return g;
}

/** Padel / sports court — glass cage, lights, net. */
export function buildPremiumSports(color: string): Group {
  const g = new Group();
  g.add(groundPlate(18, 14, "#5f8a52"));

  const apron = new Mesh(
    new BoxGeometry(15.5, 0.16, 10),
    mat("#d6d0c4", { roughness: 0.75 }),
  );
  apron.position.y = 0.08;

  const court = new Mesh(
    new BoxGeometry(13.2, 0.18, 6.8),
    mat(color, { roughness: 0.48, emissive: 0.07 }),
  );
  court.position.y = 0.2;

  // Center line
  const line = new Mesh(
    new BoxGeometry(0.12, 0.02, 6.6),
    mat("#f5f2ea", { roughness: 0.4 }),
  );
  line.position.y = 0.3;

  // Glass walls
  // Calibration: glass readable, not ghosted.
  const glassMat = mat("#e8f0f4", { opacity: 0.72, metalness: 0.35, roughness: 0.22 });
  const wallL = new Mesh(new BoxGeometry(0.1, 3.6, 6.8), glassMat);
  wallL.position.set(-6.65, 1.95, 0);
  const wallR = wallL.clone();
  wallR.position.x = 6.65;
  const wallBack = new Mesh(new BoxGeometry(13.2, 3.6, 0.1), glassMat);
  wallBack.position.set(0, 1.95, -3.45);
  const wallFront = wallBack.clone();
  wallFront.position.z = 3.45;
  wallFront.material = mat("#e8f0f4", {
    opacity: 0.58,
    metalness: 0.35,
    roughness: 0.24,
  });

  // Frame posts
  const postGeo = new CylinderGeometry(0.08, 0.09, 3.7, 8);
  const postMat = mat("#c8c4bc", { metalness: 0.45, roughness: 0.3 });
  for (const [px, pz] of [
    [-6.65, -3.45],
    [-6.65, 3.45],
    [6.65, -3.45],
    [6.65, 3.45],
  ] as const) {
    const post = new Mesh(postGeo, postMat);
    post.position.set(px, 1.95, pz);
    g.add(post);
  }

  // Net
  const net = new Mesh(
    new BoxGeometry(0.08, 1.15, 6.5),
    mat("#f8f6f2", { opacity: 0.7, roughness: 0.45 }),
  );
  net.position.y = 0.85;

  // Flood lights
  const mastGeo = new CylinderGeometry(0.1, 0.12, 6.2, 8);
  const mastMat = mat("#d0ccc4", { metalness: 0.35 });
  const lampMat = mat("#fff6e0", { emissive: 0.55, metalness: 0.25, roughness: 0.25 });
  for (const [mx, mz] of [
    [-7.4, 4.2],
    [7.4, 4.2],
    [-7.4, -4.2],
    [7.4, -4.2],
  ] as const) {
    const mast = new Mesh(mastGeo, mastMat);
    mast.position.set(mx, 3.15, mz);
    const lamp = new Mesh(new BoxGeometry(0.7, 0.25, 0.45), lampMat);
    lamp.position.set(mx, 6.2, mz);
    g.add(mast, lamp);
  }

  // Bench
  const bench = new Mesh(
    new BoxGeometry(2.8, 0.35, 0.55),
    mat("#c8b8a0", { roughness: 0.55 }),
  );
  bench.position.set(0, 0.45, 5.2);

  add(g, apron, court, line, wallL, wallR, wallBack, wallFront, net, bench);
  g.add(planter(-8.2, 5.5, 1.1));
  g.add(planter(8.2, 5.5, 1.1));
  return g;
}

/** Golf / green accent with small clubhouse. */
export function buildPremiumGolf(color: string): Group {
  const g = new Group();
  g.add(groundPlate(16, 14, "#5f8a52"));
  const fringe = new Mesh(
    new CylinderGeometry(6.4, 6.4, 0.22, 28),
    mat("#7aa568", { roughness: 0.8 }),
  );
  fringe.position.set(-1.2, 0.12, 0.4);
  const green = new Mesh(
    new CylinderGeometry(5.0, 5.0, 0.35, 28),
    mat(color, { roughness: 0.65, emissive: 0.05 }),
  );
  green.position.set(-1.2, 0.28, 0.4);
  const cup = new Mesh(
    new CylinderGeometry(0.18, 0.18, 0.12, 12),
    mat("#1a1a18", { roughness: 0.5 }),
  );
  cup.position.set(-1.2, 0.48, 0.4);
  const flag = new Mesh(
    new CylinderGeometry(0.05, 0.05, 4.6, 8),
    mat("#f5f0e8", { metalness: 0.3 }),
  );
  flag.position.set(-1.2, 2.5, 0.4);
  const banner = new Mesh(
    new BoxGeometry(1.2, 0.75, 0.06),
    mat("#d45c5c", { emissive: 0.14 }),
  );
  banner.position.set(-0.65, 4.4, 0.4);

  const club = new Mesh(
    new BoxGeometry(4.2, 3.4, 3.6),
    mat("#e8e0d2", { roughness: 0.45, emissive: 0.06 }),
  );
  club.position.set(5.2, 1.8, -3.2);
  const clubRoof = new Mesh(
    new BoxGeometry(4.6, 0.28, 4.0),
    mat("#c47848", { roughness: 0.4, emissive: 0.08 }),
  );
  clubRoof.position.set(5.2, 3.6, -3.2);
  const terrace = new Mesh(
    new BoxGeometry(3.2, 0.16, 2.4),
    mat("#d8d0c4", { roughness: 0.6 }),
  );
  terrace.position.set(5.2, 0.2, -0.6);

  add(g, fringe, green, cup, flag, banner, club, clubRoof, terrace);
  g.add(umbrella(5.2, -0.4, "#efe2ce"));
  g.add(planter(3.2, -4.6));
  g.add(planter(7.2, -4.6));
  return g;
}

/** Professional service storefront. */
export function buildPremiumService(color: string): Group {
  const g = new Group();
  g.add(groundPlate(13, 12, "#6f9260"));

  const plaza = new Mesh(
    new BoxGeometry(10, 0.16, 9),
    mat("#d6d0c4", { roughness: 0.72 }),
  );
  plaza.position.y = 0.1;

  const body = new Mesh(
    new BoxGeometry(6.2, 5.2, 5.8),
    mat(color, { roughness: 0.38, emissive: 0.1 }),
  );
  body.position.y = 2.75;

  const fascia = new Mesh(
    new BoxGeometry(6.4, 0.85, 0.22),
    mat("#f7f2ea", { emissive: 0.16, roughness: 0.35 }),
  );
  fascia.position.set(0, 4.65, 2.95);

  // Accent stripe on fascia
  const stripe = new Mesh(
    new BoxGeometry(5.6, 0.12, 0.08),
    mat(color, { emissive: 0.2 }),
  );
  stripe.position.set(0, 4.65, 3.08);

  const door = new Mesh(
    new BoxGeometry(1.55, 2.7, 0.1),
    mat("#243038", { roughness: 0.32, metalness: 0.25 }),
  );
  door.position.set(0, 1.5, 2.95);

  const winL = new Mesh(
    new BoxGeometry(1.55, 1.7, 0.08),
    mat("#9ecfe4", { opacity: 0.9, metalness: 0.4, emissive: 0.12 }),
  );
  winL.position.set(-2.0, 2.7, 2.95);
  const winR = winL.clone();
  winR.position.x = 2.0;

  const canopy = new Mesh(
    new BoxGeometry(5.0, 0.14, 1.6),
    mat("#5a7080", { roughness: 0.45, metalness: 0.2 }),
  );
  canopy.position.set(0, 3.55, 3.55);

  const roof = new Mesh(
    new BoxGeometry(6.8, 0.4, 6.4),
    mat("#e8e0d4", { metalness: 0.12 }),
  );
  roof.position.y = 5.55;

  const lamp = new Mesh(
    new SphereGeometry(0.36, 14, 12),
    mat("#fff4dc", { emissive: 0.4, metalness: 0.22, roughness: 0.28 }),
  );
  lamp.position.y = 6.05;

  add(g, plaza, body, fascia, stripe, door, winL, winR, canopy, roof, lamp);
  g.add(planter(-4.4, 3.6, 1.05));
  g.add(planter(4.4, 3.6, 1.05));
  g.add(planter(-4.4, -2.8, 0.95));
  g.add(planter(4.4, -2.8, 0.95));
  return g;
}

export function buildPremiumShop(color: string): Group {
  const g = buildPremiumService(color);
  return g;
}

export function buildPremiumClubhouse(color: string): Group {
  const g = new Group();
  g.add(groundPlate(16, 14, "#6f9260"));
  const deck = new Mesh(
    new BoxGeometry(13, 0.2, 10),
    mat("#d4cbb8", { roughness: 0.7 }),
  );
  deck.position.y = 0.12;
  const wingL = new Mesh(
    new BoxGeometry(4.0, 3.6, 6.0),
    mat(color, { roughness: 0.45, emissive: 0.06 }),
  );
  wingL.position.set(-3.2, 1.95, 0);
  const wingR = wingL.clone();
  wingR.position.x = 3.2;
  const hall = new Mesh(
    new BoxGeometry(5.4, 5.4, 4.8),
    mat("#dccab4", { roughness: 0.4, emissive: 0.07 }),
  );
  hall.position.y = 2.85;
  const glass = new Mesh(
    new BoxGeometry(4.6, 3.2, 0.12),
    mat("#a8d4e4", { opacity: 0.88, metalness: 0.4, emissive: 0.1 }),
  );
  glass.position.set(0, 2.8, 2.45);
  const roof = new Mesh(
    new BoxGeometry(12.5, 0.38, 9.5),
    mat("#f0e8dc", { metalness: 0.1 }),
  );
  roof.position.y = 5.7;
  add(g, deck, wingL, wingR, hall, glass, roof);
  g.add(outdoorTable(-4.5, 5.5));
  g.add(outdoorTable(4.5, 5.5));
  g.add(umbrella(-4.5, 5.5));
  g.add(umbrella(4.5, 5.5));
  g.add(planter(-6.5, 4.5, 1.15));
  g.add(planter(6.5, 4.5, 1.15));
  return g;
}

export function buildPremiumHouse(color: string): Group {
  const g = new Group();
  g.add(groundPlate(11, 10, "#6f9260"));
  const body = new Mesh(
    new BoxGeometry(6.2, 4.4, 5.4),
    mat(color, { roughness: 0.45, emissive: 0.05 }),
  );
  body.position.y = 2.3;
  const roof = new Mesh(
    new BoxGeometry(7.0, 0.5, 6.0),
    mat("#a88868", { roughness: 0.55 }),
  );
  roof.position.y = 4.7;
  add(g, body, roof);
  g.add(planter(-3.5, 3.2));
  g.add(planter(3.5, 3.2));
  return g;
}

export function buildPremiumEvent(color: string): Group {
  const g = new Group();
  g.add(groundPlate(13, 11, "#6f9260"));
  const stage = new Mesh(
    new BoxGeometry(8.0, 0.55, 5.0),
    mat(color, { emissive: 0.1, roughness: 0.4 }),
  );
  stage.position.y = 0.35;
  const tent = new Mesh(
    new ConeGeometry(3.6, 3.8, 10),
    mat("#f5efe6", { roughness: 0.55, emissive: 0.05 }),
  );
  tent.position.y = 2.9;
  const ring = new Mesh(
    new TorusGeometry(3.8, 0.08, 8, 32),
    mat("#e8dcc8", { metalness: 0.3 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.7;
  add(g, stage, tent, ring);
  return g;
}

export function buildPremiumSecurity(color: string): Group {
  const g = new Group();
  g.add(groundPlate(9, 8, "#6f9260"));
  const booth = new Mesh(
    new BoxGeometry(3.6, 3.2, 3.2),
    mat(color, { roughness: 0.45 }),
  );
  booth.position.y = 1.7;
  const post = new Mesh(
    new CylinderGeometry(0.22, 0.28, 4.6, 10),
    mat("#8a8070", { metalness: 0.25 }),
  );
  post.position.set(2.2, 2.3, 0);
  const lamp = new Mesh(
    new SphereGeometry(0.5, 12, 10),
    mat("#fff0d8", { emissive: 0.35, metalness: 0.25 }),
  );
  lamp.position.set(2.2, 4.8, 0);
  add(g, booth, post, lamp);
  return g;
}

export function buildPremiumGeneric(color: string): Group {
  return buildPremiumService(color);
}

export function buildPremiumAlert(color: string): Group {
  const g = new Group();
  const cone = new Mesh(
    new ConeGeometry(1.4, 3.0, 10),
    mat(color, { emissive: 0.16 }),
  );
  cone.position.y = 1.55;
  g.add(cone);
  return g;
}

export function buildPremiumPath(color: string): Group {
  const g = new Group();
  const marker = new Mesh(
    new CylinderGeometry(1.5, 1.7, 0.35, 16),
    mat(color, { roughness: 0.6 }),
  );
  marker.position.y = 0.2;
  g.add(marker);
  return g;
}

export function buildPremiumPlaceByKind(
  kind: LifeMap3DAssetVisualKind,
  color: string,
): Group {
  switch (kind) {
    case "restaurant":
      return buildPremiumRestaurant(color);
    case "cafe":
      return buildPremiumCafe(color);
    case "clubhouse":
      return buildPremiumClubhouse(color);
    case "shop":
      return buildPremiumShop(color);
    case "pool":
      return buildPremiumPool(color);
    case "golf":
      return buildPremiumGolf(color);
    case "padel":
      return buildPremiumSports(color);
    case "house":
      return buildPremiumHouse(color);
    case "service":
      return buildPremiumService(color);
    case "security":
      return buildPremiumSecurity(color);
    case "event":
      return buildPremiumEvent(color);
    case "alert":
      return buildPremiumAlert(color);
    case "path":
      return buildPremiumPath(color);
    default:
      return buildPremiumGeneric(color);
  }
}
