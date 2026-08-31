"use client";

import type { LifePlaceContext } from "@life-community-os/types";

export async function fetchLifePlace(input: {
  tenantId: string;
  locationId: string;
  territoryId?: string | null;
}): Promise<LifePlaceContext | null> {
  const locationId = input.locationId.trim();
  if (!locationId) return null;
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  const res = await fetch(
    `/api/life-places/${encodeURIComponent(locationId)}?${params.toString()}`,
    {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "x-tenant-slug": input.tenantId },
    },
  );
  if (!res.ok) return null;
  const payload = (await res.json()) as LifePlaceContext & {
    activity?: LifePlaceContext["currentActivity"];
  };
  if (!payload.currentActivity && Array.isArray(payload.activity)) {
    payload.currentActivity = payload.activity;
  }
  return payload;
}
