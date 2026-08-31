import { NextResponse } from "next/server";
import {
  CommunityGovernanceService,
  GovernanceDeniedError,
} from "@/lib/governance/community-governance-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    type?: string;
    entityType?: string;
    entityId?: string;
    targetPersonId?: string;
    reportId?: string;
    reason?: string;
    territoryId?: string;
    moderatorId?: string;
    decision?: string;
    safetyLevel?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.moderatorId || body.decision || body.safetyLevel) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: gated.actor.territoryId,
    queryTerritoryId: body.territoryId,
  });
  if ("error" in territory) return territory.error;
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const action = await CommunityGovernanceService.applySafetyAction({
      tenantId: bound.tenantId,
      actor: gated.actor,
      territoryId,
      type: body.type ?? "",
      entityType: body.entityType,
      entityId: body.entityId,
      targetPersonId: body.targetPersonId,
      reportId: body.reportId,
      reason: body.reason,
    });
    return NextResponse.json({ action }, { status: 201 });
  } catch (error) {
    if (error instanceof GovernanceDeniedError) {
      const status = error.message === "invalid" ? 400 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
