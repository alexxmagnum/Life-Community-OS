import { NextResponse } from "next/server";
import { projectLifePlaceExperienceView } from "@life-community-os/types";
import { LifePlaceQueryService } from "@/lib/life-place/life-place-query";
import { actorCanOpenLifePlace } from "@/lib/life-place/permissions";
import { PersonalizationService } from "@/lib/personal/personalization-service";
import { getTenantPack } from "@/lib/tenant/registry";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

type Params = { params: Promise<{ locationId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { locationId } = await params;
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanOpenLifePlace(actor)) {
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
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const pack = getTenantPack(bound.tenantId);
  const result = await LifePlaceQueryService.get({
    tenantId: bound.tenantId,
    territoryId,
    locationId,
    actor,
    productCapabilities: pack?.productCapabilities,
    permissions: actor.permissions,
    scope,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const context = await PersonalizationService.place({
    tenantId: bound.tenantId,
    actor,
    territoryId,
    place: result.context,
  });
  return NextResponse.json({
    ...context,
    experienceView: projectLifePlaceExperienceView(context),
    location: context.location,
    activity: context.currentActivity,
    experiences: context.experiences,
    resources: context.resources,
    reservations: context.reservations,
    business: context.business,
    actions: context.actions,
  });
}
