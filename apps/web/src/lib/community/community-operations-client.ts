"use client";

import type {
  CommunityAnnouncementAudience,
  CommunityAnnouncementCategory,
  CommunityAnnouncementPriority,
  CommunityOperationsContext,
  TerritoryAnnouncement,
  TerritoryDailyPulse,
} from "@life-community-os/types";

export async function fetchCommunityOperations(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<{
  context: CommunityOperationsContext | null;
  pulse: TerritoryDailyPulse | null;
}> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  const res = await fetch(`/api/community/operations?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return { context: null, pulse: null };
  const data = (await res.json()) as {
    context?: CommunityOperationsContext;
    pulse?: TerritoryDailyPulse;
  };
  return {
    context: data.context ?? null,
    pulse: data.pulse ?? null,
  };
}

export async function fetchTerritoryAnnouncements(input: {
  tenantId: string;
  territoryId?: string | null;
  locationId?: string | null;
}): Promise<TerritoryAnnouncement[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  if (input.locationId?.trim()) {
    params.set("locationId", input.locationId.trim());
  }
  const res = await fetch(`/api/community/announcements?${params.toString()}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { announcements?: TerritoryAnnouncement[] };
  return data.announcements ?? [];
}

export async function createTerritoryAnnouncementRequest(input: {
  tenantId: string;
  title: string;
  body: string;
  category?: CommunityAnnouncementCategory;
  priority?: CommunityAnnouncementPriority;
  audience?: CommunityAnnouncementAudience;
  locationId?: string;
  startsAt?: string;
  endsAt?: string;
  requiresAcknowledgement?: boolean;
}): Promise<{ id: string } | { error: string }> {
  const res = await fetch("/api/community/announcements", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: "forbidden" };
  const data = (await res.json()) as { announcement?: { id: string } };
  if (!data.announcement?.id) return { error: "invalid" };
  return { id: data.announcement.id };
}
