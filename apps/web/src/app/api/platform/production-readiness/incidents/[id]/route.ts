import { NextResponse } from "next/server";
import { PLATFORM_INCIDENT_STATUSES } from "@life-community-os/types";
import { PlatformIncidentService } from "@/lib/platform/production-readiness-service";
import { TenantFactoryDeniedError } from "@/lib/tenant/tenant-factory-service";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  const denied = await requirePlatformOperator(gated.actor);
  if (denied) return denied;
  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const status = body.status?.trim();
  if (!status || !(PLATFORM_INCIDENT_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    const incident = PlatformIncidentService.update({
      actor: gated.actor,
      incidentId: id,
      status: status as (typeof PLATFORM_INCIDENT_STATUSES)[number],
    });
    if (!incident) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ incident });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
