import { isDatabaseConfigured, isProductionDataPlane } from "@/lib/data/data-plane";
import { createLocalMediaStorage } from "./local-media-storage";
import { createS3MediaStorage } from "./s3-media-storage";
import { createSupabaseMediaStorage } from "./supabase-media-storage";
import type { MediaStorageProvider } from "@life-community-os/types";

let cached: MediaStorageProvider | null = null;

export function createMediaStorage(): MediaStorageProvider {
  if (cached) return cached;
  const mode = (process.env.LCOS_MEDIA_STORAGE ?? "").trim().toLowerCase();
  if (mode === "s3") {
    cached = createS3MediaStorage();
    return cached;
  }
  if (!isProductionDataPlane() && (mode === "local" || process.env.LCOS_MEDIA_FIXTURE === "1")) {
    cached = createLocalMediaStorage();
    return cached;
  }
  if (isDatabaseConfigured() && mode !== "local") {
    cached = {
      async upload(input) {
        const { createServiceDatabaseClientSafe } = await import(
          "@/lib/data/database-access"
        );
        const client = await createServiceDatabaseClientSafe();
        if (!client) {
          if (isProductionDataPlane()) throw new Error("media_storage_unavailable");
          return createLocalMediaStorage().upload(input);
        }
        return createSupabaseMediaStorage(client).upload(input);
      },
      async delete(storageKey) {
        const { createServiceDatabaseClientSafe } = await import(
          "@/lib/data/database-access"
        );
        const client = await createServiceDatabaseClientSafe();
        if (!client) {
          if (isProductionDataPlane()) throw new Error("media_storage_unavailable");
          return createLocalMediaStorage().delete(storageKey);
        }
        return createSupabaseMediaStorage(client).delete(storageKey);
      },
      async getSignedUrl(storageKey, expiresInSeconds) {
        const { createServiceDatabaseClientSafe } = await import(
          "@/lib/data/database-access"
        );
        const client = await createServiceDatabaseClientSafe();
        if (!client) {
          if (isProductionDataPlane()) throw new Error("media_storage_unavailable");
          return createLocalMediaStorage().getSignedUrl(storageKey, expiresInSeconds);
        }
        return createSupabaseMediaStorage(client).getSignedUrl(
          storageKey,
          expiresInSeconds,
        );
      },
      validateAccess(storageKey, tenantId) {
        return storageKey.startsWith(`${tenantId}/`) && !storageKey.includes("..");
      },
      async read(storageKey) {
        if (isProductionDataPlane()) throw new Error("media_storage_unavailable");
        return createLocalMediaStorage().read!(storageKey);
      },
    };
    return cached;
  }
  if (isProductionDataPlane()) {
    cached = {
      async upload() { throw new Error("media_storage_unavailable"); },
      async delete() { throw new Error("media_storage_unavailable"); },
      async getSignedUrl() { throw new Error("media_storage_unavailable"); },
      validateAccess(storageKey, tenantId) {
        return storageKey.startsWith(`${tenantId}/`) && !storageKey.includes("..");
      },
      async read() { throw new Error("media_storage_unavailable"); },
    };
    return cached;
  }
  cached = createLocalMediaStorage();
  return cached;
}

export function resetMediaStorageForTests(): void {
  cached = null;
}
