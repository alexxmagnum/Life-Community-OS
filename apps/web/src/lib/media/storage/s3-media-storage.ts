import type { MediaStorageProvider } from "@life-community-os/types";

/**
 * S3-compatible adapter. Configured via env; unused until a bucket is bound.
 * Domain code must not import AWS SDKs directly.
 */
export function createS3MediaStorage(): MediaStorageProvider {
  const endpoint = process.env.LCOS_MEDIA_S3_ENDPOINT?.trim();
  const bucket = process.env.LCOS_MEDIA_S3_BUCKET?.trim();
  if (!endpoint || !bucket) {
    return {
      async upload() {
        throw new Error("s3_storage_not_configured");
      },
      async delete() {
        throw new Error("s3_storage_not_configured");
      },
      async getSignedUrl() {
        throw new Error("s3_storage_not_configured");
      },
      validateAccess(storageKey, tenantId) {
        return storageKey.startsWith(`${tenantId}/`) && !storageKey.includes("..");
      },
    };
  }
  return {
    async upload() {
      throw new Error("s3_storage_not_configured");
    },
    async delete() {
      throw new Error("s3_storage_not_configured");
    },
    async getSignedUrl() {
      throw new Error("s3_storage_not_configured");
    },
    validateAccess(storageKey, tenantId) {
      return storageKey.startsWith(`${tenantId}/`) && !storageKey.includes("..");
    },
  };
}
