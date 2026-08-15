/**
 * One-shot: convert OSM API map XML → roads GeoJSON (highways only).
 * Run from repo root when refreshing the extract. Not a platform runtime.
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
  "roads",
  "v1",
);
const xml = fs.readFileSync(path.join(dir, "osm-map-raw.xml"), "utf8");

const nodes = new Map();
for (const m of xml.matchAll(
  /<node id="(\d+)"[^>]*lat="([^"]+)" lon="([^"]+)"/g,
)) {
  nodes.set(m[1], [parseFloat(m[3]), parseFloat(m[2])]);
}

const features = [];
const wayRe = /<way id="(\d+)"[\s\S]*?<\/way>/g;
let wm;
while ((wm = wayRe.exec(xml))) {
  const wayXml = wm[0];
  const id = wm[1];
  const tags = {};
  for (const tm of wayXml.matchAll(/<tag k="([^"]+)" v="([^"]*)"\/>/g)) {
    tags[tm[1]] = tm[2];
  }
  if (!tags.highway) continue;

  const coords = [];
  for (const nm of wayXml.matchAll(/<nd ref="(\d+)"\/>/g)) {
    const c = nodes.get(nm[1]);
    if (c) coords.push(c);
  }
  if (coords.length < 2) continue;

  features.push({
    type: "Feature",
    id: `way/${id}`,
    properties: {
      osm_id: Number(id),
      highway: tags.highway,
      name: tags.name || null,
      source: "openstreetmap",
      attribution: "© OpenStreetMap contributors (ODbL)",
    },
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
  });
}

let minLng = Infinity;
let minLat = Infinity;
let maxLng = -Infinity;
let maxLat = -Infinity;
for (const f of features) {
  for (const [lng, lat] of f.geometry.coordinates) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
}

const fc = {
  type: "FeatureCollection",
  name: "life-panoramica-roads-v1",
  crs: {
    type: "name",
    properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
  },
  features,
};

fs.writeFileSync(path.join(dir, "roads.json"), JSON.stringify(fc));
fs.writeFileSync(
  path.join(dir, "manifest.json"),
  JSON.stringify(
    {
      dataRef: "tenant://life-panoramica/base/roads/v1",
      kind: "roads",
      format: "geojson",
      crs: "WGS84",
      version: "v1",
      featureCount: features.length,
      bbox: [minLng, minLat, maxLng, maxLat],
      extractedAt: new Date().toISOString(),
      source: {
        provider: "osm",
        api: "https://api.openstreetmap.org/api/0.6/map",
        bbox: [0.369504, 40.5387617, 0.389504, 40.5587617],
        bboxNote:
          "Derived from OSM Nominatim neighbourhood Urbanització Panoràmica (node); not manually invented",
        license: "ODbL 1.0",
        attribution: "© OpenStreetMap contributors",
      },
    },
    null,
    2,
  ),
);

console.log(`features=${features.length}`);
console.log(`bbox=${JSON.stringify([minLng, minLat, maxLng, maxLat])}`);
