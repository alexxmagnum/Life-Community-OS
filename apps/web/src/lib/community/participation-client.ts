"use client";

import type { CommunityParticipationContext } from "@life-community-os/types";
import { occupyingParticipationCount } from "@life-community-os/types";

export async function fetchParticipationContext(input: {
  tenantId: string;
  entityType: CommunityParticipationContext["entityType"];
  entityId: string;
}): Promise<{
  context: CommunityParticipationContext;
  visiblePersonIds: string[];
} | null> {
  const params = new URLSearchParams({
    tenantId: input.tenantId,
    entityType: input.entityType,
    entityId: input.entityId,
  });
  const res = await fetch(`/api/community/participation?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    context: CommunityParticipationContext;
    visiblePersonIds: string[];
  };
}

export async function joinParticipationRequest(input: {
  tenantId: string;
  entityType: CommunityParticipationContext["entityType"];
  entityId: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch("/api/community/participation", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify({
      entityType: input.entityType,
      entityId: input.entityId,
    }),
  });
  if (!res.ok) {
    try {
      const data = (await res.json()) as { error?: string };
      return { error: data.error ?? `http_${res.status}` };
    } catch {
      return { error: `http_${res.status}` };
    }
  }
  return { ok: true };
}

export async function inviteParticipationRequest(input: {
  tenantId: string;
  entityType: CommunityParticipationContext["entityType"];
  entityId: string;
  inviteePersonId: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch("/api/community/participation/invite", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify({
      entityType: input.entityType,
      entityId: input.entityId,
      inviteePersonId: input.inviteePersonId,
    }),
  });
  if (!res.ok) {
    try {
      const data = (await res.json()) as { error?: string };
      return { error: data.error ?? `http_${res.status}` };
    } catch {
      return { error: `http_${res.status}` };
    }
  }
  return { ok: true };
}

export function participationCountLabel(
  context: CommunityParticipationContext | null,
): string {
  if (!context) return "";
  const count = occupyingParticipationCount(context.participants);
  if (count <= 0) return "Sé la primera persona en unirte";
  return count === 1
    ? "1 persona apuntada"
    : `${count} personas apuntadas`;
}
