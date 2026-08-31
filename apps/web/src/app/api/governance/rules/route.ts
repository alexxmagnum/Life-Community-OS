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
    return NextResponse.json({ rules: context.rules });
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
    title?: string;
    description?: string;
    territoryId?: string;
    moderatorId?: string;
    decision?: string;
    safetyLevel?: string;
    createdBy?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.moderatorId || body.decision || body.safetyLevel || body.createdBy) {
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
    const rule = await CommunityGovernanceService.createRule({
      tenantId: bound.tenantId,
      actor: gated.actor,
      territoryId,
      title: body.title ?? "",
      description: body.description ?? "",
    });
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    if (error instanceof GovernanceDeniedError) {
      const status = error.message === "invalid" ? 400 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
