import type { MediaStorageProvider } from "@life-community-os/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "media";

export function createSupabaseMediaStorage(
  client: SupabaseClient,
): MediaStorageProvider {
  return {
    async upload(input) {
      const body = Buffer.from(input.bytes);
      const { error } = await client.storage.from(BUCKET).upload(input.storageKey, body, {
        contentType: input.mimeType,
        upsert: true,
      });
      if (error) throw error;
      return { storageKey: input.storageKey, byteLength: input.bytes.byteLength };
    },
    async delete(storageKey) {
      const { error } = await client.storage.from(BUCKET).remove([storageKey]);
      if (error) throw error;
    },
    async getSignedUrl(storageKey, expiresInSeconds = 300) {
      const { data, error } = await client.storage
        .from(BUCKET)
        .createSignedUrl(storageKey, expiresInSeconds);
      if (error || !data?.signedUrl) {
        throw error ?? new Error("signed_url_failed");
      }
      return data.signedUrl;
    },
    validateAccess(storageKey, tenantId) {
      return storageKey.startsWith(`${tenantId}/`) && !storageKey.includes("..");
    },
  };
}
