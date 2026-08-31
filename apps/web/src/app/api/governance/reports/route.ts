import { NextResponse } from "next/server";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import {
  CommunityGovernanceService,
  GovernanceDeniedError,
} from "@/lib/governance/community-governance-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
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
    const reports = await CommunityGovernanceService.listReports({
      tenantId: bound.tenantId,
      actor,
      territoryId,
    });
    return NextResponse.json({ reports });
  } catch (error) {
    if (error instanceof GovernanceDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    entityType?: string;
    entityId?: string;
    reason?: string;
    territoryId?: string;
    personId?: string;
    reporterPersonId?: string;
    createdBy?: string;
    moderatorId?: string;
    decision?: string;
    safetyLevel?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (
    body.personId ||
    body.reporterPersonId ||
    body.createdBy ||
    body.moderatorId ||
    body.decision ||
    body.safetyLevel
  ) {
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
    const report = await CommunityGovernanceService.createReport({
      tenantId: bound.tenantId,
      actor: gated.actor,
      territoryId,
      entityType: body.entityType ?? "",
      entityId: body.entityId ?? "",
      reason: body.reason ?? "other",
    });
    return NextResponse.json(
      { report: { id: report.id, status: report.status } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GovernanceDeniedError) {
      const status =
        error.message === "invalid"
          ? 400
          : error.message === "unauthorized"
            ? 401
            : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
