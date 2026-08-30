"use client";

import type {
  HousingAvailability,
  HousingPropertyType,
  PropertyMembership,
  PropertyPublicView,
} from "@life-community-os/types";
import { preferEntityMediaUrl } from "@/lib/media/media-policy";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `http_${res.status}`;
  } catch {
    return `http_${res.status}`;
  }
}

export async function fetchHousingProperties(input: {
  tenantId: string;
  territoryId?: string | null;
  mine?: boolean;
  type?: string;
  availability?: string;
}): Promise<PropertyPublicView[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.territoryId?.trim()) params.set("territoryId", input.territoryId.trim());
  if (input.mine) params.set("mine", "1");
  if (input.type) params.set("type", input.type);
  if (input.availability) params.set("availability", input.availability);
  const res = await fetch(`/api/housing?${params.toString()}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { properties?: PropertyPublicView[] };
  return data.properties ?? [];
}

export async function fetchHousingProperty(
  tenantId: string,
  propertyId: string,
): Promise<{
  property: PropertyPublicView;
  memberships?: PropertyMembership[];
} | null> {
  const res = await fetch(
    `/api/housing/${encodeURIComponent(propertyId)}?tenantId=${encodeURIComponent(tenantId)}`,
    { cache: "no-store", headers: { "x-tenant-slug": tenantId } },
  );
  if (!res.ok) return null;
  return (await res.json()) as {
    property: PropertyPublicView;
    memberships?: PropertyMembership[];
  };
}

export async function createHousingPropertyRequest(input: {
  tenantId: string;
  title: string;
  description: string;
  propertyType: HousingPropertyType;
  address: string;
  latitude: number;
  longitude: number;
  availability?: HousingAvailability;
  bedrooms?: number;
  areaLabel?: string;
  geocodeProvider?: string;
  geocodeSourceRef?: string;
  geocodeDisplayName?: string;
}): Promise<{ property: PropertyPublicView } | { error: string }> {
  const res = await fetch("/api/housing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: await parseError(res) };
  return (await res.json()) as { property: PropertyPublicView };
}

export async function patchHousingPropertyRequest(input: {
  tenantId: string;
  propertyId: string;
  title?: string;
  description?: string;
  status?: string;
  availability?: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(
    `/api/housing/${encodeURIComponent(input.propertyId)}`,
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

export async function addHousingMemberRequest(input: {
  tenantId: string;
  propertyId: string;
  personId: string;
  role: string;
}): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(
    `/api/housing/${encodeURIComponent(input.propertyId)}/members`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": input.tenantId,
      },
      body: JSON.stringify({
        personId: input.personId,
        relationshipType: input.role,
      }),
    },
  );
  if (!res.ok) return { error: await parseError(res) };
  return { ok: true };
}

export function propertyCoverUrl(
  property: PropertyPublicView,
  mediaUrl?: string,
): string | undefined {
  return preferEntityMediaUrl(mediaUrl, property.images[0]);
}

export function propertyFacts(property: PropertyPublicView): string[] {
  const facts: string[] = [];
  if (property.bedrooms != null) facts.push(`${property.bedrooms} hab.`);
  if (property.bathrooms != null) facts.push(`${property.bathrooms} baños`);
  if (property.builtAreaM2 != null) facts.push(`${property.builtAreaM2} m²`);
  return facts;
}
