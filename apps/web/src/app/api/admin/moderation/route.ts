import { NextResponse } from "next/server";
import { actorCanAccessSection } from "@/lib/admin/permissions";
import { listCommunitySnapshot } from "@/lib/community/server-community-repository";
import { listHelpRequestsServer } from "@/lib/help/server-help-repository";
import { listMarketplaceListingsServer } from "@/lib/marketplace/server-marketplace-repository";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanAccessSection(actor, "moderation")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: new URL(request.url).searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const [community, listings, help] = await Promise.all([
    listCommunitySnapshot(bound.tenantId, scope),
    listMarketplaceListingsServer(bound.tenantId, scope),
    listHelpRequestsServer(bound.tenantId, scope),
  ]);
  return NextResponse.json({
    posts: community.posts.filter((item) => item.tenantId === bound.tenantId),
    comments: community.comments.filter((item) => item.tenantId === bound.tenantId),
    listings: listings.filter((item) => item.tenantId === bound.tenantId),
    help: help.filter((item) => item.tenantId === bound.tenantId),
  });
}
