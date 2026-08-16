# Life Panoramica — green v1

## Provenance

- **Provider:** OpenStreetMap (ODbL 1.0)
- **API:** `https://api.openstreetmap.org/api/0.6/map`
- **AOI:** expanded Urbanització Panoràmica neighbourhood context
- **Filter:** parks, gardens, grass/forest/meadow landuse, wood/scrub/grassland
- **CRS:** WGS84 / CRS84
- **dataRef:** `tenant://life-panoramica/base/green/v1`

Coverage in OSM is sparse for this estate — only mapped green polygons are included.

## Files

- `green.json` — FeatureCollection of Polygons
- `manifest.json`

## Refresh

Same extract as water:

```bash
node scripts/extract-panoramica-landcover.js
```

Do not invent geometries. Golf is tracked separately under `territory/data/golf/`.
