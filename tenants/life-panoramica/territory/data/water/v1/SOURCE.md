# Life Panoramica — water v1

## Provenance

- **Provider:** OpenStreetMap (ODbL 1.0)
- **API:** `https://api.openstreetmap.org/api/0.6/map`
- **AOI:** expanded Urbanització Panoràmica neighbourhood context
- **Filter:** `natural=water|wetland`, `landuse=reservoir|basin`, `waterway=riverbank`, `water=*`
- **CRS:** WGS84 / CRS84
- **dataRef:** `tenant://life-panoramica/base/water/v1`

## Files

- `water.json` — FeatureCollection (Polygon / LineString)
- `manifest.json` — feature count, bbox, attribution

## Refresh

```bash
curl -L -o tenants/life-panoramica/territory/data/water/v1/osm-map-raw.xml \
  "https://api.openstreetmap.org/api/0.6/map?bbox=0.360,40.530,0.395,40.565"
node scripts/extract-panoramica-landcover.js
```

Do not invent geometries.
