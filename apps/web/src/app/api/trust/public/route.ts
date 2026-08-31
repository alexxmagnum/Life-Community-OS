import { NextResponse } from "next/server";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import { TrustSignalService } from "@/lib/trust/trust-signal-service";
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
  if (url.searchParams.get("trustScore") || url.searchParams.get("createdBy")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const personId = url.searchParams.get("personId")?.trim();
  if (!personId) {
    return NextResponse.json({ labels: [] });
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
    return NextResponse.json({ labels: [] });
  }
  const labels = await TrustSignalService.publicLabels({
    tenantId: bound.tenantId,
    territoryId,
    personId,
  });
  return NextResponse.json({ labels });
}
