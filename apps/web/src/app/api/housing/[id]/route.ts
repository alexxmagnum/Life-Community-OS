import { NextResponse } from "next/server";
import {
  isHousingAvailability,
  isHousingPropertyStatus,
  isHousingPropertyType,
  toPropertyPublicView,
  type HousingAvailability,
  type HousingPropertyStatus,
  type HousingPropertyType,
} from "@life-community-os/types";
import {
  actorCanEditProperty,
  actorCanViewHousing,
  actorMembership,
  canSeePropertyHousehold,
  propertyVisibleToActor,
} from "@/lib/housing/permissions";
import {
  getPropertyServer,
  updatePropertyServer,
} from "@/lib/housing/server-housing-repository";
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
  if (!actorCanViewHousing(actor)) {
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
  const found = await getPropertyServer(bound.tenantId, id, scope);
  if (!found || !propertyVisibleToActor(actor, found.property, found.memberships)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const role = actorMembership(actor, found.memberships, found.property.id)
    ?.relationshipType;
  const view = toPropertyPublicView(found.property, role);
  if (!view) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const household = canSeePropertyHousehold(
    actor,
    found.property,
    found.memberships,
  )
    ? found.memberships.filter((item) => item.status === "active")
    : undefined;
  return NextResponse.json({
    property: view,
    ...(household ? { memberships: household } : {}),
  });
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
  const existing = await getPropertyServer(bound.tenantId, id, scope);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!actorCanEditProperty(gated.actor, existing.property, existing.memberships)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    title?: string;
    description?: string;
    propertyType?: string;
    status?: string;
    availability?: string;
    images?: string[];
    bedrooms?: number;
    bathrooms?: number;
    builtAreaM2?: number;
    areaLabel?: string;
    unitLabel?: string;
    ownerPersonId?: string;
    ownerId?: string;
    createdBy?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.ownerPersonId || body.ownerId || body.createdBy) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }

  const property = await updatePropertyServer({
    tenantId: bound.tenantId,
    propertyId: id,
    patch: {
      title: body.title,
      description: body.description,
      propertyType:
        body.propertyType && isHousingPropertyType(body.propertyType)
          ? (body.propertyType as HousingPropertyType)
          : undefined,
      status:
        body.status && isHousingPropertyStatus(body.status)
          ? (body.status as HousingPropertyStatus)
          : undefined,
      availability:
        body.availability && isHousingAvailability(body.availability)
          ? (body.availability as HousingAvailability)
          : undefined,
      images: body.images,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      builtAreaM2: body.builtAreaM2,
      areaLabel: body.areaLabel,
      unitLabel: body.unitLabel,
    },
    scope,
  });
  const role = actorMembership(
    gated.actor,
    existing.memberships,
    id,
  )?.relationshipType;
  return NextResponse.json({
    property: property ? toPropertyPublicView(property, role) : null,
  });
}
