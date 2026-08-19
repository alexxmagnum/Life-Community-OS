"use client";

import type { BusinessProfile } from "@life-community-os/types";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `http_${res.status}`;
  } catch {
    return `http_${res.status}`;
  }
}

export async function fetchBusinesses(input: {
  tenantId: string;
  category?: string;
  categories?: readonly string[];
  status?: string;
  locationId?: string;
}): Promise<BusinessProfile[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.status) params.set("status", input.status);
  if (input.locationId) params.set("locationId", input.locationId);
  if (input.category) params.set("category", input.category);
  for (const category of input.categories ?? []) {
    params.append("category", category);
  }
  const res = await fetch(`/api/businesses?${params.toString()}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { businesses?: BusinessProfile[] };
  return data.businesses ?? [];
}

export async function fetchBusiness(
  tenantId: string,
  businessId: string,
): Promise<BusinessProfile | null> {
  const res = await fetch(
    `/api/businesses/${encodeURIComponent(businessId)}?tenantId=${encodeURIComponent(tenantId)}`,
    { cache: "no-store", headers: { "x-tenant-slug": tenantId } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { business?: BusinessProfile };
  return data.business ?? null;
}

export async function createBusinessRequest(input: {
  tenantId: string;
  name: string;
  category: string;
  description?: string;
  contact?: string;
  hours?: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  geocodeProvider?: string;
  geocodeSourceRef?: string;
  geocodeDisplayName?: string;
  ownerPersonId?: string;
}): Promise<
  | { business: BusinessProfile; locationId: string }
  | { error: string }
> {
  const res = await fetch("/api/businesses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: await parseError(res) };
  const data = (await res.json()) as {
    business: BusinessProfile;
    location: { id: string };
  };
  return { business: data.business, locationId: data.location.id };
}

export async function patchBusinessRequest(input: {
  tenantId: string;
  businessId: string;
  name?: string;
  category?: string;
  description?: string;
  contact?: string;
  hours?: string;
  imageUrl?: string;
  ownerPersonId?: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(
    `/api/businesses/${encodeURIComponent(input.businessId)}`,
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

export async function publishBusinessRequest(input: {
  tenantId: string;
  businessId: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(
    `/api/businesses/${encodeURIComponent(input.businessId)}/publish`,
    {
      method: "POST",
      headers: { "x-tenant-slug": input.tenantId },
    },
  );
  if (!res.ok) return { error: await parseError(res) };
  return { ok: true };
}

export async function reviewBusinessRequest(input: {
  tenantId: string;
  businessId: string;
  action: "approve" | "suspend" | "archive" | "reject";
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(
    `/api/businesses/${encodeURIComponent(input.businessId)}/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": input.tenantId,
      },
      body: JSON.stringify({ action: input.action }),
    },
  );
  if (!res.ok) return { error: await parseError(res) };
  return { ok: true };
}
