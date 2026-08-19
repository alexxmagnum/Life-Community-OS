import { NextResponse } from "next/server";
import {
  isPropertyMembershipRole,
  type PropertyPersonRelationshipType,
} from "@life-community-os/types";
import { actorCanManageMembers } from "@/lib/housing/permissions";
import {
  addPropertyMemberServer,
  getPropertyServer,
} from "@/lib/housing/server-housing-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
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
  const existing = await getPropertyServer(bound.tenantId, id, scope);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!actorCanManageMembers(gated.actor, existing.property, existing.memberships)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    personId?: string;
    role?: string;
    relationshipType?: string;
    ownerPersonId?: string;
    createdBy?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.createdBy || body.ownerPersonId) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }
  const personId = body.personId?.trim() ?? "";
  const role = (body.relationshipType ?? body.role ?? "").trim();
  if (!personId || !isPropertyMembershipRole(role)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const membership = await addPropertyMemberServer({
    tenantId: bound.tenantId,
    propertyId: id,
    personId,
    relationshipType: role as PropertyPersonRelationshipType,
    createdBy: gated.actor.personId,
    scope,
  });
  return NextResponse.json({ membership }, { status: 201 });
}
