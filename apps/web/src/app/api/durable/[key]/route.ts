import { NextResponse } from "next/server";
import {
  readDurableJson,
  writeDurableJson,
} from "@/lib/durable/server-durable-store";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ key: string }> };

const ALLOWED = new Set([
  "reservations",
  "experience-participation",
  "community-interactions",
  "housing-saves",
  "place-conversations",
  "marketplace-conversations",
  "experience-conversations",
  "group-conversations",
  "neighbour-conversations",
  "official-conversations",
  "work-conversations",
]);

export async function GET(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;

  const { key } = await params;
  if (!ALLOWED.has(key)) {
    return NextResponse.json({ error: "unknown_key" }, { status: 404 });
  }
  const url = new URL(request.url);
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor: gated.actor,
  });
  if ("error" in bound) return bound.error;
  const value = await readDurableJson(bound.tenantId, key);
  return NextResponse.json({ tenantId: bound.tenantId, key, value });
}

export async function PUT(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;

  const { key } = await params;
  if (!ALLOWED.has(key)) {
    return NextResponse.json({ error: "unknown_key" }, { status: 404 });
  }
  let body: { tenantId?: string; value?: unknown };
  try {
    body = (await request.json()) as { tenantId?: string; value?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  await writeDurableJson(bound.tenantId, key, body.value ?? null);
  return NextResponse.json({ tenantId: bound.tenantId, key, ok: true });
}
