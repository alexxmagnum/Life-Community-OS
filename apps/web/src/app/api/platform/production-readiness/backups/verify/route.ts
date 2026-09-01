import { NextResponse } from "next/server";
import { ProductionReadinessRuntime } from "@/lib/platform/production-readiness-service";
import { TenantFactoryDeniedError } from "@/lib/tenant/tenant-factory-service";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  const denied = await requirePlatformOperator(gated.actor);
  if (denied) return denied;
  let body: { backupId?: string; tenantId?: string; restoreTested?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const backupId = body.backupId?.trim();
  const tenantId = body.tenantId?.trim();
  if (!backupId || !tenantId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    const verification = ProductionReadinessRuntime.verifyBackup({
      actor: gated.actor,
      backupId,
      tenantId,
      restoreTested: body.restoreTested === true,
    });
    return NextResponse.json({ verification }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      const status =
        error.message === "not_found"
          ? 404
          : error.message === "forbidden"
            ? 403
            : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
