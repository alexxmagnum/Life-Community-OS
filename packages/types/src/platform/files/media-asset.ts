import type { DomainId, IsoDateTimeString } from "../../domain/ids";
import type { FileReference, FileType } from "./file-reference";

/**
 * Media Platform — one file record for the whole product (Phase 10).
 *
 * FileReference (ADR-020) remains the delivery contract.
 * MediaAsset is the persistence SoT: ownership, storage_key, status.
 * Domain modules must not invent BusinessImages / HousingImages tables.
 */

export const MEDIA_ASSET_TYPES = [
  "image",
  "video",
  "document",
  "file",
  "avatar",
  "attachment",
] as const;

export type MediaAssetType = (typeof MEDIA_ASSET_TYPES)[number];

export const MEDIA_ASSET_STATUSES = [
  "pending",
  "ready",
  "failed",
  "deleted",
] as const;

export type MediaAssetStatus = (typeof MEDIA_ASSET_STATUSES)[number];

export const MEDIA_ENTITY_TYPES = [
  "business",
  "property",
  "listing",
  "message",
  "event",
  "profile",
  "resource",
  "experience",
  "location",
] as const;

export type MediaEntityType = (typeof MEDIA_ENTITY_TYPES)[number];

export const MEDIA_PURPOSES = [
  "cover",
  "gallery",
  "avatar",
  "attachment",
] as const;

export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export type MediaAsset = {
  id: DomainId;
  tenantId: DomainId;
  /** Inherited from the related entity / active Territory. Additive. */
  territoryId?: DomainId;
  ownerPersonId: DomainId;
  createdBy: DomainId;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
  type: MediaAssetType;
  status: MediaAssetStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type MediaReference = {
  id: DomainId;
  tenantId: DomainId;
  createdBy: DomainId;
  mediaId: DomainId;
  entityType: MediaEntityType;
  entityId: DomainId;
  purpose: MediaPurpose;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type MediaAssetIssueCode =
  | "missing_id"
  | "missing_tenant_id"
  | "missing_owner"
  | "missing_created_by"
  | "missing_storage_key"
  | "missing_filename"
  | "missing_mime_type"
  | "invalid_size"
  | "invalid_type"
  | "invalid_status";

export type MediaAssetIssue = {
  code: MediaAssetIssueCode;
  message: string;
  field?: keyof MediaAsset;
};

const TYPE_SET: ReadonlySet<string> = new Set(MEDIA_ASSET_TYPES);
const STATUS_SET: ReadonlySet<string> = new Set(MEDIA_ASSET_STATUSES);
const ENTITY_SET: ReadonlySet<string> = new Set(MEDIA_ENTITY_TYPES);
const PURPOSE_SET: ReadonlySet<string> = new Set(MEDIA_PURPOSES);

export function isMediaAssetType(value: string): value is MediaAssetType {
  return TYPE_SET.has(value);
}

export function isMediaAssetStatus(value: string): value is MediaAssetStatus {
  return STATUS_SET.has(value);
}

export function isMediaEntityType(value: string): value is MediaEntityType {
  return ENTITY_SET.has(value);
}

export function isMediaPurpose(value: string): value is MediaPurpose {
  return PURPOSE_SET.has(value);
}

export function isPublicMediaPurpose(purpose: MediaPurpose): boolean {
  return purpose === "cover" || purpose === "gallery" || purpose === "avatar";
}

function cryptoRandomId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createMediaAsset(input: {
  tenantId: DomainId;
  ownerPersonId: DomainId;
  createdBy: DomainId;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
  type: MediaAssetType;
  status?: MediaAssetStatus;
  territoryId?: DomainId;
  id?: DomainId;
}): MediaAsset {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || `media-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    ownerPersonId: input.ownerPersonId.trim(),
    createdBy: input.createdBy.trim(),
    storageKey: input.storageKey.trim(),
    filename: input.filename.trim() || "file",
    mimeType: input.mimeType.trim() || "application/octet-stream",
    size: input.size,
    type: input.type,
    status: input.status ?? "pending",
    createdAt: now,
    updatedAt: now,
    ...(input.territoryId?.trim()
      ? { territoryId: input.territoryId.trim() }
      : {}),
  };
}

export function createMediaReference(input: {
  tenantId: DomainId;
  createdBy: DomainId;
  mediaId: DomainId;
  entityType: MediaEntityType;
  entityId: DomainId;
  purpose: MediaPurpose;
  id?: DomainId;
}): MediaReference {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || `mref-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    createdBy: input.createdBy.trim(),
    mediaId: input.mediaId.trim(),
    entityType: input.entityType,
    entityId: input.entityId.trim(),
    purpose: input.purpose,
    createdAt: now,
    updatedAt: now,
  };
}

export function validateMediaAsset(asset: MediaAsset): MediaAssetIssue[] {
  const issues: MediaAssetIssue[] = [];
  if (!asset.id?.trim()) {
    issues.push({
      code: "missing_id",
      message: "MediaAsset requires id.",
      field: "id",
    });
  }
  if (!asset.tenantId?.trim()) {
    issues.push({
      code: "missing_tenant_id",
      message: "MediaAsset requires tenantId.",
      field: "tenantId",
    });
  }
  if (!asset.ownerPersonId?.trim()) {
    issues.push({
      code: "missing_owner",
      message: "MediaAsset requires ownerPersonId.",
      field: "ownerPersonId",
    });
  }
  if (!asset.createdBy?.trim()) {
    issues.push({
      code: "missing_created_by",
      message: "MediaAsset requires createdBy.",
      field: "createdBy",
    });
  }
  if (!asset.storageKey?.trim()) {
    issues.push({
      code: "missing_storage_key",
      message: "MediaAsset requires storageKey.",
      field: "storageKey",
    });
  }
  if (!asset.filename?.trim()) {
    issues.push({
      code: "missing_filename",
      message: "MediaAsset requires filename.",
      field: "filename",
    });
  }
  if (!asset.mimeType?.trim()) {
    issues.push({
      code: "missing_mime_type",
      message: "MediaAsset requires mimeType.",
      field: "mimeType",
    });
  }
  if (!Number.isFinite(asset.size) || asset.size < 0) {
    issues.push({
      code: "invalid_size",
      message: "size must be a non-negative finite number.",
      field: "size",
    });
  }
  if (!isMediaAssetType(asset.type)) {
    issues.push({
      code: "invalid_type",
      message: "MediaAsset requires a valid type.",
      field: "type",
    });
  }
  if (!isMediaAssetStatus(asset.status)) {
    issues.push({
      code: "invalid_status",
      message: "MediaAsset requires a valid status.",
      field: "status",
    });
  }
  return issues;
}

export function mediaAssetTypeFromMime(
  mimeType: string,
  preferred?: MediaAssetType,
): MediaAssetType {
  if (preferred && isMediaAssetType(preferred)) return preferred;
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || mime.startsWith("text/")) return "document";
  return "file";
}

function fileTypeFromMedia(asset: MediaAsset): FileType {
  if (asset.type === "video" || asset.mimeType.toLowerCase().startsWith("video/")) {
    return "video";
  }
  if (
    asset.type === "document" ||
    asset.type === "file" ||
    asset.mimeType.toLowerCase() === "application/pdf" ||
    asset.mimeType.toLowerCase().startsWith("text/")
  ) {
    return "document";
  }
  return "image";
}

/**
 * Delivery contract for UI / pipeline — does not replace MediaAsset persistence.
 */
export function mediaAssetToFileReference(asset: MediaAsset): FileReference {
  const status =
    asset.status === "ready"
      ? "ready"
      : asset.status === "deleted"
        ? "deleted"
        : asset.status === "failed"
          ? "archived"
          : "temporary";
  return {
    id: asset.id,
    tenantId: asset.tenantId,
    fileType: fileTypeFromMedia(asset),
    status,
    mimeType: asset.mimeType,
    sizeBytes: asset.size,
    variants: [
      {
        kind: "optimized",
        sizeBytes: asset.size,
        format: asset.mimeType.split("/")[1] || "bin",
        storageKey: asset.storageKey,
      },
    ],
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}
