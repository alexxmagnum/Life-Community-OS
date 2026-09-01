import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import { TenantFactoryRuntime } from "@/lib/tenant/tenant-factory-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";
import { SecurityHardeningRuntime } from "@/lib/platform/security-hardening-service";
import { ensurePlatformControlPlane } from "@/lib/platform/ensure-control-plane";

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
    return NextResponse.json(
      { error: "saas_control_plane_forbidden" },
      { status: 403 },
    );
  }
  const center = SecurityHardeningRuntime.center();
  return NextResponse.json({
    events: PlatformOperationsRuntime.security(),
    boundaryEvents: center.boundaryEvents,
    permissionDenials: center.permissionDenials,
    incidents: PlatformOperationsRuntime.security().filter(
      (event) =>
        event.kind === "cross_tenant" ||
        event.kind === "invalid_permission" ||
        event.kind === "territory_mismatch",
    ),
    auditSecurity: center.auditSecurity,
    configurationRisks: center.configurationRisks,
  });
}
