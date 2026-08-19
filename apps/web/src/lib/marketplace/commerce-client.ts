"use client";

import type {
  HelpRequest,
  MarketplaceListing,
  MarketplaceListingType,
} from "@life-community-os/types";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `http_${res.status}`;
  } catch {
    return `http_${res.status}`;
  }
}

export async function fetchMarketplaceListings(input: {
  tenantId: string;
  type?: string;
  category?: string;
}): Promise<MarketplaceListing[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.type) params.set("type", input.type);
  if (input.category) params.set("category", input.category);
  const res = await fetch(`/api/marketplace?${params.toString()}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { listings?: MarketplaceListing[] };
  return data.listings ?? [];
}

export async function fetchMarketplaceListing(
  tenantId: string,
  listingId: string,
): Promise<MarketplaceListing | null> {
  const res = await fetch(
    `/api/marketplace/${encodeURIComponent(listingId)}?tenantId=${encodeURIComponent(tenantId)}`,
    { cache: "no-store", headers: { "x-tenant-slug": tenantId } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { listing?: MarketplaceListing };
  return data.listing ?? null;
}

export async function createMarketplaceListingRequest(input: {
  tenantId: string;
  type: MarketplaceListingType;
  title: string;
  description: string;
  category?: string;
  images?: string[];
  price?: number | null;
  ownerPersonId?: string;
}): Promise<{ listing: MarketplaceListing } | { error: string }> {
  const res = await fetch("/api/marketplace", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: await parseError(res) };
  return (await res.json()) as { listing: MarketplaceListing };
}

export async function patchMarketplaceListingRequest(input: {
  tenantId: string;
  listingId: string;
  title?: string;
  description?: string;
  price?: number | null;
  ownerPersonId?: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(
    `/api/marketplace/${encodeURIComponent(input.listingId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": input.tenantId,
      },
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) return { error: await parseError(res) };
  return { ok: true };
}

export async function archiveMarketplaceListingRequest(input: {
  tenantId: string;
  listingId: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(
    `/api/marketplace/${encodeURIComponent(input.listingId)}/archive`,
    {
      method: "POST",
      headers: { "x-tenant-slug": input.tenantId },
    },
  );
  if (!res.ok) return { error: await parseError(res) };
  return { ok: true };
}

export async function fetchHelpRequest(
  tenantId: string,
  helpId: string,
): Promise<HelpRequest | null> {
  const res = await fetch(
    `/api/help/${encodeURIComponent(helpId)}?tenantId=${encodeURIComponent(tenantId)}`,
    { cache: "no-store", headers: { "x-tenant-slug": tenantId } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { request?: HelpRequest };
  return data.request ?? null;
}

export async function fetchHelpRequests(input: {
  tenantId: string;
  type?: string;
  category?: string;
  board?: "work" | "help";
}): Promise<HelpRequest[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.type) params.set("type", input.type);
  if (input.category) params.set("category", input.category);
  if (input.board) params.set("board", input.board);
  const res = await fetch(`/api/help?${params.toString()}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { requests?: HelpRequest[] };
  return data.requests ?? [];
}

export async function createHelpRequestRequest(input: {
  tenantId: string;
  type: "offer_help" | "need_help";
  title: string;
  description: string;
  category?: string;
  createdBy?: string;
  ownerPersonId?: string;
}): Promise<{ request: HelpRequest } | { error: string }> {
  const res = await fetch("/api/help", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: await parseError(res) };
  return (await res.json()) as { request: HelpRequest };
}

export async function patchHelpRequestRequest(input: {
  tenantId: string;
  helpId: string;
  title?: string;
  description?: string;
  status?: string;
  ownerPersonId?: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(`/api/help/${encodeURIComponent(input.helpId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: await parseError(res) };
  return { ok: true };
}

export function listingPriceLabel(price: number | null): string | undefined {
  if (price === null || !Number.isFinite(price)) return undefined;
  return `${price} €`;
}

export function listingImageUrl(images: string[]): string {
  return images[0]?.trim() || "";
}
