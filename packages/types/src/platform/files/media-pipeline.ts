import type { PreferredImageFormat } from "./file-variant";
import { PREFERRED_IMAGE_FORMATS } from "./file-variant";

/**
 * Image / media optimization contract (ADR-020 / D.0.5c).
 *
 * Documents the future processing pipeline — no runtime processor here.
 *
 * Pipeline:
 *   User upload → temporary → compress/optimize → variants → FileReference
 *
 * Never serve uncontrolled mobile originals as the primary delivery asset.
 */

export type MediaPipelineStage =
  | "upload"
  | "temporary_processing"
  | "compression"
  | "variant_generation"
  | "ready"
  | "cleanup";

export type ImageOptimizationOutputKind =
  | "thumbnail"
  | "preview"
  | "optimized";

/**
 * Future processing rules for a mobile photo input.
 * Dimensions are guidance for implementers — not enforced in this slice.
 */
export type ImageOptimizationContract = {
  input: "mobile_photo";
  outputs: readonly ImageOptimizationOutputKind[];
  preferredFormats: readonly PreferredImageFormat[];
  /** Soft targets — providers may adjust. */
  targets: {
    thumbnailMaxEdgePx: number;
    previewMaxEdgePx: number;
    optimizedMaxEdgePx: number;
  };
  /** Uncontrolled original must not be the default serve path. */
  forbidServingUncontrolledOriginal: true;
};

export const DEFAULT_IMAGE_OPTIMIZATION_CONTRACT: ImageOptimizationContract = {
  input: "mobile_photo",
  outputs: ["thumbnail", "preview", "optimized"],
  preferredFormats: PREFERRED_IMAGE_FORMATS,
  targets: {
    thumbnailMaxEdgePx: 320,
    previewMaxEdgePx: 1280,
    optimizedMaxEdgePx: 2048,
  },
  forbidServingUncontrolledOriginal: true,
};

export type MediaPipelineContract = {
  stages: readonly MediaPipelineStage[];
  image: ImageOptimizationContract;
  /** Modules reuse this Core pipeline — no per-module storage. */
  sharedAcrossModules: true;
};

export const DEFAULT_MEDIA_PIPELINE_CONTRACT: MediaPipelineContract = {
  stages: [
    "upload",
    "temporary_processing",
    "compression",
    "variant_generation",
    "ready",
    "cleanup",
  ],
  image: DEFAULT_IMAGE_OPTIMIZATION_CONTRACT,
  sharedAcrossModules: true,
};
