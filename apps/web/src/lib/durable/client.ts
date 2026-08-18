/**
 * Client helper — hydrate/push durable provider state via /api/durable/:key
 */

const TENANT = "life-panoramica";

export async function hydrateDurableState<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(
      `/api/durable/${encodeURIComponent(key)}?tenantId=${encodeURIComponent(TENANT)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { value?: T | null };
    return (data.value ?? null) as T | null;
  } catch {
    return null;
  }
}

export function pushDurableState(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  void fetch(`/api/durable/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId: TENANT, value }),
  }).catch(() => undefined);
}
