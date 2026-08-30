import { NextResponse } from "next/server";
import type { LocationType } from "@life-community-os/types";
import {
  actorCanCreateBusiness,
  actorCanViewBusinesses,
  businessVisibleToActor,
  isTenantStaffRole,
} from "@/lib/business/permissions";
import {
  createRegisteredBusiness,
  listBusinessesServer,
} from "@/lib/business/server-business-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
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
  const all = await listBusinessesServer(bound.tenantId, scope);
  const category = url.searchParams.get("category")?.trim().toLowerCase();
  const categories = url.searchParams.getAll("category").map((item) =>
    item.trim().toLowerCase(),
  );
  const status = url.searchParams.get("status")?.trim();
  const locationId = url.searchParams.get("locationId")?.trim();
  const staff = isTenantStaffRole(actor.role);
  const visible = filterForActiveTerritory(all, territory.context.territoryId).filter(
    (item) => {
    if (item.tenantId !== bound.tenantId) return false;
    if (!businessVisibleToActor(actor, item)) return false;
    if (locationId && item.locationId !== locationId) return false;
    if (status) {
      if (status !== "published" && !staff && item.ownerPersonId !== actor.personId) {
        return false;
      }
      if (item.status !== status) return false;
    }
    const wanted =
      categories.length > 0
        ? categories
        : category
          ? [category]
          : [];
    if (wanted.length > 0 && !wanted.includes(item.category.toLowerCase())) {
      return false;
    }
    return true;
  });
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: territory.context.territoryId,
    businesses: visible,
  });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateBusiness(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    name?: string;
    category?: string;
    description?: string;
    contact?: string;
    hours?: string;
    imageUrl?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    type?: LocationType;
    geocodeProvider?: string;
    geocodeSourceRef?: string;
    geocodeDisplayName?: string;
    areaLabel?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const category = body.category?.trim() ?? "";
  const address = body.address?.trim() ?? "";
  if (!name || !category || !address) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (!Number.isFinite(body.latitude) || !Number.isFinite(body.longitude)) {
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
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

  try {
    const created = await createRegisteredBusiness({
      tenantId: bound.tenantId,
      ownerPersonId: gated.actor.personId,
      name,
      category,
      description: body.description,
      contact: body.contact,
      hours: body.hours,
      imageUrl: body.imageUrl,
      address,
      latitude: body.latitude as number,
      longitude: body.longitude as number,
      type: body.type,
      geocodeProvider: body.geocodeProvider,
      geocodeSourceRef: body.geocodeSourceRef,
      geocodeDisplayName: body.geocodeDisplayName,
      areaLabel: body.areaLabel,
      territoryId: resolveStampTerritoryId({
        tenantId: bound.tenantId,
        inherited: gated.actor.territoryId,
      }),
      scope,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
