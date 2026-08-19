import { NextResponse } from "next/server";
import {
  isHelpRequestStatus,
  isHelpRequestType,
  type HelpRequestStatus,
  type HelpRequestType,
} from "@life-community-os/types";
import {
  actorCanEditHelp,
  actorCanViewHelp,
  helpVisibleToActor,
} from "@/lib/help/permissions";
import {
  getHelpRequestServer,
  updateHelpRequestServer,
} from "@/lib/help/server-help-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewHelp(actor)) {
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
  const item = await getHelpRequestServer(bound.tenantId, id, scope);
  if (!item || !helpVisibleToActor(actor, item)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ request: item });
}

export async function PATCH(request: Request, { params }: Params) {
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
  const existing = await getHelpRequestServer(bound.tenantId, id, scope);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!actorCanEditHelp(gated.actor, existing)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    title?: string;
    description?: string;
    category?: string;
    type?: string;
    status?: string;
    createdBy?: string;
    ownerPersonId?: string;
    ownerId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.createdBy || body.ownerPersonId || body.ownerId) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }

  const item = await updateHelpRequestServer({
    tenantId: bound.tenantId,
    helpId: id,
    patch: {
      title: body.title,
      description: body.description,
      category: body.category,
      type:
        body.type && isHelpRequestType(body.type)
          ? (body.type as HelpRequestType)
          : undefined,
      status:
        body.status && isHelpRequestStatus(body.status)
          ? (body.status as HelpRequestStatus)
          : undefined,
    },
    scope,
  });
  return NextResponse.json({ request: item });
}
