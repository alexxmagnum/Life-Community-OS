import { NextResponse } from "next/server";
import {
  isHousingAvailability,
  isHousingPropertyType,
  toPropertyPublicView,
  type HousingAvailability,
  type HousingPropertyType,
} from "@life-community-os/types";
import {
  actorCanCreateProperty,
  actorCanViewHousing,
  actorMembership,
  propertyVisibleToActor,
} from "@/lib/housing/permissions";
import {
  createRegisteredProperty,
  listHousingStore,
} from "@/lib/housing/server-housing-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
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
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: actor.territoryId,
    queryTerritoryId: url.searchParams.get("territoryId"),
  });
  if ("error" in territory) return territory.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const store = await listHousingStore(bound.tenantId, scope);
  const mine = url.searchParams.get("mine") === "1";
  const type = url.searchParams.get("type")?.trim();
  const availability = url.searchParams.get("availability")?.trim();
  const scopedProperties = filterForActiveTerritory(
    store.properties,
    territory.context.territoryId,
  );
  const properties = scopedProperties.flatMap((item) => {
    if (item.tenantId !== bound.tenantId) return [];
    if (!propertyVisibleToActor(actor, item, store.memberships)) return [];
    const role = actorMembership(actor, store.memberships, item.id)
      ?.relationshipType;
    if (mine && !role) return [];
    if (type && item.propertyType !== type) return [];
    if (availability && item.availability !== availability) return [];
    const view = toPropertyPublicView(item, role);
    return view ? [view] : [];
  });
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: territory.context.territoryId,
    properties,
  });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateProperty(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    title?: string;
    description?: string;
    propertyType?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    availability?: string;
    images?: string[];
    bedrooms?: number;
    bathrooms?: number;
    builtAreaM2?: number;
    areaLabel?: string;
    unitLabel?: string;
    geocodeProvider?: string;
    geocodeSourceRef?: string;
    geocodeDisplayName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const address = body.address?.trim() ?? "";
  const propertyType = body.propertyType?.trim() ?? "";
  if (
    !title ||
    !description ||
    !address ||
    !isHousingPropertyType(propertyType) ||
    !Number.isFinite(body.latitude) ||
    !Number.isFinite(body.longitude)
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
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
  const created = await createRegisteredProperty({
    tenantId: bound.tenantId,
    createdBy: gated.actor.personId,
    title,
    description,
    propertyType: propertyType as HousingPropertyType,
    address,
    latitude: body.latitude as number,
    longitude: body.longitude as number,
    availability:
      body.availability && isHousingAvailability(body.availability)
        ? (body.availability as HousingAvailability)
        : "private",
    images: body.images,
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
    builtAreaM2: body.builtAreaM2,
    areaLabel: body.areaLabel,
    unitLabel: body.unitLabel,
    geocodeProvider: body.geocodeProvider,
    geocodeSourceRef: body.geocodeSourceRef,
    geocodeDisplayName: body.geocodeDisplayName,
    scope,
  });
  const view = toPropertyPublicView(created.property, "owner");
  return NextResponse.json(
    {
      property: view,
      locationId: created.location.id,
    },
    { status: 201 },
  );
}
