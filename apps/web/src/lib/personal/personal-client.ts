"use client";

import type {
  CommunityInsight,
  PersonalContext,
  PersonalFavorite,
  PersonalFavoriteKind,
} from "@life-community-os/types";

export type PersonalContextPayload = {
  context: PersonalContext | null;
  favorites: PersonalFavorite[];
};

export async function fetchPersonalContext(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<PersonalContextPayload> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  const res = await fetch(`/api/personal/context?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) {
    return { context: null, favorites: [] };
  }
  return (await res.json()) as PersonalContextPayload;
}

export async function patchPersonalContext(input: {
  tenantId: string;
  interests?: string[];
  categories?: string[];
  privacy?: {
    shareActivity?: boolean;
    receiveRecommendations?: boolean;
  };
}): Promise<PersonalContext | null> {
  const res = await fetch("/api/personal/context", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify({
      interests: input.interests,
      categories: input.categories,
      privacy: input.privacy,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { context?: PersonalContext };
  return data.context ?? null;
}

export async function togglePersonalFavorite(input: {
  tenantId: string;
  kind: PersonalFavoriteKind;
  targetId: string;
}): Promise<{ saved: boolean }> {
  const res = await fetch("/api/personal/favorites", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify({
      kind: input.kind,
      targetId: input.targetId,
    }),
  });
  if (!res.ok) return { saved: false };
  return (await res.json()) as { saved: boolean };
}

export async function fetchPersonalInsights(input: {
  tenantId: string;
  territoryId?: string | null;
  publish?: boolean;
}): Promise<CommunityInsight[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  if (input.publish) params.set("publish", "1");
  const res = await fetch(`/api/personal/insights?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { insights?: CommunityInsight[] };
  return data.insights ?? [];
}
