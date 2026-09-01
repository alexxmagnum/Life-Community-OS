import { NextResponse } from "next/server";
import { TenantLaunchService } from "@/lib/platform/production-readiness-service";
import { TenantFactoryDeniedError } from "@/lib/tenant/tenant-factory-service";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  const denied = await requirePlatformOperator(actor);
  if (denied) return denied;
  return NextResponse.json({ launchChecklists: TenantLaunchService.list() });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  const denied = await requirePlatformOperator(gated.actor);
  if (denied) return denied;
  let body: { tenantId?: string; action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const tenantId = body.tenantId?.trim();
  if (!tenantId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    if (body.action === "approve_launch") {
      const checklist = TenantLaunchService.approveLaunch({
        actor: gated.actor,
        tenantId,
      });
      return NextResponse.json({ checklist });
    }
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      const status = error.message === "invalid" ? 400 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
