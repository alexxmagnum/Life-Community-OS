import { NextResponse } from "next/server";
import {
  readHousingState,
  writeHousingState,
  type HousingTenantState,
} from "@/lib/housing/server-housing-repository";
import { resolveTenantPublicId } from "@/lib/tenant/ids";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = resolveTenantPublicId(
    url.searchParams.get("tenantId") ??
      resolveRequestTenantSlug(request) ??
      "life-panoramica",
  );
  const state = await readHousingState(tenantId);
  return NextResponse.json({ tenantId, ...state });
}

export async function PUT(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;

  let body: Partial<HousingTenantState> & { tenantId?: string };
  try {
    body = (await request.json()) as Partial<HousingTenantState> & {
      tenantId?: string;
    };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { resolveWriteTenantId } = await import(
    "@/lib/tenant/resolve-write-tenant"
  );
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const tenantId = bound.tenantId;
  const current = await readHousingState(tenantId);
  const next = await writeHousingState(tenantId, {
    created: body.created ?? current.created,
    overrides: body.overrides ?? current.overrides,
    contacts: body.contacts ?? current.contacts,
  });
  return NextResponse.json({ tenantId, ...next });
}
