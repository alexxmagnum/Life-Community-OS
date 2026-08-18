/**
 * Life Map premium visual system — self-hosted community basemap.
 *
 * Hierarchy: owned GeoJSON territory → Locations → optional Three places.
 * No Mapbox / MapTiler / ESRI tiles. No API keys required to boot.
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

/** Soft lifestyle ground — the canvas under owned territory GeoJSON. */
export const LIFE_MAP_PREMIUM_TERRAIN = {
  background: "#e7efe4",
  backgroundDeep: "#d5e2d0",
} as const;

/**
 * Layer palette — Apple Maps / lifestyle community, not CAD/GIS.
 */
export const LIFE_MAP_PREMIUM_PALETTE = {
  water: "#7eb8d4",
  waterDeep: "#5a9ab8",
  green: "#8fbc7a",
  greenDeep: "#6f9a5c",
  roadsPrimary: "#f7f4ee",
  roadsSecondary: "#efeae2",
  roadsEdge: "#c8c0b4",
  buildings: "#d8d2c8",
  buildingsOutline: "#b0a898",
  buildingsHover: "#e4ded4",
  buildingsSelected: "#3aa8a0",
  boundary: "#9a9288",
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
 * Self-hosted MapLibre style — zero tile providers, zero API keys.
 *
 * Territory geometry (roads / buildings / water / green) is injected by the
 * binder from tenant GeoJSON. Optional glyphs CDN is fonts-only (no map tiles).
 */
export const LIFE_MAP_PREMIUM_STYLE: StyleSpecification = {
  version: 8,
  name: "life-map-community",
  // Fonts for optional object labels — not a commercial map tile vendor.
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {},
  layers: [
    {
      id: "lm-community-ground",
      type: "background",
      paint: {
        "background-color": LIFE_MAP_PREMIUM_TERRAIN.background,
      },
    },
  ],
};

/**
 * Resolve the product basemap. Always self-hosted — ignores commercial keys.
 */
export function resolveLifeMapBasemapStyle(): StyleSpecification {
  return LIFE_MAP_PREMIUM_STYLE;
}

/** @deprecated Alias of {@link LIFE_MAP_PREMIUM_STYLE} — no external imagery. */
export const LIFE_MAP_EARTH_STYLE: StyleSpecification = LIFE_MAP_PREMIUM_STYLE;

/** @deprecated Debug alias — same self-hosted style (no demotiles map). */
export const MAPLIBRE_TECHNICAL_PREVIEW_STYLE: StyleSpecification =
  LIFE_MAP_PREMIUM_STYLE;

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
      14,
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
      16.5,
      [
        "match",
        ["get", "highway"],
        "residential",
        4.2,
        "unclassified",
        4.8,
        "service",
        2.4,
        "path",
        1.6,
        3.4,
      ],
    ],
    "line-opacity": 0.95,
    "line-blur": 0.35,
  };
}

export function premiumBoundaryPaint(): LinePaint {
  return {
    "line-color": LIFE_MAP_PREMIUM_PALETTE.boundary,
    "line-width": 1.4,
    "line-opacity": 0.45,
    "line-dasharray": [1.5, 1.25],
  };
}

export function premiumWaterPaint(): FillPaint {
  return {
    "fill-color": LIFE_MAP_PREMIUM_PALETTE.water,
    "fill-opacity": 0.9,
    "fill-outline-color": LIFE_MAP_PREMIUM_PALETTE.waterDeep,
  };
}

export function premiumGreenPaint(): FillPaint {
  return {
    "fill-color": LIFE_MAP_PREMIUM_PALETTE.green,
    "fill-opacity": 0.78,
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
  /** Extra breathing room around territory bounds (tooling only). */
  fitPaddingPx: 72,
  /** Neighborhood → street discovery range. */
  maxFitZoom: 19.2,
  openDurationMs: 1100,
  hybridPitchDegrees: 52,
  hybridPitchDurationMs: 1600,
  /** Recognizable Panorámica — owned territory GeoJSON as the living map. */
  communityFocusZoom: 15.85,
  communityFocusPitch: 48,
  communityFocusBearing: -18,
  explorationMinZoom: 14.2,
  explorationMaxZoom: 18.8,
  entranceStartZoomDelta: 0.9,
  entranceStartPitch: 32,
  entranceStartBearingOffset: -6,
  entranceDurationMs: 1700,
  /** Volume presence — places rise as we enter the living zone. */
  volumeZoomStart: 14.5,
  volumeZoomFull: 16.8,
  volumePitchStart: 20,
  volumePitchFull: 50,
  spatialPitchAtZoomStart: 28,
  spatialPitchAtZoomFull: 55,
  spatialPitchZoomStart: 14.8,
  spatialPitchZoomFull: 17.2,
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
