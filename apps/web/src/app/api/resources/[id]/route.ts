import { NextResponse } from "next/server";
import {
  actorCanManageResources,
  actorCanViewResources,
  resourceVisibleToActor,
} from "@/lib/reservations/permissions";
import {
  getResourceServer,
  updateResourceServer,
} from "@/lib/reservations/server-reservations-repository";
import { isResourceProductStatus, type ResourceStatus } from "@life-community-os/types";
import { recordAdminAudit } from "@/lib/admin/server-admin-repository";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewResources(actor)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const resource = await getResourceServer(bound.tenantId, id, scope);
  if (!resource || !resourceVisibleToActor(actor, resource)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ resource });
}

export async function PATCH(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanManageResources(gated.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { resolveWriteTenantId } = await import(
    "@/lib/tenant/resolve-write-tenant"
  );
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const existing = await getResourceServer(bound.tenantId, id, scope);
  if (!existing || !resourceVisibleToActor(gated.actor, existing)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  let body: { name?: string; description?: string; status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.status && !isResourceProductStatus(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const resource = await updateResourceServer({
    tenantId: bound.tenantId,
    resourceId: id,
    name: body.name,
    description: body.description,
    status: body.status as ResourceStatus | undefined,
    scope,
  });
  await recordAdminAudit({
    actor: gated.actor,
    action: body.status === "maintenance" ? "resource.maintenance" : "resource.update",
    entityType: "resource",
    entityId: id,
    metadata: body.status ? { status: body.status } : undefined,
    scope,
  });
  return NextResponse.json({ resource });
}
