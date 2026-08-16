# Life Panoramica — terrain (prepared, no elevation)

## Status

**No authorized DEM / elevation dataset is wired yet.**

`LifeMapBaseLayer` type `terrain` is supported by Core contracts, but this tenant pack
does **not** invent contours, hillshade, or mesh from placeholders.

## Unlock candidates (authorized)

- Spanish IGN elevation / LiDAR products for Castellón (when licensed for product use)
- Tenant-supplied DEM / CAD terrain
- Future MapLibre terrain tiles (style-level) without inventing heights in Core

Until then: keep framing from roads/buildings AOI; no terrain `dataRef`.
