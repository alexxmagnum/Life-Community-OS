import { NextResponse } from "next/server";
import {
  actorCanCreateGroup,
  actorCanViewCommunity,
} from "@/lib/community/permissions";
import {
  createCommunityGroup,
  listCommunityGroups,
} from "@/lib/community/server-community-repository";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  filterForActiveTerritory,
  resolveActiveTerritoryContext,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanViewCommunity(actor)) {
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
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const groups = filterForActiveTerritory(
    await listCommunityGroups(bound.tenantId, scope),
    territory.context.territoryId,
  );
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: territory.context.territoryId,
    groups,
  });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateGroup(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { name?: string; description?: string; tenantId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const name = body.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const group = await createCommunityGroup({
    tenantId: bound.tenantId,
    createdBy: gated.actor.personId,
    name,
    description: body.description,
    territoryId: resolveStampTerritoryId({
      tenantId: bound.tenantId,
      inherited: gated.actor.territoryId,
    }),
    scope,
  });
  return NextResponse.json({ group }, { status: 201 });
}
