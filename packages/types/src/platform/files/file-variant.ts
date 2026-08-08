/**
 * Generated file variants (ADR-020 / D.0.5c).
 *
 * Serving surfaces prefer thumbnail / preview / optimized.
 * Never serve uncontrolled mobile originals as the primary asset.
 */

export const FILE_VARIANT_KINDS = [
  "thumbnail",
  "preview",
  "optimized",
  /** Internal processing pointer — not a delivery default. */
  "original_ref",
] as const;

export type FileVariantKind = (typeof FILE_VARIANT_KINDS)[number];

/**
 * Preferred delivery formats for image optimization pipeline.
 * AVIF when supported; WebP as baseline modern format.
 */
export const PREFERRED_IMAGE_FORMATS = ["avif", "webp"] as const;

export type PreferredImageFormat = (typeof PREFERRED_IMAGE_FORMATS)[number];

export type FileMediaFormat =
  | PreferredImageFormat
  | "jpeg"
  | "png"
  | "gif"
  | "mp4"
  | "webm"
  | "pdf"
  | "bin"
  | (string & {});

export type FileVariant = {
  kind: FileVariantKind;
  width?: number;
  height?: number;
  sizeBytes: number;
  format: FileMediaFormat;
  /** Optional storage key / locator — opaque to domain modules. */
  storageKey?: string;
};

export type FileVariantIssueCode =
  | "missing_kind"
  | "missing_size"
  | "negative_size"
  | "negative_dimension";

export type FileVariantIssue = {
  code: FileVariantIssueCode;
  message: string;
  field?: keyof FileVariant;
};

const VARIANT_KINDS: ReadonlySet<string> = new Set(FILE_VARIANT_KINDS);

export function isFileVariantKind(value: string): value is FileVariantKind {
  return VARIANT_KINDS.has(value);
}

export function validateFileVariant(variant: FileVariant): FileVariantIssue[] {
  const issues: FileVariantIssue[] = [];

  if (!isFileVariantKind(variant.kind)) {
    issues.push({
      code: "missing_kind",
      message: "FileVariant requires a valid kind.",
      field: "kind",
    });
  }
  if (variant.sizeBytes === undefined || variant.sizeBytes === null) {
    issues.push({
      code: "missing_size",
      message: "FileVariant requires sizeBytes.",
      field: "sizeBytes",
    });
  } else if (variant.sizeBytes < 0 || !Number.isFinite(variant.sizeBytes)) {
    issues.push({
      code: "negative_size",
      message: "sizeBytes must be a non-negative finite number.",
      field: "sizeBytes",
    });
  }
  if (variant.width !== undefined && variant.width < 0) {
    issues.push({
      code: "negative_dimension",
      message: "width must be >= 0 when set.",
      field: "width",
    });
  }
  if (variant.height !== undefined && variant.height < 0) {
    issues.push({
      code: "negative_dimension",
      message: "height must be >= 0 when set.",
      field: "height",
    });
  }

  return issues;
}

/**
 * Preferred variant for client display — never original_ref.
 */
export function pickDeliveryVariant(
  variants: readonly FileVariant[],
  preferred: readonly FileVariantKind[] = ["optimized", "preview", "thumbnail"],
): FileVariant | undefined {
  for (const kind of preferred) {
    const hit = variants.find((v) => v.kind === kind);
    if (hit) return hit;
  }
  return variants.find((v) => v.kind !== "original_ref");
}
