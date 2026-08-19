import { NextResponse } from "next/server";
import {
  isMarketplaceListingType,
  type MarketplaceListingType,
} from "@life-community-os/types";
import {
  actorCanCreateMarketplace,
  actorCanViewMarketplace,
  listingVisibleToActor,
} from "@/lib/marketplace/permissions";
import {
  createMarketplaceListingServer,
  listMarketplaceListingsServer,
} from "@/lib/marketplace/server-marketplace-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewMarketplace(actor)) {
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
  const all = await listMarketplaceListingsServer(bound.tenantId, scope);
  const type = url.searchParams.get("type")?.trim();
  const category = url.searchParams.get("category")?.trim().toLowerCase();
  const listings = all.filter((item) => {
    if (item.tenantId !== bound.tenantId) return false;
    if (!listingVisibleToActor(actor, item)) return false;
    if (type && item.type !== type) return false;
    if (category && item.category.toLowerCase() !== category) return false;
    return true;
  });
  return NextResponse.json({ tenantId: bound.tenantId, listings });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateMarketplace(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    type?: string;
    category?: string;
    title?: string;
    description?: string;
    images?: string[];
    price?: number | null;
    locationId?: string;
    ownerPersonId?: string;
    ownerId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const type = body.type?.trim() ?? "";
  if (!title || !description || !isMarketplaceListingType(type)) {
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
  const listing = await createMarketplaceListingServer({
    tenantId: bound.tenantId,
    ownerPersonId: gated.actor.personId,
    ownerPersonIdFromClient: body.ownerPersonId ?? body.ownerId ?? null,
    type: type as MarketplaceListingType,
    category: body.category,
    title,
    description,
    images: body.images,
    price: body.price,
    locationId: body.locationId,
    authorDisplayName:
      gated.actor.currentUser.displayName?.trim() ||
      gated.actor.currentUser.email?.split("@")[0] ||
      "Vecino",
    scope,
  });
  return NextResponse.json({ listing }, { status: 201 });
}
