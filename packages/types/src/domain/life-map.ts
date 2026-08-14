import type { DomainId } from "./ids";

/**
 * Life Map — spatial digital twin contracts (platform foundation).
 *
 * Life Map is a spatial representation layer over Territory. It projects
 * existing Business Domains (Housing, Experiences, Services, Community,
 * Resources, Official) into space. It is never the source of truth.
 *
 * Twin reflects reality; domains define reality.
 *
 * Tenant-neutral — no Life Panoramica catalogs, geometry, or branding here.
 * No map SDK, UI, or routes in this module.
 */

// ── Position & camera ────────────────────────────────────────

/** WGS84 geographic position (future Near / map providers). */
export type LifeMapGeoPosition = {
  lat: number;
  lng: number;
  /** Optional altitude in meters. */
  altitudeMeters?: number;
};

/**
 * Local spatial anchor inside a tenant-defined space
 * (resort mesh, indoor plan, etc.) — not a map-vendor id.
 */
export type LifeMapLocalAnchor = {
  kind: "local";
  spaceId: string;
  x: number;
  y: number;
  z?: number;
};

export type LifeMapPosition = LifeMapGeoPosition | LifeMapLocalAnchor;

/** Optional future geographic bounds for framing a territory. */
export type LifeMapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** Initial / default camera for a territory viewport. */
export type LifeMapCameraPose = {
  /** Look-at or orbit target. */
  target: LifeMapPosition;
  /** Distance / zoom hint (unit depends on renderer — opaque for now). */
  distance?: number;
  headingDegrees?: number;
  pitchDegrees?: number;
};

// ── Layers ───────────────────────────────────────────────────

/**
 * Well-known layer ids that project existing SaaS modules.
 * Tenants may enable a subset; additional custom ids remain strings.
 */
export type LifeMapLayerId =
  | "housing"
  | "services"
  | "experiences"
  | "community"
  | "resources"
  | "official"
  | (string & {});

export const LIFE_MAP_LAYER_IDS: readonly LifeMapLayerId[] = [
  "housing",
  "services",
  "experiences",
  "community",
  "resources",
  "official",
] as const;

/**
 * One projection layer over a territory.
 * Visibility and AuthZ are evaluated by platform gates — not by this type alone.
 */
export type LifeMapLayer = {
  id: LifeMapLayerId;
  /**
   * Platform module registry id that owns the projected domain data
   * (e.g. "housing", "experiences", "services").
   */
  sourceModuleId: string;
  /** Default visibility when the layer is enabled for the territory. */
  visible: boolean;
  /**
   * Capability key required to view this layer
   * (ADR-012 — evaluated by Core RBAC, not hardcoded in UI).
   */
  requiredCapability: string;
  /**
   * When true, the source module must also be tenant-enabled (ADR-023).
   * Default expectation for all domain layers.
   */
  requiresModuleEnabled?: boolean;
  label?: string;
  order?: number;
};

// ── Objects ──────────────────────────────────────────────────

export type LifeMapObjectType =
  | "experience"
  | "place"
  | "service"
  | "housing"
  | "resource"
  | "community"
  | "official"
  | "poi"
  | "decoration";

export const LIFE_MAP_OBJECT_TYPES: readonly LifeMapObjectType[] = [
  "experience",
  "place",
  "service",
  "housing",
  "resource",
  "community",
  "official",
  "poi",
  "decoration",
] as const;

/**
 * Opaque lifecycle/state label for spatial presentation.
 * Domain status remains authoritative on the referenced entity.
 */
export type LifeMapObjectState =
  | "idle"
  | "active"
  | "full"
  | "unavailable"
  | "hidden"
  | (string & {});

/**
 * Pointer back to the authoritative domain entity.
 * Life Map never replaces this record.
 */
export type LifeMapDomainRef = {
  /** Platform module id that owns the entity. */
  moduleId: string;
  /** Domain aggregate id (listing, experience, place, …). */
  entityId: DomainId;
  /** Optional discriminator for multi-type modules. */
  entityKind?: string;
};

/**
 * Spatial representation of a domain entity (or decorative anchor).
 * Not a Business Domain root — derived projection only.
 */
export type LifeMapObject = {
  tenantId: DomainId;
  territoryId: DomainId;
  objectId: DomainId;
  type: LifeMapObjectType;
  /** Layer this object belongs to for filtering / AuthZ. */
  layerId: LifeMapLayerId;
  /** Authoritative domain reference — required for actionable objects. */
  ref?: LifeMapDomainRef;
  position: LifeMapPosition;
  /**
   * Optional 3D asset registry key (`AssetKey` string).
   * Resolved by `@life-community-os/assets` at render time — not stored as binary.
   */
  asset3DKey?: string;
  state: LifeMapObjectState;
  /** Actions the actor may attempt; final AuthZ is domain + RBAC. */
  availableActions: LifeMapActionKind[];
  label?: string;
  communityAreaId?: DomainId;
};

// ── Interactions ─────────────────────────────────────────────

export type LifeMapActionKind =
  | "open"
  | "join"
  | "reserve"
  | "message"
  | "navigate";

export const LIFE_MAP_ACTION_KINDS: readonly LifeMapActionKind[] = [
  "open",
  "join",
  "reserve",
  "message",
  "navigate",
] as const;

/**
 * Intent raised from the spatial layer.
 * Handlers must route to the owning domain (and Conversation adapters when messaging).
 */
export type LifeMapInteraction = {
  tenantId: DomainId;
  territoryId: DomainId;
  actorPersonId: DomainId;
  objectId: DomainId;
  action: LifeMapActionKind;
  /**
   * Echo of the domain ref at interaction time (avoids stale map-only ids).
   * Prefer resolving from LifeMapObject.ref when present.
   */
  ref?: LifeMapDomainRef;
};

// ── Territory viewport ───────────────────────────────────────

/**
 * Coordinate reference system for geo positions / bounds on a territory.
 * `"local"` means positions use LifeMapLocalAnchor spaces only.
 */
export type LifeMapCoordinateReferenceSystem =
  | "WGS84"
  | "local"
  | (string & {});

/**
 * Physical / cartographic base layer kinds — not Life OS product modules.
 * Kept separate from {@link LifeMapLayerId}.
 */
export type LifeMapBaseLayerType =
  | "terrain"
  | "roads"
  | "buildings"
  | "water"
  | "green"
  | "boundary"
  | "custom";

export const LIFE_MAP_BASE_LAYER_TYPES: readonly LifeMapBaseLayerType[] = [
  "terrain",
  "roads",
  "buildings",
  "water",
  "green",
  "boundary",
  "custom",
] as const;

/**
 * How `dataRef` is interpreted — never a map-vendor SDK name.
 * Adapters map these to concrete loaders later.
 */
export type LifeMapBaseLayerSourceType =
  | "uri"
  | "asset_key"
  | "vector"
  | "raster"
  | "mesh"
  | "unknown"
  | (string & {});

/**
 * Opaque presentation hints for a base layer.
 * No vendor style documents, tokens, or provider ids.
 */
export type LifeMapBaseLayerStyle = {
  opacity?: number;
  /** Design-token key or semantic accent — not a hex brand lock. */
  accentToken?: string;
};

/**
 * Physical territory base layer — independent of Life OS product layers.
 *
 * `dataRef` is an opaque resource reference (e.g. `tenant://…/terrain/main`).
 * It must not embed SDK providers, API tokens, or map-vendor config.
 */
export type LifeMapBaseLayer = {
  id: string;
  territoryId: DomainId;
  type: LifeMapBaseLayerType;
  visible: boolean;
  /** Draw / composite order (lower under higher). */
  zIndex: number;
  /** Opaque data pointer — never an SDK provider or secret. */
  dataRef: string;
  sourceType: LifeMapBaseLayerSourceType;
  label?: string;
  style?: LifeMapBaseLayerStyle;
};

export function isLifeMapBaseLayerType(
  value: string,
): value is LifeMapBaseLayerType {
  return (LIFE_MAP_BASE_LAYER_TYPES as readonly string[]).includes(value);
}

/**
 * Visual territory frame for Life Map.
 * One tenant territory → one spatial twin context.
 *
 * Product layers (`layers`) project Business Domains.
 * Base layers (`baseLayers`) describe the physical world — never mix the two.
 */
export type LifeMapTerritory = {
  tenantId: DomainId;
  territoryId: DomainId;
  /** Initial camera for the spatial viewport. */
  defaultCamera: LifeMapCameraPose;
  /**
   * Explicit CRS for geo positions / bounds when present.
   * Optional for backward compatibility; prefer setting when geo data exists.
   */
  crs?: LifeMapCoordinateReferenceSystem;
  /** Geographic framing — optional until real coords are populated. */
  bounds?: LifeMapBounds;
  /** Life OS product layers (housing, experiences, …). */
  layers: LifeMapLayer[];
  /**
   * Physical base layers (terrain, roads, …).
   * Optional / empty until the tenant supplies real data refs.
   */
  baseLayers?: LifeMapBaseLayer[];
  /**
   * Module must be tenant-enabled (premium). When false, surfaces and APIs fail closed.
   */
  moduleEnabled: boolean;
};
