/**
 * Life Map premium visual system — MapLibre paint + background.
 *
 * Territory geometry stays in LifeMapBaseLayer / resolver.
 * This module only owns look & feel (no demotiles, no GIS defaults).
 */

import type {
  FillLayerSpecification,
  LineLayerSpecification,
  StyleSpecification,
} from "maplibre-gl";

/** Bound base types this paint system styles (mirrors binder, avoids cycles). */
export type LifeMapPremiumBaseLayerType =
  | "roads"
  | "water"
  | "buildings"
  | "green"
  | "boundary";

/** Soft resort terrain — warm sand/olive, not cartographic grey. */
export const LIFE_MAP_PREMIUM_TERRAIN = {
  background: "#e8e4d8",
  backgroundDeep: "#ddd6c8",
} as const;

/**
 * Layer palette — natural community, low contrast, premium SaaS.
 * Tuned for MapLibre 2D under optional Three volume.
 */
export const LIFE_MAP_PREMIUM_PALETTE = {
  water: "#6ba8c4",
  waterDeep: "#4f8fad",
  green: "#8faf7a",
  greenDeep: "#6f9260",
  roadsPrimary: "#f5f1e8",
  roadsSecondary: "#ebe4d6",
  roadsEdge: "#c4b8a4",
  buildings: "#d9d2c5",
  buildingsOutline: "#b9b0a0",
  buildingsHover: "#cfc4b0",
  buildingsSelected: "#a8c4c8",
  boundary: "#8a7f6e",
} as const;

export type LifeMapRenderQuality = "mobile" | "desktop";

/**
 * Detect a conservative mobile quality tier (touch + narrow viewport).
 * Desktop keeps higher DPR / optional soft shadows in the 3D overlay.
 */
export function detectLifeMapRenderQuality(): LifeMapRenderQuality {
  if (typeof window === "undefined") return "desktop";
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const narrow =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 768px)").matches;
  return coarse || narrow ? "mobile" : "desktop";
}

/** Max device pixel ratio by quality — protects mobile WebGL memory. */
export function lifeMapPixelRatioForQuality(
  quality: LifeMapRenderQuality,
): number {
  const dpr =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return quality === "mobile" ? Math.min(dpr, 1.5) : Math.min(dpr, 2);
}

/**
 * Self-contained MapLibre style — no remote demotiles / OSM basemap.
 * Territory layers are added by the binder on top.
 */
export const LIFE_MAP_PREMIUM_STYLE: StyleSpecification = {
  version: 8,
  name: "life-map-premium",
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {},
  layers: [
    {
      id: "lm-background",
      type: "background",
      paint: {
        "background-color": LIFE_MAP_PREMIUM_TERRAIN.background,
      },
    },
  ],
};

/** @deprecated Prefer {@link LIFE_MAP_PREMIUM_STYLE}; kept for debug toggles. */
export const MAPLIBRE_TECHNICAL_PREVIEW_STYLE =
  "https://demotiles.maplibre.org/style.json";

type LinePaint = NonNullable<LineLayerSpecification["paint"]>;
type FillPaint = NonNullable<FillLayerSpecification["paint"]>;

/**
 * Zoom / class hierarchy for roads — elegant paths, less GIS noise.
 */
export function premiumRoadsPaint(): LinePaint {
  return {
    "line-color": LIFE_MAP_PREMIUM_PALETTE.roadsPrimary,
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      12,
      [
        "match",
        ["get", "highway"],
        "residential",
        2.2,
        "unclassified",
        2.4,
        "service",
        1.4,
        "path",
        1.0,
        1.8,
      ],
      16,
      [
        "match",
        ["get", "highway"],
        "residential",
        5.5,
        "unclassified",
        6,
        "service",
        3.2,
        "path",
        2,
        4.5,
      ],
    ],
    "line-opacity": 0.92,
    "line-blur": 0.2,
  };
}

export function premiumBoundaryPaint(): LinePaint {
  return {
    "line-color": LIFE_MAP_PREMIUM_PALETTE.boundary,
    "line-width": 1.5,
    "line-opacity": 0.55,
    "line-dasharray": [1.5, 1.25],
  };
}

export function premiumWaterPaint(): FillPaint {
  return {
    "fill-color": LIFE_MAP_PREMIUM_PALETTE.water,
    "fill-opacity": 0.72,
    "fill-outline-color": LIFE_MAP_PREMIUM_PALETTE.waterDeep,
  };
}

export function premiumGreenPaint(): FillPaint {
  return {
    "fill-color": LIFE_MAP_PREMIUM_PALETTE.green,
    "fill-opacity": 0.55,
    "fill-outline-color": LIFE_MAP_PREMIUM_PALETTE.greenDeep,
  };
}

/**
 * Soft building masses — feature-state ready for hover / selected.
 */
export function premiumBuildingsPaint(): FillPaint {
  return {
    "fill-color": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      LIFE_MAP_PREMIUM_PALETTE.buildingsSelected,
      ["boolean", ["feature-state", "hover"], false],
      LIFE_MAP_PREMIUM_PALETTE.buildingsHover,
      LIFE_MAP_PREMIUM_PALETTE.buildings,
    ],
    "fill-opacity": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      0.92,
      ["boolean", ["feature-state", "hover"], false],
      0.88,
      0.78,
    ],
    "fill-outline-color": LIFE_MAP_PREMIUM_PALETTE.buildingsOutline,
  };
}

export function premiumPaintForBaseType(
  type: LifeMapPremiumBaseLayerType,
): LinePaint | FillPaint {
  switch (type) {
    case "roads":
      return premiumRoadsPaint();
    case "boundary":
      return premiumBoundaryPaint();
    case "water":
      return premiumWaterPaint();
    case "buildings":
      return premiumBuildingsPaint();
    case "green":
      return premiumGreenPaint();
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/**
 * Camera framing for “entering my community” — not GIS inspect zoom.
 */
export const LIFE_MAP_PREMIUM_CAMERA = {
  /** Extra breathing room around territory bounds. */
  fitPaddingPx: 56,
  /** Avoid plunging into parcel-scale GIS zoom on open. */
  maxFitZoom: 15.4,
  /** Opening move duration (ms). 0 = snap (SSR / first paint). */
  openDurationMs: 1100,
  /** Hybrid: gentle pitch so volume reads without a hard cut. */
  hybridPitchDegrees: 52,
  hybridPitchDurationMs: 2000,
  /** Cinematic entrance — arrive into the community. */
  entranceStartZoomDelta: 1.35,
  entranceStartPitch: 12,
  entranceStartBearingOffset: -22,
  entranceDurationMs: 2800,
  /** Volume presence: buildings gain extrusion as user approaches. */
  volumeZoomStart: 13.2,
  volumeZoomFull: 15.2,
  volumePitchStart: 14,
  volumePitchFull: 48,
  /** Dynamic pitch curve for 2D → 3D spatial transition (hint only). */
  spatialPitchAtZoomStart: 22,
  spatialPitchAtZoomFull: 52,
  spatialPitchZoomStart: 13.2,
  spatialPitchZoomFull: 15.6,
} as const;

export function computeVolumePresence(zoom: number, pitchDegrees: number): number {
  const {
    volumeZoomStart,
    volumeZoomFull,
    volumePitchStart,
    volumePitchFull,
  } = LIFE_MAP_PREMIUM_CAMERA;
  const zoomT = Math.min(
    1,
    Math.max(0, (zoom - volumeZoomStart) / (volumeZoomFull - volumeZoomStart)),
  );
  const pitchT = Math.min(
    1,
    Math.max(
      0,
      (pitchDegrees - volumePitchStart) /
        (volumePitchFull - volumePitchStart),
    ),
  );
  // Approach (zoom) leads; pitch supports cinematic volume.
  return Math.min(1, zoomT * 0.75 + pitchT * 0.35);
}

/**
 * Target pitch for fluid MapLibre → Three world feel (zoom-dependent).
 */
export function computeSpatialPitchDegrees(zoom: number): number {
  const {
    spatialPitchAtZoomStart,
    spatialPitchAtZoomFull,
    spatialPitchZoomStart,
    spatialPitchZoomFull,
  } = LIFE_MAP_PREMIUM_CAMERA;
  const t = Math.min(
    1,
    Math.max(
      0,
      (zoom - spatialPitchZoomStart) /
        (spatialPitchZoomFull - spatialPitchZoomStart),
    ),
  );
  // Smoothstep easing — cinematic, mobile-friendly.
  const eased = t * t * (3 - 2 * t);
  return (
    spatialPitchAtZoomStart +
    (spatialPitchAtZoomFull - spatialPitchAtZoomStart) * eased
  );
}
