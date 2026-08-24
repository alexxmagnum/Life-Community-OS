import type { Incident, IncidentPriority } from "./server-incidents-repository";

async function errorFrom(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `http_${response.status}`;
  } catch {
    return `http_${response.status}`;
  }
}

export async function fetchIncidents(tenantId: string): Promise<Incident[]> {
  const response = await fetch(`/api/incidents?tenantId=${encodeURIComponent(tenantId)}`, {
    cache: "no-store",
    headers: { "x-tenant-slug": tenantId },
  });
  if (!response.ok) return [];
  const body = (await response.json()) as { incidents?: Incident[] };
  return body.incidents ?? [];
}

export async function createIncidentRequest(input: {
  tenantId: string;
  category: string;
  priority?: IncidentPriority;
  description: string;
  locationId?: string;
  attachmentIds?: string[];
}): Promise<{ incident: Incident } | { error: string }> {
  const response = await fetch("/api/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": input.tenantId,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) return { error: await errorFrom(response) };
  return (await response.json()) as { incident: Incident };
}
