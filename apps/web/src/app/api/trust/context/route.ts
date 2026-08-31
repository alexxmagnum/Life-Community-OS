import { NextResponse } from "next/server";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import {
  TrustDeniedError,
  TrustSignalService,
} from "@/lib/trust/trust-signal-service";
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
    url.searchParams.get("personId") &&
    url.searchParams.get("personId") !== actor.personId
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (url.searchParams.get("trustScore") || url.searchParams.get("createdBy")) {
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
    const context = await TrustSignalService.resolve({
      tenantId: bound.tenantId,
      actor,
      territoryId,
    });
    return NextResponse.json({
      context,
      contribution: TrustSignalService.contribution(context.signals),
    });
  } catch (error) {
    if (error instanceof TrustDeniedError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    privacy?: { visible?: boolean; showSignals?: boolean };
    personId?: string;
    createdBy?: string;
    ownerId?: string;
    trustScore?: number;
    territoryId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (
    body.createdBy ||
    body.ownerId ||
    body.personId ||
    typeof body.trustScore === "number"
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
  const context = await TrustSignalService.savePrivacy({
    tenantId: bound.tenantId,
    actor: gated.actor,
    territoryId,
    privacy: body.privacy ?? {},
  });
  return NextResponse.json({ context });
}
