import type { DomainId, IsoDateTimeString } from "../../domain/ids";
import type { FileVariant } from "./file-variant";
import { validateFileVariant } from "./file-variant";

/**
 * Core Files — FileReference (ADR-020 / D.0.5c).
 *
 * Domain entities (Messages, residency evidence, …) store references only.
 * Physical storage / CDN / upload pipelines are out of scope for this slice.
 *
 * Lifecycle: temporary → processing → ready → archived → deleted
 * (aligns with ADR-020 temporary → active → archived → trash → deleted;
 *  "ready" is the serveable state formerly called active).
 */

export const FILE_TYPES = ["image", "video", "document"] as const;

export type FileType = (typeof FILE_TYPES)[number];

export const FILE_REFERENCE_STATUSES = [
  "temporary",
  "processing",
  "ready",
  "archived",
  "deleted",
] as const;

export type FileReferenceStatus = (typeof FILE_REFERENCE_STATUSES)[number];

/**
 * Owning domain context — enables module OFF / conversation retention cleanup.
 * Opaque to storage providers; required for fail-closed projection.
 */
export type FileOwnerContext = {
  /** Platform Module Registry id — OFF hides references. */
  moduleId: string;
  /** Conversation context type when communication-owned (extensible). */
  contextType?: string;
  contextId?: DomainId;
  conversationId?: DomainId;
  messageId?: DomainId;
  retentionPolicyId?: DomainId;
  /** Ephemeral media TTL in days (7 / 30 / custom) — policy-driven. */
  ephemeralTtlDays?: number;
};

export type FileReference = {
  id: DomainId;
  tenantId: DomainId;
  ownerContext?: FileOwnerContext;
  fileType: FileType;
  status: FileReferenceStatus;
  mimeType: string;
  sizeBytes: number;
  variants: FileVariant[];
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
  /** When set, media should not be served after this instant. */
  ephemeralExpiresAt?: IsoDateTimeString;
};

export type FileReferenceIssueCode =
  | "missing_id"
  | "missing_tenant_id"
  | "missing_file_type"
  | "missing_status"
  | "missing_mime_type"
  | "missing_size"
  | "negative_size"
  | "missing_module_id"
  | "invalid_variant"
  | "negative_ephemeral_ttl";

export type FileReferenceIssue = {
  code: FileReferenceIssueCode;
  message: string;
  field?: keyof FileReference | `variants[${number}]` | `ownerContext.${string}`;
};

const FILE_TYPE_SET: ReadonlySet<string> = new Set(FILE_TYPES);
const STATUS_SET: ReadonlySet<string> = new Set(FILE_REFERENCE_STATUSES);

export function isFileType(value: string): value is FileType {
  return FILE_TYPE_SET.has(value);
}

export function isFileReferenceStatus(
  value: string,
): value is FileReferenceStatus {
  return STATUS_SET.has(value);
}

/** Serveable statuses for UI / delivery projection. */
export function isFileReferenceReady(file: FileReference): boolean {
  return file.status === "ready";
}

/**
 * Structural validation (not AuthZ, not storage).
 */
export function validateFileReference(
  file: FileReference,
): FileReferenceIssue[] {
  const issues: FileReferenceIssue[] = [];

  if (!file.id?.trim()) {
    issues.push({
      code: "missing_id",
      message: "FileReference requires id.",
      field: "id",
    });
  }
  if (!file.tenantId?.trim()) {
    issues.push({
      code: "missing_tenant_id",
      message: "FileReference requires tenantId.",
      field: "tenantId",
    });
  }
  if (!isFileType(file.fileType)) {
    issues.push({
      code: "missing_file_type",
      message: "FileReference requires a valid fileType.",
      field: "fileType",
    });
  }
  if (!isFileReferenceStatus(file.status)) {
    issues.push({
      code: "missing_status",
      message: "FileReference requires a valid status.",
      field: "status",
    });
  }
  if (!file.mimeType?.trim()) {
    issues.push({
      code: "missing_mime_type",
      message: "FileReference requires mimeType.",
      field: "mimeType",
    });
  }
  if (file.sizeBytes === undefined || file.sizeBytes === null) {
    issues.push({
      code: "missing_size",
      message: "FileReference requires sizeBytes.",
      field: "sizeBytes",
    });
  } else if (file.sizeBytes < 0 || !Number.isFinite(file.sizeBytes)) {
    issues.push({
      code: "negative_size",
      message: "sizeBytes must be a non-negative finite number.",
      field: "sizeBytes",
    });
  }
  if (file.ownerContext && !file.ownerContext.moduleId?.trim()) {
    issues.push({
      code: "missing_module_id",
      message: "ownerContext.moduleId is required when ownerContext is set.",
      field: "ownerContext.moduleId",
    });
  }
  if (
    file.ownerContext?.ephemeralTtlDays !== undefined &&
    file.ownerContext.ephemeralTtlDays < 0
  ) {
    issues.push({
      code: "negative_ephemeral_ttl",
      message: "ownerContext.ephemeralTtlDays must be >= 0 when set.",
      field: "ownerContext.ephemeralTtlDays",
    });
  }

  const variants = file.variants ?? [];
  variants.forEach((variant, index) => {
    for (const issue of validateFileVariant(variant)) {
      issues.push({
        code: "invalid_variant",
        message: issue.message,
        field: `variants[${index}]`,
      });
    }
  });

  return issues;
}
