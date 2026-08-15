# Life Panoramica — roads v1

## Provenance

- **Provider:** OpenStreetMap (ODbL 1.0)
- **API:** `https://api.openstreetmap.org/api/0.6/map`
- **AOI bbox:** derived from OSM Nominatim neighbourhood
  `Urbanització Panoràmica` (Sant Jordi / Castellón) — not hand-drawn
- **Filter:** `highway=*` ways only
- **CRS:** WGS84 / CRS84 (lon, lat)
- **dataRef:** `tenant://life-panoramica/base/roads/v1`

## Files

- `roads.json` — FeatureCollection of LineStrings (GeoJSON encoded as `.json` for Next/webpack)
- `manifest.json` — feature count, bbox, attribution

## Refresh

From repo root:

```bash
# download OSM XML for the AOI bbox, then:
node scripts/extract-panoramica-roads.js
```

Do not invent geometries. Re-extract from OSM when updating.
