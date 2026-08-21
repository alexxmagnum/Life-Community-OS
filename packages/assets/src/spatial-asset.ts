/**
 * SpatialAsset — platform 3D twin library contract.
 *
 * Assets are global (tenant-neutral). TerritoryObject holds coordinates.
 * Never import GLB files from React components — resolve through the registry.
 *
 * Units: metres. Pivot: ground bottom-center. Scale 1 = authored size.
 */

export const SPATIAL_ASSET_CATEGORIES = [
  "security",
  "mobility",
  "sport",
  "hospitality",
  "residential",
  "nature",
  "facility",
] as const;

export type SpatialAssetCategory = (typeof SPATIAL_ASSET_CATEGORIES)[number];

export const SPATIAL_ASSET_FORMATS = ["glb", "gltf"] as const;

export type SpatialAssetFormat = (typeof SPATIAL_ASSET_FORMATS)[number];

/** 0 = street detail, 1 = medium, 2 = far landmark massing. */
export type SpatialAssetLodLevel = 0 | 1 | 2;

export type SpatialAssetLodEntry = {
  level: SpatialAssetLodLevel;
  url: string;
};

export type SpatialAssetMetadata = {
  /** Always metres for Life Map Digital Twin. */
  units: "meters";
  /** Ground contact — TerritoryObject.position maps to this pivot. */
  pivot: "bottom-center";
  footprintMeters: { x: number; z: number };
  heightMeters: number;
  /** Platform assets are null. Tenant-scoped branding meshes would set this. */
  tenantId: string | null;
  /** Prepared — not enabled until meshes need it. */
  compression: "none" | "draco";
  style: "premium-hospitality";
};

export type SpatialAsset = {
  id: string;
  name: string;
  category: SpatialAssetCategory;
  format: SpatialAssetFormat;
  /** Default (LOD0) url under /assets/3d/. */
  url: string;
  /** Uniform authored scale. 1 = real-world metres. */
  scale: number;
  lod: readonly SpatialAssetLodEntry[];
  metadata: SpatialAssetMetadata;
};

export type SpatialAssetIssueCode =
  | "missing_id"
  | "unknown_category"
  | "invalid_format"
  | "unsafe_url"
  | "missing_lod"
  | "tenant_mismatch"
  | "invalid_scale";

export type SpatialAssetIssue = {
  code: SpatialAssetIssueCode;
  message: string;
};

const ASSET_ROOT = "/assets/3d/";

export function isSpatialAssetCategory(
  value: string,
): value is SpatialAssetCategory {
  return (SPATIAL_ASSET_CATEGORIES as readonly string[]).includes(value);
}

export function isSafeSpatialAssetUrl(url: string): boolean {
  if (!url.startsWith(ASSET_ROOT)) return false;
  if (url.includes("..")) return false;
  if (/^https?:\/\//i.test(url)) return false;
  const lower = url.toLowerCase();
  return lower.endsWith(".glb") || lower.endsWith(".gltf");
}

export function validateSpatialAsset(
  asset: SpatialAsset,
  expectedTenantId?: string,
): SpatialAssetIssue[] {
  const issues: SpatialAssetIssue[] = [];
  if (!asset.id?.trim()) {
    issues.push({ code: "missing_id", message: "SpatialAsset.id is required." });
  }
  if (!isSpatialAssetCategory(asset.category)) {
    issues.push({
      code: "unknown_category",
      message: `Unknown category "${String(asset.category)}".`,
    });
  }
  if (!(SPATIAL_ASSET_FORMATS as readonly string[]).includes(asset.format)) {
    issues.push({
      code: "invalid_format",
      message: "format must be glb or gltf.",
    });
  }
  if (!isSafeSpatialAssetUrl(asset.url)) {
    issues.push({
      code: "unsafe_url",
      message: "url must be a first-party /assets/3d/ glb or gltf path.",
    });
  }
  if (!asset.lod?.length) {
    issues.push({
      code: "missing_lod",
      message: "At least one LOD url is required.",
    });
  } else {
    for (const entry of asset.lod) {
      if (!isSafeSpatialAssetUrl(entry.url)) {
        issues.push({
          code: "unsafe_url",
          message: `LOD${entry.level} url is unsafe.`,
        });
      }
    }
  }
  if (!(typeof asset.scale === "number" && Number.isFinite(asset.scale) && asset.scale > 0)) {
    issues.push({
      code: "invalid_scale",
      message: "scale must be a positive finite number (metres, 1 = authored).",
    });
  }
  if (
    expectedTenantId &&
    asset.metadata.tenantId &&
    asset.metadata.tenantId !== expectedTenantId
  ) {
    issues.push({
      code: "tenant_mismatch",
      message: "SpatialAsset is scoped to another tenant.",
    });
  }
  return issues;
}

/**
 * Pick a LOD url from zoom. Low zoom never returns a GLB (caller must skip).
 * Mid zoom → LOD2, high → LOD1, street → LOD0.
 */
export function selectSpatialAssetLodUrl(
  asset: SpatialAsset,
  zoom: number,
): { level: SpatialAssetLodLevel; url: string } | null {
  if (!Number.isFinite(zoom)) return null;
  let level: SpatialAssetLodLevel;
  if (zoom >= 17.75) level = 0;
  else if (zoom >= 16.45) level = 1;
  else if (zoom >= 14.85) level = 2;
  else return null;

  const exact = asset.lod.find((entry) => entry.level === level);
  if (exact) return exact;
  const fallback = [...asset.lod].sort((a, b) => b.level - a.level)[0];
  return fallback ?? { level: 0, url: asset.url };
}
