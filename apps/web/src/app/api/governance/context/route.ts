import { NextResponse } from "next/server";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import {
  CommunityGovernanceService,
  GovernanceDeniedError,
} from "@/lib/governance/community-governance-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanReadCommunityExperienceFeed(actor)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  if (
    url.searchParams.get("moderatorId") ||
    url.searchParams.get("decision") ||
    url.searchParams.get("safetyLevel")
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
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
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const context = await CommunityGovernanceService.resolve({
      tenantId: bound.tenantId,
      actor,
      territoryId,
    });
    return NextResponse.json({ context });
  } catch (error) {
    if (error instanceof GovernanceDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
