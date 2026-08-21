import { isDatabaseConfigured } from "@/lib/data/data-plane";
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
  if (mode === "local" || process.env.LCOS_MEDIA_FIXTURE === "1") {
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
        if (!client) return createLocalMediaStorage().upload(input);
        return createSupabaseMediaStorage(client).upload(input);
      },
      async delete(storageKey) {
        const { createServiceDatabaseClientSafe } = await import(
          "@/lib/data/database-access"
        );
        const client = await createServiceDatabaseClientSafe();
        if (!client) return createLocalMediaStorage().delete(storageKey);
        return createSupabaseMediaStorage(client).delete(storageKey);
      },
      async getSignedUrl(storageKey, expiresInSeconds) {
        const { createServiceDatabaseClientSafe } = await import(
          "@/lib/data/database-access"
        );
        const client = await createServiceDatabaseClientSafe();
        if (!client) {
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
        return createLocalMediaStorage().read!(storageKey);
      },
    };
    return cached;
  }
  cached = createLocalMediaStorage();
  return cached;
}

export function resetMediaStorageForTests(): void {
  cached = null;
}
