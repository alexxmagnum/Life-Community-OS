import { NextResponse } from "next/server";
import {
  readDurableJson,
  writeDurableJson,
} from "@/lib/durable/server-durable-store";
import { resolveTenantPublicId } from "@/lib/tenant/ids";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ key: string }> };

const ALLOWED = new Set([
  "reservations",
  "experience-participation",
  "community-interactions",
  "housing-saves",
]);

export async function GET(request: Request, { params }: Params) {
  const { key } = await params;
  if (!ALLOWED.has(key)) {
    return NextResponse.json({ error: "unknown_key" }, { status: 404 });
  }
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      "life-panoramica",
  );
  const value = await readDurableJson(tenantId, key);
  return NextResponse.json({ tenantId, key, value });
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
  const tenantId = resolveTenantPublicId(
    body.tenantId ||
      resolveRequestTenantSlug(request) ||
      gated.actor.tenantSlug,
  );
  await writeDurableJson(tenantId, key, body.value ?? null);
  return NextResponse.json({ tenantId, key, ok: true });
}
