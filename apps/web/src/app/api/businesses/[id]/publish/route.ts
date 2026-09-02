import { NextResponse } from "next/server";
import {
  actorCanPublishBusiness,
} from "@/lib/business/permissions";
import {
  getBusinessServer,
  setBusinessStatus,
} from "@/lib/business/server-business-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;

  const { id } = await params;
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const existing = await getBusinessServer(bound.tenantId, id, scope);
  if (!existing || existing.tenantId !== bound.tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!actorCanPublishBusiness(gated.actor, existing)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }

  const business = await setBusinessStatus({
    tenantId: bound.tenantId,
    businessId: id,
    status: "pending_review",
    scope,
  });
  return NextResponse.json({ business });
}
