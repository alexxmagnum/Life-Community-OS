/**
 * Upload policy — mime, size, filename. Never trusts client storage_key.
 */

import {
  mediaAssetTypeFromMime,
  type MediaAssetType,
} from "@life-community-os/types";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_BYTES: Record<MediaAssetType, number> = {
  image: 8 * 1024 * 1024,
  avatar: 8 * 1024 * 1024,
  video: 32 * 1024 * 1024,
  document: 12 * 1024 * 1024,
  file: 12 * 1024 * 1024,
  attachment: 12 * 1024 * 1024,
};

export function isAllowedMediaMime(mimeType: string): boolean {
  return ALLOWED_MIME.has(mimeType.trim().toLowerCase());
}

export function maxBytesForMediaType(type: MediaAssetType): number {
  return MAX_BYTES[type];
}

export function resolveUploadMediaType(
  mimeType: string,
  preferred?: string,
): MediaAssetType {
  if (preferred === "avatar") return "avatar";
  if (preferred === "attachment") return "attachment";
  return mediaAssetTypeFromMime(mimeType, preferred as MediaAssetType | undefined);
}

export function validateUploadPayload(input: {
  filename: string;
  mimeType: string;
  size: number;
  type?: string;
  storageKeyFromClient?: string | null;
}): { ok: true; type: MediaAssetType } | { ok: false; error: string } {
  if (input.storageKeyFromClient?.trim()) {
    return { ok: false, error: "storage_key_forbidden" };
  }
  const mime = input.mimeType.trim().toLowerCase();
  if (!isAllowedMediaMime(mime)) {
    return { ok: false, error: "mime_not_allowed" };
  }
  const type = resolveUploadMediaType(mime, input.type);
  if (input.size < 0 || !Number.isFinite(input.size)) {
    return { ok: false, error: "invalid_size" };
  }
  if (input.size > maxBytesForMediaType(type)) {
    return { ok: false, error: "file_too_large" };
  }
  if (!input.filename.trim()) {
    return { ok: false, error: "invalid_filename" };
  }
  return { ok: true, type };
}

export function safeFilename(filename: string): string {
  const base = filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  return base || "file";
}

export function issueStorageKey(input: {
  tenantSlug: string;
  assetId: string;
  filename: string;
}): string {
  return `${input.tenantSlug}/${input.assetId}/${safeFilename(input.filename)}`;
}

export function isDemoMediaUrl(url?: string | null): boolean {
  if (!url?.trim()) return true;
  const value = url.trim().toLowerCase();
  return (
    value.includes("unsplash.com") ||
    value.includes("images.unsplash") ||
    value.includes("picsum.photos") ||
    value.includes("placeholder.com") ||
    value.includes("placehold.co") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  );
}

export function preferEntityMediaUrl(
  mediaUrl?: string | null,
  fallback?: string | null,
): string | undefined {
  const owned = mediaUrl?.trim();
  if (owned) return owned;
  const fallbackUrl = fallback?.trim();
  if (fallbackUrl && !isDemoMediaUrl(fallbackUrl)) return fallbackUrl;
  return undefined;
}
