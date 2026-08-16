# Life Panoramica — buildings v1

## Provenance

- **Provider:** Dirección General del Catastro (Spain) — INSPIRE Buildings
- **API:** `https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx`
- **Type:** `bu:Building`
- **AOI bbox:** same Urbanització Panoràmica neighbourhood AOI as roads v1
  (derived from OSM Nominatim — not hand-drawn)
- **CRS:** WGS84 / CRS84 (lon, lat in GeoJSON; GML source is lat lon)
- **dataRef:** `tenant://life-panoramica/base/buildings/v1`

OSM `building=*` coverage in this AOI is nearly empty; Cadastre is the
real available footprint source for Spanish territories.

## Files

- `buildings.json` — FeatureCollection of Polygons (GeoJSON encoded as `.json` for Next/webpack)
- `manifest.json` — feature count, bbox, attribution

## Refresh

From repo root:

```bash
curl -L -o tenants/life-panoramica/territory/data/buildings/v1/catastro-buildings.xml \
  "https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx?service=WFS&version=2.0.0&request=GetFeature&typenames=bu:Building&bbox=40.5387617,0.369504,40.5587617,0.389504,EPSG:4326&srsName=EPSG:4326&count=500"

node scripts/extract-panoramica-buildings.js
```

Do not invent geometries. Re-extract from Cadastre when updating.
