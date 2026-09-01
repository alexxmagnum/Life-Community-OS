import { NextResponse } from "next/server";
import { CommunityAutomationService } from "@/lib/community/community-automation-service";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import {
  defaultTerritoryIdForIdentity,
  identityTerritoriesForTenant,
} from "@/lib/tenant/territory-catalog";
import { resolveActiveTerritory } from "@life-community-os/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (
    !gated.actor.hasMembership ||
    !actorCanReadCommunityExperienceFeed(gated.actor)
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { previewId?: string; territoryId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const previewId = body.previewId?.trim();
  if (!previewId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bound = resolveReadTenantId({
    request,
    actor: gated.actor,
    queryTenantId: null,
  });
  if ("error" in bound) return bound.error;
  const resolved = resolveActiveTerritory({
    tenantId: bound.tenantId,
    membershipTerritoryId: gated.actor.territoryId,
    selectedTerritoryId: body.territoryId,
    defaultTerritoryId: defaultTerritoryIdForIdentity(bound.tenantId),
    territories: identityTerritoriesForTenant(bound.tenantId),
    capabilities: gated.actor.permissions,
  });
  if (!resolved.ok || !resolved.context.territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const result = await CommunityAutomationService.confirm({
    tenantId: bound.tenantId,
    actor: gated.actor,
    territoryId: resolved.context.territoryId,
    previewId,
  });
  if (!result.ok) {
    const status =
      result.error === "forbidden" || result.error === "recommendations_disabled"
        ? 403
        : result.error === "already_delivered"
          ? 409
          : 404;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
