"use client";

import type { TrustContext } from "@life-community-os/types";

export async function fetchTrustContext(input: {
  tenantId: string;
  territoryId?: string | null;
}): Promise<TrustContext | null> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  const res = await fetch(`/api/trust/context?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { context?: TrustContext };
  return data.context ?? null;
}

export async function patchTrustPrivacy(input: {
  tenantId: string;
  privacy: {
    visible?: boolean;
    showSignals?: boolean;
  };
}): Promise<TrustContext | null> {
  const res = await fetch("/api/trust/context", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify({ privacy: input.privacy }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { context?: TrustContext };
  return data.context ?? null;
}

export async function fetchPublicTrustLabels(input: {
  tenantId: string;
  personId: string;
  territoryId?: string | null;
}): Promise<string[]> {
  const params = new URLSearchParams({
    tenantId: input.tenantId,
    personId: input.personId,
  });
  if (input.territoryId?.trim()) {
    params.set("territoryId", input.territoryId.trim());
  }
  const res = await fetch(`/api/trust/public?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { labels?: string[] };
  return Array.isArray(data.labels) ? data.labels : [];
}
