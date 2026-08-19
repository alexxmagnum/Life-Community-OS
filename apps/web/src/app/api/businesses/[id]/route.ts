import { NextResponse } from "next/server";
import {
  actorCanEditBusiness,
  actorCanViewBusinesses,
  businessVisibleToActor,
} from "@/lib/business/permissions";
import {
  getBusinessServer,
  updateBusinessProfile,
} from "@/lib/business/server-business-repository";
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
  if (!actorCanViewBusinesses(actor)) {
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
  const business = await getBusinessServer(bound.tenantId, id, scope);
  if (!business || business.tenantId !== bound.tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!businessVisibleToActor(actor, business)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ business });
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
  const existing = await getBusinessServer(bound.tenantId, id, scope);
  if (!existing || existing.tenantId !== bound.tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!actorCanEditBusiness(gated.actor, existing)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    name?: string;
    category?: string;
    description?: string;
    contact?: string;
    hours?: string;
    imageUrl?: string;
    ownerPersonId?: string;
    ownerId?: string;
    status?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.ownerPersonId || body.ownerId) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }
  if (body.status) {
    return NextResponse.json({ error: "status_via_workflow" }, { status: 403 });
  }

  const business = await updateBusinessProfile({
    tenantId: bound.tenantId,
    businessId: id,
    patch: {
      name: body.name,
      category: body.category,
      description: body.description,
      contact: body.contact,
      hours: body.hours,
      imageUrl: body.imageUrl,
    },
    scope,
  });
  return NextResponse.json({ business });
}
