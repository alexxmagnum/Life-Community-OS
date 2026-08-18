/**
 * Client helper — hydrate/push durable provider state via /api/durable/:key
 * Always scoped to the active tenant (cookie / explicit slug).
 */

function resolveClientTenantSlug(explicit?: string): string {
  const trimmed = explicit?.trim().toLowerCase();
  if (trimmed) return trimmed;
  if (typeof document !== "undefined") {
    const match = document.cookie
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith("lcos-tenant-slug="));
    if (match) {
      return decodeURIComponent(match.slice("lcos-tenant-slug=".length)).toLowerCase();
    }
  }
  return "life-panoramica";
}

export async function hydrateDurableState<T>(
  key: string,
  tenantId?: string,
): Promise<T | null> {
  const tenant = resolveClientTenantSlug(tenantId);
  try {
    const res = await fetch(
      `/api/durable/${encodeURIComponent(key)}?tenantId=${encodeURIComponent(tenant)}`,
      {
        cache: "no-store",
        headers: { "x-tenant-slug": tenant },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { value?: T | null };
    return (data.value ?? null) as T | null;
  } catch {
    return null;
  }
}

export function pushDurableState(
  key: string,
  value: unknown,
  tenantId?: string,
): void {
  if (typeof window === "undefined") return;
  const tenant = resolveClientTenantSlug(tenantId);
  void fetch(`/api/durable/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": tenant,
    },
    body: JSON.stringify({ tenantId: tenant, value }),
  }).catch(() => undefined);
}
