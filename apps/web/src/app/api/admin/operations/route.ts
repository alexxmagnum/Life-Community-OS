import { NextResponse } from "next/server";
import { actorCanAccessOperations } from "@/lib/admin/permissions";
import { loadOperationsDashboard } from "@/lib/admin/operations-metrics";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";

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
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const metrics = await loadOperationsDashboard({
    tenantId: bound.tenantId,
    scope,
  });
  return NextResponse.json({ metrics });
}
