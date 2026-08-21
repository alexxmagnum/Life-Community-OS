/**
 * Platform Core Files & Media contracts (ADR-020 / D.0.5c + Phase 10).
 *
 * FileReference is the delivery contract.
 * MediaAsset is the persistence SoT (ownership + storage_key).
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

export type {
  MediaAssetType,
  MediaAssetStatus,
  MediaEntityType,
  MediaPurpose,
  MediaAsset,
  MediaReference,
  MediaAssetIssue,
  MediaAssetIssueCode,
} from "./media-asset";
export {
  MEDIA_ASSET_TYPES,
  MEDIA_ASSET_STATUSES,
  MEDIA_ENTITY_TYPES,
  MEDIA_PURPOSES,
  isMediaAssetType,
  isMediaAssetStatus,
  isMediaEntityType,
  isMediaPurpose,
  isPublicMediaPurpose,
  createMediaAsset,
  createMediaReference,
  validateMediaAsset,
  mediaAssetTypeFromMime,
  mediaAssetToFileReference,
} from "./media-asset";

export type {
  MediaStorageUploadInput,
  MediaStorageObject,
  MediaStorageProvider,
} from "./media-storage";
