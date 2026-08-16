# Life Panoramica — golf (prepared, no geometry)

## Status

**No OSM `leisure=golf_course` (or `sport=golf`) polygon was found in the AOI.**

This is **recreation / Life OS**, not a duplicate of the `green` base layer:

| Concern | Layer |
|---------|--------|
| Territorial vegetation fills | `LifeMapBaseLayer` type `green` |
| Golf as activity / reservations / events | Future `LifeMapObject` + product module |

`dataRef` is **not** registered. No inventing fairways or course outlines.

## Unlock

Authorized CAD/GIS of the course, or an OSM golf_course relation when mapped.

Then:

1. Add `golf.json` + `manifest.json`
2. Prefer projecting as **LifeMapObject** / recreation (Phase 4), not a new Core base-layer type
3. Optional: also style related green polygons already in `green/v1`
