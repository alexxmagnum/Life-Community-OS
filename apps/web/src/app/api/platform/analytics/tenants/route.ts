import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import { PlatformAnalyticsRuntime } from "@/lib/platform/platform-analytics-service";
import { ensurePlatformControlPlane } from "@/lib/platform/ensure-control-plane";
import { TenantFactoryRuntime } from "@/lib/tenant/tenant-factory-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.personId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  ensurePlatformControlPlane();
  if (
    !canAccessPlatformAdmin({
      personId: actor.personId,
      operators: TenantFactoryRuntime.snapshot().operators,
    })
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const tenantId = new URL(request.url).searchParams.get("tenantId")?.trim();
  if (tenantId) {
    const tenant = PlatformAnalyticsRuntime.getTenant(actor, tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ tenant });
  }
  return NextResponse.json({
    tenants: PlatformAnalyticsRuntime.listTenants(actor),
  });
}
