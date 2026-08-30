"use client";

import type { LifeMapQueryResult } from "@life-community-os/types";

export async function fetchLifeMapContext(input: {
  tenantId: string;
  territoryId?: string | null;
  zoom?: number;
}): Promise<LifeMapQueryResult | null> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  if (input.zoom != null && Number.isFinite(input.zoom)) {
    params.set("zoom", String(input.zoom));
  }
  const res = await fetch(`/api/life-map/context?${params.toString()}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return null;
  return (await res.json()) as LifeMapQueryResult;
}
