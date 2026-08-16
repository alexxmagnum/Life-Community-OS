/**
 * Extract water + green (+ golf tags if any) from OSM map XML for Panoramica AOI.
 * Run from repo root. Does not invent geometry.
 */
const fs = require("fs");
const path = require("path");

const AOI = {
  west: 0.36,
  south: 40.53,
  east: 0.395,
  north: 40.565,
};

const root = path.join(__dirname, "..", "tenants", "life-panoramica", "territory", "data");
const xmlPath = path.join(root, "water", "v1", "osm-map-raw.xml");
const xml = fs.readFileSync(xmlPath, "utf8");

const nodes = new Map();
for (const m of xml.matchAll(
  /<node id="(\d+)"[^>]*lat="([^"]+)" lon="([^"]+)"/g,
)) {
  nodes.set(m[1], [parseFloat(m[3]), parseFloat(m[2])]);
}

function parseTags(wayXml) {
  const tags = {};
  for (const tm of wayXml.matchAll(/<tag k="([^"]+)" v="([^"]*)"\/>/g)) {
    tags[tm[1]] = tm[2];
  }
  return tags;
}

function wayCoords(wayXml) {
  const coords = [];
  for (const nm of wayXml.matchAll(/<nd ref="(\d+)"\/>/g)) {
    const c = nodes.get(nm[1]);
    if (c) coords.push(c);
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

function isWater(tags) {
  if (tags.natural === "water" || tags.natural === "wetland") return true;
  if (tags.landuse === "reservoir" || tags.landuse === "basin") return true;
  if (tags.waterway === "riverbank") return true;
  if (tags.water) return true;
  return false;
}

function isGolf(tags) {
  return tags.leisure === "golf_course" || tags.sport === "golf";
}

function isGreen(tags) {
  if (isGolf(tags)) return false; // golf tracked separately in properties
  if (
    tags.landuse === "grass" ||
    tags.landuse === "forest" ||
    tags.landuse === "meadow" ||
    tags.landuse === "recreation_ground" ||
    tags.landuse === "village_green" ||
    tags.landuse === "orchard" ||
    tags.landuse === "vineyard"
  ) {
    return true;
  }
  if (
    tags.natural === "wood" ||
    tags.natural === "scrub" ||
    tags.natural === "grassland" ||
    tags.natural === "heath"
  ) {
    return true;
  }
  if (
    tags.leisure === "park" ||
    tags.leisure === "garden" ||
    tags.leisure === "pitch" ||
    tags.leisure === "nature_reserve"
  ) {
    return true;
  }
  return false;
}

function expandBbox(features) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  function walk(coords) {
    for (const c of coords) {
      if (Array.isArray(c[0])) walk(c);
      else {
        const [lng, lat] = c;
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
  for (const f of features) walk(f.geometry.coordinates);
  if (!Number.isFinite(minLng)) return [AOI.west, AOI.south, AOI.east, AOI.north];
  return [minLng, minLat, maxLng, maxLat];
}

function intersectsAoi(coords) {
  let hit = false;
  function walk(c) {
    if (Array.isArray(c[0])) {
      for (const x of c) walk(x);
      return;
    }
    const [lng, lat] = c;
    if (
      lng >= AOI.west &&
      lng <= AOI.east &&
      lat >= AOI.south &&
      lat <= AOI.north
    ) {
      hit = true;
    }
  }
  walk(coords);
  return hit;
}

function writeLayer(kind, features, outDir, extraSource = {}) {
  const filtered = features.filter((f) =>
    intersectsAoi(f.geometry.coordinates),
  );
  fs.mkdirSync(outDir, { recursive: true });
  const fc = {
    type: "FeatureCollection",
    name: `life-panoramica-${kind}-v1`,
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
    },
    features: filtered,
  };
  fs.writeFileSync(path.join(outDir, `${kind}.json`), JSON.stringify(fc));
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(
      {
        dataRef: `tenant://life-panoramica/base/${kind}/v1`,
        kind,
        format: "geojson",
        crs: "WGS84",
        version: "v1",
        featureCount: filtered.length,
        bbox: expandBbox(filtered),
        extractedAt: new Date().toISOString(),
        source: {
          provider: "osm",
          api: "https://api.openstreetmap.org/api/0.6/map",
          bbox: [AOI.west, AOI.south, AOI.east, AOI.north],
          bboxNote:
            "Expanded Urbanitzacio Panoramica AOI (Nominatim neighbourhood context); not hand-drawn",
          license: "ODbL 1.0",
          attribution: "(c) OpenStreetMap contributors",
          ...extraSource,
        },
      },
      null,
      2,
    ),
  );
  console.log(`${kind}: features=${filtered.length} (raw=${features.length})`);
  return filtered.length;
}

const waterFeatures = [];
const greenFeatures = [];
const golfFeatures = [];

const wayRe = /<way id="(\d+)"[\s\S]*?<\/way>/g;
let wm;
while ((wm = wayRe.exec(xml))) {
  const wayXml = wm[0];
  const id = wm[1];
  const tags = parseTags(wayXml);
  const coords = wayCoords(wayXml);
  if (coords.length < 2) continue;

  const baseProps = {
    osm_id: Number(id),
    name: tags.name || null,
    source: "openstreetmap",
    attribution: "(c) OpenStreetMap contributors (ODbL)",
  };

  if (isWater(tags)) {
    const ring = closeRing(coords);
    const geometry =
      ring && ring.length >= 4
        ? { type: "Polygon", coordinates: [ring] }
        : { type: "LineString", coordinates: coords };
    waterFeatures.push({
      type: "Feature",
      id: `way/${id}`,
      properties: {
        ...baseProps,
        natural: tags.natural || null,
        waterway: tags.waterway || null,
        water: tags.water || null,
        landuse: tags.landuse || null,
      },
      geometry,
    });
    continue;
  }

  if (isGolf(tags)) {
    const ring = closeRing(coords);
    if (!ring || ring.length < 4) continue;
    golfFeatures.push({
      type: "Feature",
      id: `way/${id}`,
      properties: {
        ...baseProps,
        leisure: tags.leisure || null,
        sport: tags.sport || null,
        recreation: "golf",
      },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
    continue;
  }

  if (isGreen(tags)) {
    const ring = closeRing(coords);
    if (!ring || ring.length < 4) continue;
    greenFeatures.push({
      type: "Feature",
      id: `way/${id}`,
      properties: {
        ...baseProps,
        natural: tags.natural || null,
        landuse: tags.landuse || null,
        leisure: tags.leisure || null,
      },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
  }
}

writeLayer("water", waterFeatures, path.join(root, "water", "v1"));
writeLayer("green", greenFeatures, path.join(root, "green", "v1"));
const golfCount = writeLayer("golf", golfFeatures, path.join(root, "golf", "v1"), {
  note: "Recreation golf footprints when mapped in OSM — not inventing course layout",
});
if (golfCount === 0) {
  // Keep extract artifacts for audit, but empty golf is not a product layer yet.
  console.log("golf: no OSM golf_course in AOI — leave prepared only");
}
