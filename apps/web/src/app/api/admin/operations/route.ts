import { NextResponse } from "next/server";
import { actorCanAccessOperations } from "@/lib/admin/permissions";
import { loadOperationsDashboard } from "@/lib/admin/operations-metrics";
import { loadCommunityActivationMetrics } from "@/lib/admin/community-activation-metrics";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanAccessOperations(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: new URL(request.url).searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: actor.territoryId,
    queryTerritoryId: new URL(request.url).searchParams.get("territoryId"),
  });
  if ("error" in territory) return territory.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const [metrics, activation] = await Promise.all([
    loadOperationsDashboard({
      tenantId: bound.tenantId,
      scope,
    }),
    loadCommunityActivationMetrics({
      tenantId: bound.tenantId,
      territoryId: territory.context.territoryId ?? undefined,
      scope,
    }),
  ]);
  return NextResponse.json({ metrics, activation });
}
