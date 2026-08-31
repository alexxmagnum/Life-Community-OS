"use client";

import type {
  LocalServiceCard,
  LocalServicesContext,
} from "@life-community-os/types";

export async function fetchLocalServices(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<{
  context: LocalServicesContext | null;
  cards: LocalServiceCard[];
}> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  const res = await fetch(`/api/economy/local-services?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return { context: null, cards: [] };
  const data = (await res.json()) as {
    context?: LocalServicesContext;
    cards?: LocalServiceCard[];
  };
  return {
    context: data.context ?? null,
    cards: Array.isArray(data.cards) ? data.cards : [],
  };
}
