/**
 * Building feature contract for the 3D layer.
 * Footprints are rings of [lng, lat] — never tenant- or Cadastre-specific.
 */

/** Closed or open ring in WGS84 lon/lat order (GeoJSON-style). */
export type LifeMap3DFootprintRing = readonly (readonly [number, number])[];

/**
 * One building polygon to extrude.
 * Heights are metres; missing height uses layer default.
 */
export type LifeMap3DBuildingFeature = {
  id: string;
  /** Outer ring [lng, lat][]. Inner holes unsupported in v1. */
  footprint: LifeMap3DFootprintRing;
  /** Absolute height in metres when known. */
  heightMeters?: number;
  /** Optional opaque props (ids, labels) — never interpreted as domain logic. */
  properties?: Readonly<Record<string, unknown>>;
};

export type LifeMap3DBuildingMaterialHint = {
  color?: string;
  selectedColor?: string;
  hoverColor?: string;
  opacity?: number;
};

export const LIFE_MAP_3D_DEFAULT_BUILDING_HEIGHT_METERS = 6.5;

export const LIFE_MAP_3D_DEFAULT_BUILDING_MATERIAL: Required<LifeMap3DBuildingMaterialHint> =
  {
    color: "#b8a888",
    selectedColor: "#5eb0b8",
    hoverColor: "#c8b898",
    opacity: 0.96,
  };
