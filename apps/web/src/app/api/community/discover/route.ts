import { NextResponse } from "next/server";
import { guestCanAccess } from "@life-community-os/types";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import { DiscoverExperienceService } from "@/lib/community/discover-experience-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (
    !actorCanReadCommunityExperienceFeed(actor) &&
    !guestCanAccess({
      resource: "public_place",
      hasActiveMembership: actor.hasMembership,
    })
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const discover = await DiscoverExperienceService.fromRequest({
    tenantId: bound.tenantId,
    actor,
    queryTerritoryId: url.searchParams.get("territoryId"),
  });
  if (!discover) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ discover });
}
