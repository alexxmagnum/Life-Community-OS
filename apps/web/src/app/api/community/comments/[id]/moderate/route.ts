import { NextResponse } from "next/server";
import { canModerateCommunity } from "@/lib/community/permissions";
import { moderateCommunityComment } from "@/lib/community/server-community-repository";
import { recordAdminAudit } from "@/lib/admin/server-admin-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!canModerateCommunity(gated.actor.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  let body: { status?: string; tenantId?: string; reason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const status =
    body.status === "archived" || body.status === "published"
      ? body.status
      : "hidden";
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
  const comment = await moderateCommunityComment({
    tenantId: bound.tenantId,
    commentId: id,
    status,
    scope,
  });
  if (!comment) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await recordAdminAudit({
    actor: gated.actor,
    action:
      status === "published"
        ? "content.restore"
        : status === "archived"
          ? "content.archive"
          : "content.hide",
    entityType: "comment",
    entityId: id,
    reason: body.reason,
    scope,
  });
  return NextResponse.json({ comment });
}
