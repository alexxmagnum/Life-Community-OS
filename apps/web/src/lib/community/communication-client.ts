/**
 * Community communication client fetchers.
 */

import type {
  CommunityChannelContext,
  CommunityCommunicationContext,
} from "@life-community-os/types";

export async function fetchCommunityCommunication(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<CommunityCommunicationContext | null> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId) params.set("territoryId", input.territoryId);
  const res = await fetch(`/api/community/communication?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { communication?: CommunityCommunicationContext };
  return data.communication ?? null;
}

export async function fetchCommunityChannels(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<CommunityChannelContext[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId) params.set("territoryId", input.territoryId);
  const res = await fetch(`/api/community/channels?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { channels?: CommunityChannelContext[] };
  return Array.isArray(data.channels) ? data.channels : [];
}

export async function sendCommunityMessage(input: {
  tenantId: string;
  territoryId?: string;
  conversationId?: string;
  contextType?: string;
  contextId?: string;
  content: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const res = await fetch("/api/community/messages", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { message?: { id: string }; error?: string };
  if (!res.ok) return { ok: false, error: data.error ?? "error" };
  return { ok: true, messageId: data.message?.id };
}

export async function reportCommunityMessage(input: {
  tenantId: string;
  territoryId: string;
  messageId: string;
  reason?: string;
}): Promise<{ ok: boolean; reportId?: string; error?: string }> {
  const res = await fetch("/api/community/messages/report", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { report?: { id: string }; error?: string };
  if (!res.ok) return { ok: false, error: data.error ?? "error" };
  return { ok: true, reportId: data.report?.id };
}

export async function publishCommunityAnnouncement(input: {
  tenantId: string;
  title: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/community/announcements", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    return { ok: false, error: data.error ?? "error" };
  }
  return { ok: true };
}
