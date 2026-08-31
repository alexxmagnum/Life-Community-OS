"use client";

import type { ExperienceRecord } from "@life-community-os/types";

export async function createExperienceRequest(input: {
  tenantId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  resourceId?: string;
  capacity?: number;
  category?: string;
  publishToCommunity?: boolean;
}): Promise<{ experience: ExperienceRecord } | { error: string }> {
  const res = await fetch("/api/experiences", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      resourceId: input.resourceId,
      capacity: input.capacity,
      category: input.category,
      publishToCommunity: input.publishToCommunity === true,
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
  return (await res.json()) as { experience: ExperienceRecord };
}
