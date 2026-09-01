import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import { PlatformAnalyticsRuntime } from "@/lib/platform/platform-analytics-service";
import { ensurePlatformControlPlane } from "@/lib/platform/ensure-control-plane";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";

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
  const kind = new URL(request.url).searchParams.get("kind")?.trim();
  const exportReport =
    new URL(request.url).searchParams.get("export") === "true";
  if (!kind) {
    return NextResponse.json({ error: "kind_required" }, { status: 400 });
  }
  try {
    const report = exportReport
      ? PlatformAnalyticsRuntime.exportReport({
          actor,
          kind: kind as "tenant_overview",
        })
      : PlatformAnalyticsRuntime.generateReport({
          actor,
          kind: kind as "tenant_overview",
        });
    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
