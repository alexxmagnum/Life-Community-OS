"use client";

import type {
  MediaAsset,
  MediaEntityType,
  MediaPurpose,
  MediaReference,
} from "@life-community-os/types";

export type MediaUploadResult = {
  asset: MediaAsset;
  reference?: MediaReference;
  url: string;
};

export type EntityMediaItem = {
  asset: MediaAsset;
  reference: MediaReference;
  url: string;
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `http_${res.status}`;
  } catch {
    return `http_${res.status}`;
  }
}

export async function uploadMediaFile(input: {
  file: File;
  type?: string;
  entityType?: MediaEntityType;
  entityId?: string;
  purpose?: MediaPurpose;
}): Promise<MediaUploadResult | { error: string }> {
  const form = new FormData();
  form.set("file", input.file);
  if (input.type) form.set("type", input.type);
  if (input.entityType) form.set("entityType", input.entityType);
  if (input.entityId) form.set("entityId", input.entityId);
  if (input.purpose) form.set("purpose", input.purpose);
  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) return { error: await parseError(res) };
  return (await res.json()) as MediaUploadResult;
}

export async function fetchEntityMedia(input: {
  entityType: MediaEntityType;
  entityId?: string;
}): Promise<EntityMediaItem[]> {
  const params = new URLSearchParams({ entityType: input.entityType });
  if (input.entityId) params.set("entityId", input.entityId);
  const res = await fetch(`/api/media?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: EntityMediaItem[] };
  return data.items ?? [];
}

export async function linkMediaToEntity(input: {
  mediaId: string;
  entityType: MediaEntityType;
  entityId: string;
  purpose: MediaPurpose;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(`/api/media/${encodeURIComponent(input.mediaId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entityType: input.entityType,
      entityId: input.entityId,
      purpose: input.purpose,
    }),
  });
  if (!res.ok) return { error: await parseError(res) };
  return { ok: true };
}

export async function fetchMediaUrl(mediaId: string): Promise<string | null> {
  const res = await fetch(`/api/media/${encodeURIComponent(mediaId)}/url`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

export function coverUrlFromItems(items: EntityMediaItem[]): string | undefined {
  const cover = items.find((item) => item.reference.purpose === "cover");
  return (cover ?? items[0])?.url;
}
