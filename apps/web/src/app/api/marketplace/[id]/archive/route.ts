import { NextResponse } from "next/server";
import { actorCanEditListing } from "@/lib/marketplace/permissions";
import {
  getMarketplaceListingServer,
  updateMarketplaceListingServer,
} from "@/lib/marketplace/server-marketplace-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
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
  const existing = await getMarketplaceListingServer(bound.tenantId, id, scope);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!actorCanEditListing(gated.actor, existing)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const listing = await updateMarketplaceListingServer({
    tenantId: bound.tenantId,
    listingId: id,
    patch: { status: "archived" },
    scope,
  });
  return NextResponse.json({ listing });
}
