/**
 * Spatial Asset Library — SaaS platform vocabulary for Life Map.
 *
 * Tenant-neutral taxonomy that feeds `LifeMapObject.asset3DKey`.
 * No binary payloads, no Panoramica catalogs, no GLB files here.
 *
 * Extends (does not replace) the shared Asset Registry in this package.
 */

import type {
  AssetSpatialAnchor,
  AssetSpatialLodLevel,
  AssetSpatialScale,
  SpatialAssetType,
} from "./types";

// ── Library categories ───────────────────────────────────────

/**
 * Canonical spatial library categories (platform-wide).
 * Independent from UI domains (professionals, sports, …).
 */
export type SpatialLibraryCategory =
  | "terrain"
  | "building"
  | "place"
  | "mobility"
  | "community"
  | "recreation"
  | "nature"
  | "avatar"
  | "utility";

export const SPATIAL_LIBRARY_CATEGORIES: readonly SpatialLibraryCategory[] = [
  "terrain",
  "building",
  "place",
  "mobility",
  "community",
  "recreation",
  "nature",
  "avatar",
  "utility",
] as const;

// ── Subtypes (extensible per category) ───────────────────────

export type SpatialBuildingSubtype =
  | "house"
  | "apartment"
  | "commercial"
  | "clubhouse";

export type SpatialPlaceSubtype =
  | "restaurant"
  | "cafe"
  | "shop"
  | "service_point";

export type SpatialRecreationSubtype =
  | "golf"
  | "pool"
  | "tennis"
  | "padel";

export type SpatialMobilitySubtype =
  | "parking"
  | "path"
  | "transit_stop"
  | "ev_charging";

export type SpatialCommunitySubtype =
  | "plaza"
  | "gathering"
  | "channel_anchor"
  | "neighbourhood";

export type SpatialNatureSubtype =
  | "tree"
  | "garden"
  | "water"
  | "landscape";

export type SpatialTerrainSubtype =
  | "ground"
  | "hill"
  | "coast"
  | "green";

export type SpatialAvatarSubtype =
  | "resident"
  | "guest"
  | "staff"
  | "generic";

export type SpatialUtilitySubtype =
  | "signage"
  | "light"
  | "bench"
  | "infra";

/**
 * Well-known subtypes across the library.
 * Custom subtype strings remain allowed via `(string & {})`.
 */
export type SpatialLibrarySubtype =
  | SpatialBuildingSubtype
  | SpatialPlaceSubtype
  | SpatialRecreationSubtype
  | SpatialMobilitySubtype
  | SpatialCommunitySubtype
  | SpatialNatureSubtype
  | SpatialTerrainSubtype
  | SpatialAvatarSubtype
  | SpatialUtilitySubtype
  | (string & {});

export const SPATIAL_LIBRARY_SUBTYPES_BY_CATEGORY: Readonly<
  Record<SpatialLibraryCategory, readonly string[]>
> = {
  terrain: ["ground", "hill", "coast", "green"],
  building: ["house", "apartment", "commercial", "clubhouse"],
  place: ["restaurant", "cafe", "shop", "service_point"],
  mobility: ["parking", "path", "transit_stop", "ev_charging"],
  community: ["plaza", "gathering", "channel_anchor", "neighbourhood"],
  recreation: ["golf", "pool", "tennis", "padel"],
  nature: ["tree", "garden", "water", "landscape"],
  avatar: ["resident", "guest", "staff", "generic"],
  utility: ["signage", "light", "bench", "infra"],
};

// ── Behaviour & interaction ──────────────────────────────────

/** How the asset behaves in the twin (presentation, not AuthZ). */
export type AssetSpatialBehaviour =
  | "static"
  | "ambient"
  | "interactive"
  | "animated"
  | (string & {});

/**
 * Interaction affordance advertised by the asset template.
 * Final AuthZ stays on domain + RBAC; this is presentation capability only.
 */
export type AssetSpatialInteractionCapability =
  | "none"
  | "open"
  | "navigate"
  | "message"
  | "join"
  | "reserve"
  | (string & {});

export const ASSET_SPATIAL_BEHAVIOURS: readonly AssetSpatialBehaviour[] = [
  "static",
  "ambient",
  "interactive",
  "animated",
] as const;

export const ASSET_SPATIAL_INTERACTIONS: readonly AssetSpatialInteractionCapability[] =
  ["none", "open", "navigate", "message", "join", "reserve"] as const;

// ── Library entry contract ───────────────────────────────────

/**
 * Platform spatial library entry — language for reusable twin objects.
 * Does not store binaries; `assetKey` points into the Asset Registry.
 */
export type SpatialLibraryEntry = {
  /** Registry key consumed by `LifeMapObject.asset3DKey`. */
  assetKey: string;
  category: SpatialLibraryCategory;
  subtype?: SpatialLibrarySubtype;
  /**
   * Registry type slot (`spatial_object` | `terrain` | `building` | `avatar`).
   * Defaults from category when omitted at key-build time.
   */
  registryType: SpatialAssetType;
  behaviour?: AssetSpatialBehaviour;
  interaction?: AssetSpatialInteractionCapability;
  scale?: AssetSpatialScale;
  anchor?: AssetSpatialAnchor;
  lod?: readonly AssetSpatialLodLevel[];
  /** Optional human label for tooling — not tenant copy. */
  label?: string;
};

export type SpatialAssetKeyParts = {
  category: SpatialLibraryCategory;
  /** Subtype or stable id segment (e.g. house, golf, restaurant). */
  id: string;
  /**
   * Registry AssetType for the key suffix.
   * Defaults via {@link defaultSpatialRegistryTypeForCategory}.
   */
  registryType?: SpatialAssetType;
};

/**
 * Map library category → default SpatialAssetType in the registry.
 */
export function defaultSpatialRegistryTypeForCategory(
  category: SpatialLibraryCategory,
): SpatialAssetType {
  switch (category) {
    case "terrain":
      return "terrain";
    case "building":
      return "building";
    case "avatar":
      return "avatar";
    default:
      return "spatial_object";
  }
}

/**
 * Build a platform spatial AssetKey for LifeMapObject.asset3DKey.
 * Shape: `{category}.{id}.{registryType}` — SaaS-neutral, no tenant slug.
 *
 * @example
 * buildSpatialAssetKey({ category: "building", id: "house" })
 * // → "building.house.building"
 * buildSpatialAssetKey({ category: "place", id: "restaurant" })
 * // → "place.restaurant.spatial_object"
 * buildSpatialAssetKey({ category: "recreation", id: "golf" })
 * // → "recreation.golf.spatial_object"
 */
export function buildSpatialAssetKey(parts: SpatialAssetKeyParts): string {
  const registryType =
    parts.registryType ?? defaultSpatialRegistryTypeForCategory(parts.category);
  const id = parts.id.trim().toLowerCase().replace(/\s+/g, "-");
  if (!id) {
    throw new Error("[spatial-library] id is required to build an asset key");
  }
  return `${parts.category}.${id}.${registryType}`;
}

export function isSpatialLibraryCategory(
  value: string,
): value is SpatialLibraryCategory {
  return (SPATIAL_LIBRARY_CATEGORIES as readonly string[]).includes(value);
}

export function listSpatialLibrarySubtypes(
  category: SpatialLibraryCategory,
): readonly string[] {
  return SPATIAL_LIBRARY_SUBTYPES_BY_CATEGORY[category];
}

export function isKnownSpatialLibrarySubtype(
  category: SpatialLibraryCategory,
  subtype: string,
): boolean {
  return SPATIAL_LIBRARY_SUBTYPES_BY_CATEGORY[category].includes(subtype);
}

/**
 * Soft structural check for library-oriented spatial metadata.
 * Unknown subtypes are allowed (extensibility); empty category fails.
 */
export function validateSpatialLibraryMetadata(input: {
  category?: string;
  subtype?: string;
  behaviour?: string;
  interaction?: string;
}): { ok: true } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  if (!input.category || !input.category.trim()) {
    issues.push("category is required");
  } else if (!isSpatialLibraryCategory(input.category)) {
    issues.push(`unknown spatial library category: ${input.category}`);
  }
  if (
    input.category &&
    isSpatialLibraryCategory(input.category) &&
    input.subtype &&
    !isKnownSpatialLibrarySubtype(input.category, input.subtype)
  ) {
    // Extensible — warn-level only via issue code prefix, still ok.
  }
  if (
    input.behaviour &&
    !(ASSET_SPATIAL_BEHAVIOURS as readonly string[]).includes(input.behaviour) &&
    input.behaviour.length === 0
  ) {
    issues.push("behaviour must be non-empty when set");
  }
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true };
}

/**
 * Compose a SpatialLibraryEntry descriptor (no registry registration).
 */
export function defineSpatialLibraryEntry(input: {
  category: SpatialLibraryCategory;
  id: string;
  subtype?: SpatialLibrarySubtype;
  registryType?: SpatialAssetType;
  behaviour?: AssetSpatialBehaviour;
  interaction?: AssetSpatialInteractionCapability;
  scale?: AssetSpatialScale;
  anchor?: AssetSpatialAnchor;
  lod?: readonly AssetSpatialLodLevel[];
  label?: string;
}): SpatialLibraryEntry {
  const registryType =
    input.registryType ?? defaultSpatialRegistryTypeForCategory(input.category);
  return {
    assetKey: buildSpatialAssetKey({
      category: input.category,
      id: input.id,
      registryType,
    }),
    category: input.category,
    subtype: input.subtype ?? input.id,
    registryType,
    behaviour: input.behaviour ?? "static",
    interaction: input.interaction ?? "open",
    scale: input.scale,
    anchor: input.anchor ?? "bottom",
    lod: input.lod,
    label: input.label,
  };
}
