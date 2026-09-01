import { NextResponse } from "next/server";
import { ProductionReadinessRuntime } from "@/lib/platform/production-readiness-service";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  const denied = await requirePlatformOperator(actor);
  if (denied) return denied;
  const readiness = await ProductionReadinessRuntime.resolve();
  await ProductionReadinessRuntime.recordEnvironmentCheck(actor);
  await ProductionReadinessRuntime.recordDatabaseHealthCheck(actor);
  return NextResponse.json({ readiness });
}
