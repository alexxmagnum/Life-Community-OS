# Life Panoramica — boundary v1 (prepared, no geometry)

## Status

**No authorized perimeter geometry is available yet.**

The layer slot remains planned:

- `dataRef`: `null` (see `life-map-territory-data.ts`)
- No `boundary.json` / GeoJSON extract
- MapLibre will **not** draw a boundary until a real source is registered

This folder documents the audit so we do not invent a hull, bbox rectangle,
or Cadastre polygon-union and call it “the urbanization boundary”.

## Sources audited (2026-08-16)

| Source | Query / API | Result |
|--------|-------------|--------|
| **OSM Nominatim** | `Urbanització Panoràmica, Sant Jordi` + `polygon_geojson=1` | Neighbourhood exists as **node only** (`osm_id` 12409659558) — **Point**, not Polygon. Bbox is a derived square around the node, not a surveyed perimeter. |
| **OSM Nominatim** | Golf / club name variants | No matching Panoramica Golf polygon in Castellón AOI. |
| **Overpass** | `leisure=golf_course`, `landuse`, named `Panor*` near AOI | No golf_course / neighbourhood relation usable as perimeter (water ways exist nearby — for a future **water** layer, not boundary). |
| **Catastro INSPIRE** `cp:CadastralZoning` | WFS bbox = Panoramica AOI | Returns **cadastral zoning polygons** (e.g. labels `095`, `020`) — real GIS, but **not** the legal/urbanización perimeter of Life Panoramica. Using them (or their union) would invent a product boundary. |

## What would unlock a real boundary

Authorized candidates (any one is enough):

1. **Tenant / operator CAD or GIS** — surveyed urbanización limit (preferred).
2. **Municipal planning geometry** (planeamiento / núcleo urbano) if officially published for this estate.
3. **OSM relation/way** if the community boundary is mapped as a closed polygon with clear provenance (not a Nominatim node bbox).

## Refresh (when a real source exists)

1. Place authorized GeoJSON as `boundary.json` (`.json` for Next/webpack).
2. Add `manifest.json` with provider, attribution, bbox, featureCount.
3. Set `dataRef` to `tenant://life-panoramica/base/boundary/v1`.
4. Register source + import + resolver payload (same pattern as roads/buildings).

Do **not** invent geometries. Do **not** treat Cadastre parcel unions or Nominatim point bboxes as the perimeter.
