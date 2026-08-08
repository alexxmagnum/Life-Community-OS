/**
 * Platform Core Files & Media contracts (ADR-020 / D.0.5c).
 *
 * Types and structural helpers only.
 * No storage provider, uploads UI, CDN, or migrations.
 */

export type {
  FileType,
  FileReferenceStatus,
  FileOwnerContext,
  FileReference,
  FileReferenceIssue,
  FileReferenceIssueCode,
} from "./file-reference";
export {
  FILE_TYPES,
  FILE_REFERENCE_STATUSES,
  isFileType,
  isFileReferenceStatus,
  isFileReferenceReady,
  validateFileReference,
} from "./file-reference";

export type {
  FileVariantKind,
  PreferredImageFormat,
  FileMediaFormat,
  FileVariant,
  FileVariantIssue,
  FileVariantIssueCode,
} from "./file-variant";
export {
  FILE_VARIANT_KINDS,
  PREFERRED_IMAGE_FORMATS,
  isFileVariantKind,
  validateFileVariant,
  pickDeliveryVariant,
} from "./file-variant";

export type {
  MediaPipelineStage,
  ImageOptimizationOutputKind,
  ImageOptimizationContract,
  MediaPipelineContract,
} from "./media-pipeline";
export {
  DEFAULT_IMAGE_OPTIMIZATION_CONTRACT,
  DEFAULT_MEDIA_PIPELINE_CONTRACT,
} from "./media-pipeline";

export type { FileAccessEnv } from "./media-access";
export {
  shouldProjectFileReference,
  canDeliverFileReference,
  isFileEligibleForRetentionCleanup,
} from "./media-access";
