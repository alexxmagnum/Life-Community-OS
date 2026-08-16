/**
 * One-shot: convert Spanish Cadastre INSPIRE Building GML → buildings GeoJSON.
 * Run from repo root when refreshing the extract. Not a platform runtime.
 *
 * Source: https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx (bu:Building)
 * Coordinates in GML are lat lon (EPSG:4326); GeoJSON uses lon lat.
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(
  __dirname,
  "..",
  "tenants",
  "life-panoramica",
  "territory",
  "data",
  "buildings",
  "v1",
);
const xml = fs.readFileSync(path.join(dir, "catastro-buildings.xml"), "utf8");

const AOI_BBOX = [0.369504, 40.5387617, 0.389504, 40.5587617];

function parsePosList(posList, srsDimension = 2) {
  const nums = posList
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const coords = [];
  for (let i = 0; i + 1 < nums.length; i += srsDimension) {
    const lat = nums[i];
    const lon = nums[i + 1];
    coords.push([lon, lat]);
  }
  return coords;
}

function closeRing(coords) {
  if (coords.length < 3) return null;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...coords, first];
  }
  return coords;
}

const features = [];
const memberRe =
  /<(?:bu-ext2d:)?Building\b[^>]*gml:id="([^"]+)"[\s\S]*?<\/(?:bu-ext2d:)?Building>/g;
let m;
while ((m = memberRe.exec(xml))) {
  const block = m[0];
  const gmlId = m[1];

  const refMatch = block.match(
    /<(?:bu-core2d:)?reference>([^<]+)<\/(?:bu-core2d:)?reference>/,
  );
  const localIdMatch = block.match(
    /<(?:base:)?localId>([^<]+)<\/(?:base:)?localId>/,
  );
  const conditionMatch = block.match(
    /<(?:bu-core2d:)?conditionOfConstruction>([^<]+)<\/(?:bu-core2d:)?conditionOfConstruction>/,
  );

  const rings = [];
  for (const pm of block.matchAll(
    /<(?:gml:)?posList[^>]*>([\s\S]*?)<\/(?:gml:)?posList>/g,
  )) {
    const dimMatch = pm[0].match(/srsDimension="(\d+)"/);
    const dim = dimMatch ? Number(dimMatch[1]) : 2;
    const ring = closeRing(parsePosList(pm[1], dim));
    if (ring && ring.length >= 4) rings.push(ring);
  }
  if (rings.length === 0) continue;

  const geometry =
    rings.length === 1
      ? { type: "Polygon", coordinates: rings }
      : { type: "MultiPolygon", coordinates: rings.map((r) => [r]) };

  features.push({
    type: "Feature",
    id: gmlId,
    properties: {
      catastro_id: localIdMatch ? localIdMatch[1] : gmlId,
      reference: refMatch ? refMatch[1] : null,
      condition: conditionMatch ? conditionMatch[1] : null,
      source: "catastro",
      attribution: "© Dirección General del Catastro (Spain)",
    },
    geometry,
  });
}

let minLng = Infinity;
let minLat = Infinity;
let maxLng = -Infinity;
let maxLat = -Infinity;
function expand(coords) {
  for (const c of coords) {
    if (Array.isArray(c[0])) expand(c);
    else {
      const [lng, lat] = c;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
}
for (const f of features) expand(f.geometry.coordinates);

const fc = {
  type: "FeatureCollection",
  name: "life-panoramica-buildings-v1",
  crs: {
    type: "name",
    properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
  },
  features,
};

fs.writeFileSync(path.join(dir, "buildings.json"), JSON.stringify(fc));
fs.writeFileSync(
  path.join(dir, "manifest.json"),
  JSON.stringify(
    {
      dataRef: "tenant://life-panoramica/base/buildings/v1",
      kind: "buildings",
      format: "geojson",
      crs: "WGS84",
      version: "v1",
      featureCount: features.length,
      bbox: [minLng, minLat, maxLng, maxLat],
      extractedAt: new Date().toISOString(),
      source: {
        provider: "catastro",
        api: "https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx",
        typeName: "bu:Building",
        bbox: AOI_BBOX,
        bboxNote:
          "Same Urbanització Panoràmica AOI as roads v1 (Nominatim neighbourhood); not manually invented",
        license: "Spanish Cadastre open data / INSPIRE",
        attribution: "© Dirección General del Catastro",
      },
    },
    null,
    2,
  ),
);

console.log(`features=${features.length}`);
console.log(`bbox=${JSON.stringify([minLng, minLat, maxLng, maxLat])}`);
