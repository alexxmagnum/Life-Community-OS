import { NextResponse } from "next/server";
import { CommunityCommunicationService } from "@/lib/community/community-communication-service";
import { GovernanceDeniedError } from "@/lib/governance/community-governance-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    tenantId?: string;
    territoryId?: string;
    messageId?: string;
    reason?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const messageId = body.messageId?.trim();
  if (!messageId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: gated.actor.territoryId,
    queryTerritoryId: body.territoryId ?? null,
  });
  if ("error" in territory) return territory.error;
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const report = await CommunityCommunicationService.reportMessage({
      tenantId: bound.tenantId,
      actor: gated.actor,
      territoryId,
      messageId,
      reason: body.reason,
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof GovernanceDeniedError) {
      const status =
        error.message === "unauthorized"
          ? 401
          : error.message === "not_found"
            ? 404
            : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    const message = error instanceof Error ? error.message : "error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
