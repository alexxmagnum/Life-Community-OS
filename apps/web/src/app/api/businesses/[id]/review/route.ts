import { NextResponse } from "next/server";
import type { BusinessProfileStatus } from "@life-community-os/types";
import { actorCanReviewBusiness } from "@/lib/business/permissions";
import { recordAdminAudit } from "@/lib/admin/server-admin-repository";
import {
  getBusinessServer,
  setBusinessStatus,
} from "@/lib/business/server-business-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const ACTIONS: Record<string, BusinessProfileStatus> = {
  approve: "published",
  publish: "published",
  suspend: "suspended",
  archive: "archived",
  reject: "draft",
};

export async function POST(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanReviewBusiness(gated.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: { action?: string; status?: string; tenantId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
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

  const status =
    (body.action && ACTIONS[body.action]) ||
    (body.status === "published" ||
    body.status === "suspended" ||
    body.status === "archived" ||
    body.status === "draft" ||
    body.status === "pending_review"
      ? body.status
      : null);
  if (!status) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const business = await setBusinessStatus({
    tenantId: bound.tenantId,
    businessId: id,
    status,
    scope,
  });
  await recordAdminAudit({
    actor: gated.actor,
    action: status === "published" ? "business.approve" : "business.suspend",
    entityType: "business",
    entityId: id,
    metadata: { status },
    scope,
  });
  return NextResponse.json({ business });
}
