"use client";

import type {
  CommunityFeedItem,
  DiscoverExperienceContext,
  LifeHomeContext,
} from "@life-community-os/types";

export type CommunityFeedPayload = {
  tenantId?: string;
  territoryId: string | null;
  items: CommunityFeedItem[];
  posts: unknown[];
  groups: unknown[];
  events: unknown[];
  comments: unknown[];
  reactions: unknown[];
  personalization?: {
    enabled: boolean;
    providerId?: string;
    reasons: Record<string, string>;
  };
};

const EMPTY_FEED: CommunityFeedPayload = {
  territoryId: null,
  items: [],
  posts: [],
  groups: [],
  events: [],
  comments: [],
  reactions: [],
};

export async function fetchCommunityFeed(
  tenantId: string,
  options?: { territoryId?: string | null },
): Promise<CommunityFeedPayload> {
  const params = new URLSearchParams({ tenantId });
  if (options?.territoryId?.trim()) {
    params.set("territoryId", options.territoryId.trim());
  }
  const res = await fetch(`/api/community/feed?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": tenantId },
  });
  if (!res.ok) {
    return EMPTY_FEED;
  }
  const data = (await res.json()) as Partial<CommunityFeedPayload>;
  return {
    tenantId: data.tenantId,
    territoryId: data.territoryId ?? options?.territoryId ?? null,
    items: Array.isArray(data.items) ? data.items : [],
    posts: data.posts ?? [],
    groups: data.groups ?? [],
    events: data.events ?? [],
    comments: data.comments ?? [],
    reactions: data.reactions ?? [],
    personalization: data.personalization,
  };
}

export async function getCommunityExperienceFeed(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<{
  territoryId: string | null;
  items: CommunityFeedItem[];
  reasons: Record<string, string>;
  personalizationEnabled: boolean;
}> {
  const data = await fetchCommunityFeed(input.tenantId, {
    territoryId: input.territoryId,
  });
  return {
    territoryId: data.territoryId,
    items: data.items,
    reasons: data.personalization?.reasons ?? {},
    personalizationEnabled: data.personalization?.enabled === true,
  };
}

export async function createCommunityPostRequest(input: {
  tenantId: string;
  title: string;
  body: string;
  kind?: string;
}) {
  const res = await fetch("/api/community/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: (await res.json()) as { error?: string } };
  const data = (await res.json()) as { post: unknown };
  return { post: data.post };
}

export async function createCommunityGroupRequest(input: {
  tenantId: string;
  name: string;
  description?: string;
}) {
  const res = await fetch("/api/community/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: true };
  return res.json();
}

export async function createCommunityEventRequest(input: {
  tenantId: string;
  title: string;
  description?: string;
  startsAt: string;
  locationLabel?: string;
}) {
  const res = await fetch("/api/community/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: true };
  return res.json();
}

export async function addCommunityCommentRequest(input: {
  tenantId: string;
  postId: string;
  body: string;
}) {
  const res = await fetch("/api/community/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  return res.ok;
}

export async function toggleCommunityReactionRequest(input: {
  tenantId: string;
  targetId: string;
  kind: "acknowledge" | "support";
}) {
  await fetch("/api/community/reactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify({
      targetType: "post",
      targetId: input.targetId,
      kind: input.kind,
    }),
  });
}

export async function fetchCommunityNotifications(tenantId: string) {
  const res = await fetch(
    `/api/community/notifications?tenantId=${encodeURIComponent(tenantId)}`,
    { cache: "no-store", headers: { "x-tenant-slug": tenantId } },
  );
  if (!res.ok) return { notifications: [] as unknown[] };
  return (await res.json()) as { notifications: unknown[] };
}

export async function fetchCommunityHome(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<LifeHomeContext | null> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  const res = await fetch(`/api/community/home?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { home?: LifeHomeContext };
  return data.home ?? null;
}

export async function fetchDiscoverExperience(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<DiscoverExperienceContext | null> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  const res = await fetch(`/api/community/discover?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { discover?: DiscoverExperienceContext };
  return data.discover ?? null;
}