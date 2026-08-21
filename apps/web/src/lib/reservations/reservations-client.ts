"use client";

import type {
  CommunityResource,
  Reservation,
  ResourceCategory,
  TimeSlot,
} from "@life-community-os/types";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `http_${res.status}`;
  } catch {
    return `http_${res.status}`;
  }
}

export async function fetchResources(input: {
  tenantId: string;
  category?: ResourceCategory | string;
}): Promise<CommunityResource[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.category) params.set("category", input.category);
  const res = await fetch(`/api/resources?${params.toString()}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { resources?: CommunityResource[] };
  return data.resources ?? [];
}

export async function fetchResource(
  tenantId: string,
  resourceId: string,
): Promise<CommunityResource | null> {
  const res = await fetch(
    `/api/resources/${encodeURIComponent(resourceId)}?tenantId=${encodeURIComponent(tenantId)}`,
    { cache: "no-store", headers: { "x-tenant-slug": tenantId } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { resource?: CommunityResource };
  return data.resource ?? null;
}

export async function fetchResourceAvailability(input: {
  tenantId: string;
  resourceId: string;
  date?: string;
}): Promise<TimeSlot[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.date) params.set("date", input.date);
  const res = await fetch(
    `/api/resources/${encodeURIComponent(input.resourceId)}/availability?${params.toString()}`,
    { cache: "no-store", headers: { "x-tenant-slug": input.tenantId } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { slots?: TimeSlot[] };
  return data.slots ?? [];
}

export async function createResourceRequest(input: {
  tenantId: string;
  name: string;
  description: string;
  category: ResourceCategory;
  location?: string;
  areaLabel?: string;
  images?: string[];
  bookingRules?: string[];
  slotMinutes?: number;
  capacity?: number;
  requiresApproval?: boolean;
  linkedResourceId?: string;
  scheduleStartsAt?: string;
  scheduleEndsAt?: string;
  organizerName?: string;
}): Promise<{ resource: CommunityResource } | { error: string }> {
  const res = await fetch("/api/resources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: await parseError(res) };
  return (await res.json()) as { resource: CommunityResource };
}

export async function fetchReservations(input: {
  tenantId: string;
}): Promise<Reservation[]> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  const res = await fetch(`/api/reservations?${params.toString()}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": input.tenantId },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { reservations?: Reservation[] };
  return data.reservations ?? [];
}

export async function createReservationRequest(input: {
  tenantId: string;
  resourceId: string;
  date: string;
  start: string;
  end: string;
  participantCount?: number;
}): Promise<{ reservation: Reservation } | { error: string }> {
  const res = await fetch("/api/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: await parseError(res) };
  return (await res.json()) as { reservation: Reservation };
}

export async function patchReservationRequest(input: {
  tenantId: string;
  reservationId: string;
  status?: string;
  date?: string;
  start?: string;
  end?: string;
  createdBy?: string;
}): Promise<{ reservation?: Reservation } | { error: string }> {
  const res = await fetch(
    `/api/reservations/${encodeURIComponent(input.reservationId)}`,
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
  return (await res.json()) as { reservation?: Reservation };
}
