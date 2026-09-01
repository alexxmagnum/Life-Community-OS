import { NextResponse } from "next/server";
import { SAAS_CONTROL_PLANE_FORBIDDEN, canAccessPlatformAdmin } from "@life-community-os/types";
import { TenantFactoryRuntime } from "@/lib/tenant/tenant-factory-service";
import { ensurePlatformControlPlane } from "@/lib/platform/ensure-control-plane";
import type { RequestActor } from "@/lib/auth/request-actor";

export async function requirePlatformOperator(actor: RequestActor) {
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
      { error: SAAS_CONTROL_PLANE_FORBIDDEN },
      { status: 403 },
    );
  }
  return null;
}
