/**
 * Storage provider contract — domain never imports a vendor SDK.
 *
 * Implementations live in the web/runtime layer:
 * local development, Supabase Storage, S3-compatible.
 */

export type MediaStorageUploadInput = {
  storageKey: string;
  bytes: Uint8Array;
  mimeType: string;
};

export type MediaStorageObject = {
  storageKey: string;
  byteLength: number;
};

export type MediaStorageProvider = {
  upload(input: MediaStorageUploadInput): Promise<MediaStorageObject>;
  delete(storageKey: string): Promise<void>;
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
  validateAccess(storageKey: string, tenantId: string): boolean;
  read?(storageKey: string): Promise<Uint8Array>;
};
