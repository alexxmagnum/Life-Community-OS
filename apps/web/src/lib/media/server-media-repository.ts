/**
 * Media Platform repository.
 *
 * Production: PostgreSQL media_assets / media_references + abstracted storage.
 * Tests / dev fixture: apps/web/.data/media when LCOS_MEDIA_FIXTURE=1.
 * owner_person_id and storage_key come from the server. Client storage keys are rejected.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createMediaAsset,
  createMediaReference,
  isMediaEntityType,
  isMediaPurpose,
  type MediaAsset,
  type MediaEntityType,
  type MediaPurpose,
  type MediaReference,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import {
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";
import type { RequestActor } from "@/lib/auth/request-actor";
import { issueStorageKey, validateUploadPayload } from "./media-policy";
import {
  actorCanDeleteMedia,
  actorCanLinkMedia,
  actorCanReadMedia,
  actorCanUploadMedia,
} from "./permissions";
import { createMediaStorage } from "./storage/create-media-storage";

export type MediaWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

export type MediaStore = {
  assets: MediaAsset[];
  references: MediaReference[];
};

export class MediaDeniedError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "MediaDeniedError";
  }
}

const DATA_DIR = path.join(process.cwd(), ".data", "media");

function fixtureEnabled(): boolean {
  return process.env.LCOS_MEDIA_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

function emptyStore(): MediaStore {
  return { assets: [], references: [] };
}

function fileStoreEnabled(): boolean {
  return fixtureEnabled() || !isDatabaseConfigured();
}

async function readFileStore(tenantSlug: string): Promise<MediaStore> {
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<MediaStore>;
    return {
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      references: Array.isArray(parsed.references) ? parsed.references : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(tenantSlug: string, store: MediaStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2), "utf8");
}

type AssetRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  owner_person_id: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  size: number | string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ReferenceRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  media_id: string;
  entity_type: string;
  entity_id: string;
  purpose: string;
  created_at: string;
  updated_at: string;
};

function assetFromRow(row: AssetRow, tenantSlug: string): MediaAsset {
  return {
    id: row.id,
    tenantId: tenantSlug,
    createdBy: row.created_by,
    ownerPersonId: row.owner_person_id,
    storageKey: row.storage_key,
    filename: row.filename,
    mimeType: row.mime_type,
    size: Number(row.size) || 0,
    type: row.type as MediaAsset["type"],
    status: row.status as MediaAsset["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function referenceFromRow(row: ReferenceRow, tenantSlug: string): MediaReference {
  return {
    id: row.id,
    tenantId: tenantSlug,
    createdBy: row.created_by,
    mediaId: row.media_id,
    entityType: row.entity_type as MediaEntityType,
    entityId: row.entity_id,
    purpose: row.purpose as MediaPurpose,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadStore(
  tenantSlug: string,
  scope?: MediaWriteScope,
): Promise<MediaStore> {
  if (fileStoreEnabled()) return readFileStore(tenantSlug);
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    throw new PersistenceUnavailableError("media");
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  const [assetsRes, refsRes] = await Promise.all([
    client.from("media_assets").select("*").eq("tenant_id", tenantUuid),
    client.from("media_references").select("*").eq("tenant_id", tenantUuid),
  ]);
  if (assetsRes.error) throw assetsRes.error;
  if (refsRes.error) throw refsRes.error;
  return {
    assets: ((assetsRes.data ?? []) as AssetRow[]).map((row) =>
      assetFromRow(row, tenantSlug),
    ),
    references: ((refsRes.data ?? []) as ReferenceRow[]).map((row) =>
      referenceFromRow(row, tenantSlug),
    ),
  };
}

async function persistStore(
  tenantSlug: string,
  store: MediaStore,
  scope?: MediaWriteScope,
): Promise<void> {
  if (fileStoreEnabled()) {
    await writeFileStore(tenantSlug, store);
    return;
  }
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) {
      await writeFileStore(tenantSlug, store);
      return;
    }
    throw new PersistenceUnavailableError("media");
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  const assetRows = store.assets.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    created_by: item.createdBy,
    owner_person_id: item.ownerPersonId,
    storage_key: item.storageKey,
    filename: item.filename,
    mime_type: item.mimeType,
    size: item.size,
    type: item.type,
    status: item.status,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const refRows = store.references.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    created_by: item.createdBy,
    media_id: item.mediaId,
    entity_type: item.entityType,
    entity_id: item.entityId,
    purpose: item.purpose,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  if (assetRows.length > 0) {
    const { error } = await client.from("media_assets").upsert(assetRows);
    if (error) throw error;
  }
  if (refRows.length > 0) {
    const { error } = await client.from("media_references").upsert(refRows);
    if (error) throw error;
  }
}

export async function replaceMediaStoreForTests(tenantSlug: string): Promise<void> {
  await writeFileStore(tenantSlug, emptyStore());
}

function requirePerson(actor: RequestActor): string {
  const personId = actor.personId?.trim();
  if (!personId || !actorCanUploadMedia(actor)) {
    throw new MediaDeniedError("unauthorized");
  }
  return personId;
}

function publicUrlForAsset(asset: MediaAsset): string {
  return `/api/media/${encodeURIComponent(asset.id)}/file`;
}

export async function uploadMediaServer(input: {
  tenantId: string;
  actor: RequestActor;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  type?: string;
  storageKeyFromClient?: string | null;
  ownerPersonIdFromClient?: string | null;
  entityType?: string;
  entityId?: string;
  purpose?: string;
  scope?: MediaWriteScope;
}): Promise<{ asset: MediaAsset; reference?: MediaReference; url: string }> {
  if (
    input.ownerPersonIdFromClient &&
    input.ownerPersonIdFromClient !== input.actor.personId
  ) {
    throw new MediaDeniedError("owner_immutable");
  }
  const personId = requirePerson(input.actor);
  const slug = resolveTenantPublicId(input.tenantId);
  if (input.actor.tenantSlug !== slug) {
    throw new MediaDeniedError("forbidden");
  }
  const checked = validateUploadPayload({
    filename: input.filename,
    mimeType: input.mimeType,
    size: input.bytes.byteLength,
    type: input.type,
    storageKeyFromClient: input.storageKeyFromClient,
  });
  if (!checked.ok) {
    throw new MediaDeniedError(checked.error);
  }
  const store = await loadStore(slug, input.scope);
  const assetId = `media-${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
  const storageKey = issueStorageKey({
    tenantSlug: slug,
    assetId,
    filename: input.filename,
  });
  const storage = createMediaStorage();
  try {
    await storage.upload({
      storageKey,
      bytes: input.bytes,
      mimeType: input.mimeType,
    });
  } catch {
    const failed = createMediaAsset({
      id: assetId,
      tenantId: slug,
      ownerPersonId: personId,
      createdBy: personId,
      storageKey,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.bytes.byteLength,
      type: checked.type,
      status: "failed",
    });
    store.assets.push(failed);
    await persistStore(slug, store, input.scope);
    throw new MediaDeniedError("upload_failed");
  }
  const asset = createMediaAsset({
    id: assetId,
    tenantId: slug,
    ownerPersonId: personId,
    createdBy: personId,
    storageKey,
    filename: input.filename,
    mimeType: input.mimeType,
    size: input.bytes.byteLength,
    type: checked.type,
    status: "ready",
  });
  store.assets.push(asset);
  let reference: MediaReference | undefined;
  if (input.entityType && input.entityId && input.purpose) {
    if (!isMediaEntityType(input.entityType) || !isMediaPurpose(input.purpose)) {
      throw new MediaDeniedError("invalid_reference");
    }
    reference = createMediaReference({
      tenantId: slug,
      createdBy: personId,
      mediaId: asset.id,
      entityType: input.entityType,
      entityId: input.entityId.trim(),
      purpose: input.purpose,
    });
    store.references.push(reference);
  }
  await persistStore(slug, store, input.scope);
  return { asset, reference, url: publicUrlForAsset(asset) };
}

function refsForAsset(store: MediaStore, mediaId: string): MediaReference[] {
  return store.references.filter((item) => item.mediaId === mediaId);
}

export async function getMediaAssetServer(input: {
  tenantId: string;
  actor: RequestActor;
  mediaId: string;
  scope?: MediaWriteScope;
}): Promise<{ asset: MediaAsset; references: MediaReference[]; url: string }> {
  if (!input.actor.authenticated || !input.actor.hasMembership) {
    throw new MediaDeniedError("unauthorized");
  }
  const slug = resolveTenantPublicId(input.tenantId);
  if (input.actor.tenantSlug !== slug) {
    throw new MediaDeniedError("forbidden");
  }
  const store = await loadStore(slug, input.scope);
  const asset = store.assets.find((item) => item.id === input.mediaId);
  if (!asset || asset.status === "deleted") {
    throw new MediaDeniedError("not_found");
  }
  const references = refsForAsset(store, asset.id);
  if (!actorCanReadMedia(input.actor, asset, references)) {
    throw new MediaDeniedError("forbidden");
  }
  return { asset, references, url: publicUrlForAsset(asset) };
}

export async function getMediaUrlServer(input: {
  tenantId: string;
  actor: RequestActor;
  mediaId: string;
  scope?: MediaWriteScope;
}): Promise<{ url: string; asset: MediaAsset }> {
  const found = await getMediaAssetServer(input);
  const storage = createMediaStorage();
  if (!storage.validateAccess(found.asset.storageKey, found.asset.tenantId)) {
    throw new MediaDeniedError("forbidden");
  }
  const signed = await storage.getSignedUrl(found.asset.storageKey, 300);
  const url = signed.startsWith("local://") ? found.url : signed;
  return { url, asset: found.asset };
}

export async function readMediaBytesServer(input: {
  tenantId: string;
  actor: RequestActor;
  mediaId: string;
  scope?: MediaWriteScope;
}): Promise<{ bytes: Uint8Array; asset: MediaAsset }> {
  const found = await getMediaAssetServer(input);
  const storage = createMediaStorage();
  if (!storage.validateAccess(found.asset.storageKey, found.asset.tenantId)) {
    throw new MediaDeniedError("forbidden");
  }
  if (!storage.read) {
    throw new MediaDeniedError("not_found");
  }
  const bytes = await storage.read(found.asset.storageKey);
  return { bytes, asset: found.asset };
}

export async function deleteMediaServer(input: {
  tenantId: string;
  actor: RequestActor;
  mediaId: string;
  scope?: MediaWriteScope;
}): Promise<MediaAsset> {
  if (!input.actor.authenticated || !input.actor.hasMembership) {
    throw new MediaDeniedError("unauthorized");
  }
  const slug = resolveTenantPublicId(input.tenantId);
  if (input.actor.tenantSlug !== slug) {
    throw new MediaDeniedError("forbidden");
  }
  const store = await loadStore(slug, input.scope);
  const asset = store.assets.find((item) => item.id === input.mediaId);
  if (!asset || asset.status === "deleted") {
    throw new MediaDeniedError("not_found");
  }
  if (!actorCanDeleteMedia(input.actor, asset)) {
    throw new MediaDeniedError("forbidden");
  }
  const storage = createMediaStorage();
  try {
    await storage.delete(asset.storageKey);
  } catch {
    // Soft-delete even if blob is already gone.
  }
  asset.status = "deleted";
  asset.updatedAt = new Date().toISOString();
  await persistStore(slug, store, input.scope);
  return asset;
}

export async function linkMediaReferenceServer(input: {
  tenantId: string;
  actor: RequestActor;
  mediaId: string;
  entityType: string;
  entityId: string;
  purpose: string;
  scope?: MediaWriteScope;
}): Promise<MediaReference> {
  const personId = requirePerson(input.actor);
  const slug = resolveTenantPublicId(input.tenantId);
  if (input.actor.tenantSlug !== slug) {
    throw new MediaDeniedError("forbidden");
  }
  if (!isMediaEntityType(input.entityType) || !isMediaPurpose(input.purpose)) {
    throw new MediaDeniedError("invalid_reference");
  }
  const store = await loadStore(slug, input.scope);
  const asset = store.assets.find((item) => item.id === input.mediaId);
  if (!asset || asset.status === "deleted") {
    throw new MediaDeniedError("not_found");
  }
  if (!actorCanLinkMedia(input.actor, asset, input.purpose)) {
    throw new MediaDeniedError("forbidden");
  }
  const existing = store.references.find(
    (item) =>
      item.mediaId === asset.id &&
      item.entityType === input.entityType &&
      item.entityId === input.entityId.trim() &&
      item.purpose === input.purpose,
  );
  if (existing) return existing;
  const reference = createMediaReference({
    tenantId: slug,
    createdBy: personId,
    mediaId: asset.id,
    entityType: input.entityType,
    entityId: input.entityId.trim(),
    purpose: input.purpose,
  });
  store.references.push(reference);
  await persistStore(slug, store, input.scope);
  return reference;
}

export type EntityMediaItem = {
  asset: MediaAsset;
  reference: MediaReference;
  url: string;
};

export async function listEntityMediaServer(input: {
  tenantId: string;
  actor: RequestActor;
  entityType?: string;
  entityId?: string;
  scope?: MediaWriteScope;
}): Promise<EntityMediaItem[]> {
  if (!input.actor.authenticated || !input.actor.hasMembership) {
    throw new MediaDeniedError("unauthorized");
  }
  const slug = resolveTenantPublicId(input.tenantId);
  if (input.actor.tenantSlug !== slug) {
    throw new MediaDeniedError("forbidden");
  }
  const store = await loadStore(slug, input.scope);
  return store.references.flatMap((reference) => {
    if (input.entityType && reference.entityType !== input.entityType) return [];
    if (input.entityId && reference.entityId !== input.entityId) return [];
    const asset = store.assets.find((item) => item.id === reference.mediaId);
    if (!asset) return [];
    if (!actorCanReadMedia(input.actor, asset, [reference])) return [];
    return [{ asset, reference, url: publicUrlForAsset(asset) }];
  });
}

export function displayUrlsFromEntityMedia(
  items: EntityMediaItem[],
  purpose?: MediaPurpose,
): string[] {
  const filtered = purpose
    ? items.filter((item) => item.reference.purpose === purpose)
    : items;
  const covers = filtered.filter((item) => item.reference.purpose === "cover");
  const rest = filtered.filter((item) => item.reference.purpose !== "cover");
  return [...covers, ...rest].map((item) => item.url);
}
