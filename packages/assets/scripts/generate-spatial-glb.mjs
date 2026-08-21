#!/usr/bin/env node
/**
 * Generate architectural GLB library (metres, bottom-center pivot).
 * Premium hospitality massing — no characters, scenes, or toy props.
 *
 * Output: apps/web/public/assets/3d/platform/spatial/{category}/{file}/lod{n}/{file}.glb
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.resolve(
  __dirname,
  "../../../apps/web/public/assets/3d/platform/spatial",
);

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const MAGIC = 0x46546c67;

const MATERIALS = {
  stone: { pbrMetallicRoughness: { baseColorFactor: [0.72, 0.68, 0.62, 1], metallicFactor: 0, roughnessFactor: 0.52 } },
  ceramic: { pbrMetallicRoughness: { baseColorFactor: [0.93, 0.91, 0.88, 1], metallicFactor: 0, roughnessFactor: 0.22 } },
  glass: {
    pbrMetallicRoughness: { baseColorFactor: [0.72, 0.84, 0.88, 0.38], metallicFactor: 0.04, roughnessFactor: 0.08 },
    alphaMode: "BLEND",
  },
  plastic: { pbrMetallicRoughness: { baseColorFactor: [0.18, 0.2, 0.22, 1], metallicFactor: 0.12, roughnessFactor: 0.38 } },
  water: {
    pbrMetallicRoughness: { baseColorFactor: [0.28, 0.5, 0.58, 0.72], metallicFactor: 0.02, roughnessFactor: 0.12 },
    alphaMode: "BLEND",
  },
  green: { pbrMetallicRoughness: { baseColorFactor: [0.38, 0.5, 0.34, 1], metallicFactor: 0, roughnessFactor: 0.72 } },
  roof: { pbrMetallicRoughness: { baseColorFactor: [0.58, 0.46, 0.38, 1], metallicFactor: 0, roughnessFactor: 0.48 } },
  court: { pbrMetallicRoughness: { baseColorFactor: [0.22, 0.46, 0.5, 1], metallicFactor: 0, roughnessFactor: 0.55 } },
  clay: { pbrMetallicRoughness: { baseColorFactor: [0.55, 0.42, 0.32, 1], metallicFactor: 0, roughnessFactor: 0.62 } },
  line: { pbrMetallicRoughness: { baseColorFactor: [0.95, 0.94, 0.9, 1], metallicFactor: 0, roughnessFactor: 0.35 } },
};

function pad4(bytes) {
  const pad = (4 - (bytes.length % 4)) % 4;
  if (!pad) return bytes;
  const out = Buffer.concat([bytes, Buffer.alloc(pad, 0x20)]);
  return out;
}

function padBin(bytes) {
  const pad = (4 - (bytes.length % 4)) % 4;
  if (!pad) return bytes;
  return Buffer.concat([bytes, Buffer.alloc(pad, 0)]);
}

function addBox(parts, cx, cy, cz, sx, sy, sz, material) {
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;
  const p = [
    [-hx, -hy, hz],
    [hx, -hy, hz],
    [hx, hy, hz],
    [-hx, hy, hz],
    [-hx, -hy, -hz],
    [hx, -hy, -hz],
    [hx, hy, -hz],
    [-hx, hy, -hz],
  ].map(([x, y, z]) => [x + cx, y + cy, z + cz]);
  const faces = [
    [0, 1, 2, 3, 0, 0, 1],
    [5, 4, 7, 6, 0, 0, -1],
    [4, 0, 3, 7, -1, 0, 0],
    [1, 5, 6, 2, 1, 0, 0],
    [3, 2, 6, 7, 0, 1, 0],
    [4, 5, 1, 0, 0, -1, 0],
  ];
  for (const [a, b, c, d, nx, ny, nz] of faces) {
    const base = parts.positions.length / 3;
    for (const i of [a, b, c, d]) {
      parts.positions.push(p[i][0], p[i][1], p[i][2]);
      parts.normals.push(nx, ny, nz);
    }
    parts.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    parts.materialIds.push(material, material);
  }
}

function addDisc(parts, cx, cy, cz, rx, rz, segments, material) {
  const segs = Math.max(8, segments);
  const center = parts.positions.length / 3;
  parts.positions.push(cx, cy, cz);
  parts.normals.push(0, 1, 0);
  for (let i = 0; i <= segs; i += 1) {
    const t = (i / segs) * Math.PI * 2;
    parts.positions.push(cx + Math.cos(t) * rx, cy, cz + Math.sin(t) * rz);
    parts.normals.push(0, 1, 0);
  }
  for (let i = 0; i < segs; i += 1) {
    parts.indices.push(center, center + i + 1, center + i + 2);
    parts.materialIds.push(material);
  }
}

function buildGlb(parts, materialNames) {
  const pos = new Float32Array(parts.positions);
  const nrm = new Float32Array(parts.normals);
  const idx = new Uint16Array(parts.indices);
  const bin = Buffer.concat([
    Buffer.from(pos.buffer, pos.byteOffset, pos.byteLength),
    Buffer.from(nrm.buffer, nrm.byteOffset, nrm.byteLength),
    Buffer.from(idx.buffer, idx.byteOffset, idx.byteLength),
  ]);

  const posView = { buffer: 0, byteOffset: 0, byteLength: pos.byteLength, target: 34962 };
  const nrmView = {
    buffer: 0,
    byteOffset: pos.byteLength,
    byteLength: nrm.byteLength,
    target: 34962,
  };
  const idxView = {
    buffer: 0,
    byteOffset: pos.byteLength + nrm.byteLength,
    byteLength: idx.byteLength,
    target: 34963,
  };

  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    min = [Math.min(min[0], pos[i]), Math.min(min[1], pos[i + 1]), Math.min(min[2], pos[i + 2])];
    max = [Math.max(max[0], pos[i]), Math.max(max[1], pos[i + 1]), Math.max(max[2], pos[i + 2])];
  }

  const primitivesByMat = new Map();
  for (let t = 0; t < parts.indices.length / 3; t += 1) {
    const mat = parts.materialIds[t] ?? 0;
    if (!primitivesByMat.has(mat)) primitivesByMat.set(mat, []);
    primitivesByMat.get(mat).push(
      parts.indices[t * 3],
      parts.indices[t * 3 + 1],
      parts.indices[t * 3 + 2],
    );
  }

  const uniqueMats = [...primitivesByMat.keys()].sort((a, b) => a - b);
  const matIndex = new Map(uniqueMats.map((id, i) => [id, i]));
  const materials = uniqueMats.map((id) => ({
    name: materialNames[id] ?? "stone",
    ...MATERIALS[materialNames[id] ?? "stone"],
  }));

  const primitives = [];
  const extraIdx = [];
  let extraOffset = idx.byteLength;
  const extraChunks = [];

  for (const matId of uniqueMats) {
    const tri = Uint16Array.from(primitivesByMat.get(matId));
    extraChunks.push(Buffer.from(tri.buffer, tri.byteOffset, tri.byteLength));
    primitives.push({
      attributes: { POSITION: 0, NORMAL: 1 },
      indices: 2 + primitives.length,
      material: matIndex.get(matId),
    });
    extraIdx.push({
      bufferView: 3 + extraIdx.length,
      componentType: 5123,
      count: tri.length,
      type: "SCALAR",
    });
  }

  const extraBin = Buffer.concat(extraChunks);
  const fullBin = padBin(Buffer.concat([bin, extraBin]));

  const bufferViews = [posView, nrmView, idxView];
  let running = bin.length;
  for (const chunk of extraChunks) {
    bufferViews.push({
      buffer: 0,
      byteOffset: running,
      byteLength: chunk.length,
      target: 34963,
    });
    running += chunk.length;
  }

  const accessors = [
    {
      bufferView: 0,
      componentType: 5126,
      count: pos.length / 3,
      type: "VEC3",
      min,
      max,
    },
    { bufferView: 1, componentType: 5126, count: nrm.length / 3, type: "VEC3" },
    ...extraIdx.map((item, i) => ({
      ...item,
      bufferView: 3 + i,
    })),
  ];

  const gltf = {
    asset: { version: "2.0", generator: "life-community-os-spatial-glb" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "spatial-root" }],
    meshes: [{ primitives, name: "spatial-mesh" }],
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: fullBin.length }],
  };

  const json = pad4(Buffer.from(JSON.stringify(gltf), "utf8"));
  const jsonChunk = Buffer.alloc(8 + json.length);
  jsonChunk.writeUInt32LE(json.length, 0);
  jsonChunk.writeUInt32LE(JSON_CHUNK, 4);
  json.copy(jsonChunk, 8);

  const binChunk = Buffer.alloc(8 + fullBin.length);
  binChunk.writeUInt32LE(fullBin.length, 0);
  binChunk.writeUInt32LE(BIN_CHUNK, 4);
  fullBin.copy(binChunk, 8);

  const total = 12 + jsonChunk.length + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  return Buffer.concat([header, jsonChunk, binChunk]);
}

function mesh() {
  return { positions: [], normals: [], indices: [], materialIds: [] };
}

const STONE = 0;
const CERAMIC = 1;
const GLASS = 2;
const PLASTIC = 3;
const WATER = 4;
const GREEN = 5;
const ROOF = 6;
const COURT = 7;
const CLAY = 8;
const LINE = 9;
const NAMES = [
  "stone",
  "ceramic",
  "glass",
  "plastic",
  "water",
  "green",
  "roof",
  "court",
  "clay",
  "line",
];

function groundedBox(parts, x, z, w, d, h, y0, mat) {
  addBox(parts, x, y0 + h / 2, z, w, h, d, mat);
}

const BUILDERS = {
  "gate-entry": (lod) => {
    const p = mesh();
    const post = lod === 2 ? 0.35 : 0.28;
    groundedBox(p, -3.8, 0, post, post, 2.4, 0, STONE);
    groundedBox(p, 3.8, 0, post, post, 2.4, 0, STONE);
    groundedBox(p, 0, 0, 8.2, 0.7, 0.18, 2.4, CERAMIC);
    if (lod < 2) groundedBox(p, 0, 0.15, 7.6, 0.08, 0.9, 0.7, GLASS);
    return p;
  },
  "security-booth": (lod) => {
    const p = mesh();
    groundedBox(p, 0, 0, 2.4, 2.4, 0.12, 0, STONE);
    groundedBox(p, 0, 0, 2.2, 2.2, 2.2, 0.12, CERAMIC);
    if (lod < 2) {
      groundedBox(p, 0, 1.12, 1.6, 0.06, 1.1, 1.0, GLASS);
      groundedBox(p, 0, 0, 2.5, 2.5, 0.12, 2.45, ROOF);
    } else {
      groundedBox(p, 0, 0, 2.4, 2.4, 0.12, 2.45, ROOF);
    }
    return p;
  },
  "security-barrier": (lod) => {
    const p = mesh();
    groundedBox(p, -1.8, 0, 0.22, 0.22, 1.05, 0, PLASTIC);
    groundedBox(p, 0.3, 0, 3.6, 0.1, 0.08, 0.92, CERAMIC);
    if (lod === 0) groundedBox(p, -1.8, 0, 0.28, 0.28, 0.12, 0, STONE);
    return p;
  },
  "parking-area": (lod) => {
    const p = mesh();
    groundedBox(p, 0, 0, 5.0, 2.5, 0.06, 0, STONE);
    if (lod < 2) {
      groundedBox(p, -2.35, 0, 0.06, 2.3, 0.02, 0.06, LINE);
      groundedBox(p, 2.35, 0, 0.06, 2.3, 0.02, 0.06, LINE);
    }
    return p;
  },
  "ev-charger": (lod) => {
    const p = mesh();
    groundedBox(p, 0, 0, 0.38, 0.32, 0.08, 0, STONE);
    groundedBox(p, 0, 0, 0.22, 0.18, 1.28, 0.08, PLASTIC);
    if (lod === 0) groundedBox(p, 0.14, 0, 0.04, 0.08, 0.28, 1.0, CERAMIC);
    return p;
  },
  clubhouse: (lod) => {
    const p = mesh();
    groundedBox(p, 0, 0, 16, 10, 3.4, 0, STONE);
    groundedBox(p, 0, 0, 16.4, 10.4, 0.28, 3.4, ROOF);
    if (lod < 2) groundedBox(p, 0, 5.05, 8, 0.12, 1.8, 0.4, GLASS);
    if (lod === 0) groundedBox(p, -6.2, 0, 3.2, 3.6, 0.12, 0, CERAMIC);
    return p;
  },
  "restaurant-terrace": (lod) => {
    const p = mesh();
    groundedBox(p, 0, 0, 8, 6, 0.12, 0, STONE);
    groundedBox(p, 0, -1.4, 7.2, 3.2, 2.8, 0.12, CERAMIC);
    if (lod < 2) groundedBox(p, 0, 1.6, 6.4, 0.1, 2.2, 0.12, GLASS);
    if (lod === 0) groundedBox(p, 0, 0, 8.2, 6.2, 0.08, 3.05, ROOF);
    return p;
  },
  "pool-area": (lod) => {
    const p = mesh();
    groundedBox(p, 0, 0, 12.5, 6.5, 0.12, 0, STONE);
    addDisc(p, 0, 0.14, 0, 4.8, 2.2, lod === 0 ? 24 : 12, WATER);
    if (lod === 0) groundedBox(p, 0, 0, 10.2, 4.8, 0.04, 0.12, CERAMIC);
    return p;
  },
  "padel-court": (lod) => {
    const p = mesh();
    groundedBox(p, 0, 0, 20, 10, 0.08, 0, COURT);
    if (lod < 2) {
      groundedBox(p, 0, 5.05, 19.6, 0.06, 3.0, 0, GLASS);
      groundedBox(p, 0, -5.05, 19.6, 0.06, 3.0, 0, GLASS);
    }
    if (lod === 0) groundedBox(p, 0, 0, 0.04, 9.6, 0.02, 0.08, LINE);
    return p;
  },
  "tennis-court": (lod) => {
    const p = mesh();
    groundedBox(p, 0, 0, 23.77, 10.97, 0.08, 0, CLAY);
    if (lod < 2) groundedBox(p, 0, 0, 0.06, 10.6, 0.02, 0.08, LINE);
    return p;
  },
  "lake-area": (lod) => {
    const p = mesh();
    addDisc(p, 0, 0.04, 0, 9, 6, lod === 0 ? 28 : 12, WATER);
    if (lod < 2) addDisc(p, 0, 0.02, 0, 9.6, 6.5, lod === 0 ? 20 : 10, GREEN);
    return p;
  },
  "golf-area": (lod) => {
    const p = mesh();
    addDisc(p, 0, 0.02, 0, 1.6, 1.6, lod === 0 ? 16 : 8, GREEN);
    groundedBox(p, 0, 0, 0.08, 0.08, 2.2, 0, PLASTIC);
    if (lod < 2) groundedBox(p, 0.35, 0, 0.55, 0.04, 0.35, 1.85, CERAMIC);
    return p;
  },
};

const LIBRARY = [
  ["security", "gate-entry"],
  ["security", "security-booth"],
  ["security", "security-barrier"],
  ["mobility", "parking-area"],
  ["mobility", "ev-charger"],
  ["hospitality", "clubhouse"],
  ["hospitality", "restaurant-terrace"],
  ["sport", "pool-area"],
  ["sport", "padel-court"],
  ["sport", "tennis-court"],
  ["nature", "lake-area"],
  ["nature", "golf-area"],
];

function writeAsset(category, file) {
  for (const lod of [0, 1, 2]) {
    const parts = BUILDERS[file](lod);
    const glb = buildGlb(parts, NAMES);
    const dir = path.join(outRoot, category, file, `lod${lod}`);
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, `${file}.glb`);
    fs.writeFileSync(dest, glb);
    console.log(`[spatial:glb] ${path.relative(outRoot, dest)} (${glb.length} bytes)`);
  }
}

for (const [category, file] of LIBRARY) writeAsset(category, file);
console.log(`[spatial:glb] wrote ${LIBRARY.length} assets × 3 LOD`);
