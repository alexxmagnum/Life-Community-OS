"use client";

export async function fetchCommunityFeed(tenantId: string) {
  const res = await fetch(
    `/api/community/feed?tenantId=${encodeURIComponent(tenantId)}`,
    { cache: "no-store", headers: { "x-tenant-slug": tenantId } },
  );
  if (!res.ok) {
    return { posts: [], groups: [], events: [], comments: [], reactions: [] };
  }
  return (await res.json()) as {
    posts: unknown[];
    groups: unknown[];
    events: unknown[];
    comments: unknown[];
    reactions: unknown[];
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
