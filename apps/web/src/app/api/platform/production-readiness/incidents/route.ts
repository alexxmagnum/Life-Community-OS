import { NextResponse } from "next/server";
import { PlatformIncidentService } from "@/lib/platform/production-readiness-service";
import { TenantFactoryDeniedError } from "@/lib/tenant/tenant-factory-service";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  const denied = await requirePlatformOperator(actor);
  if (denied) return denied;
  return NextResponse.json({ incidents: PlatformIncidentService.list() });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  const denied = await requirePlatformOperator(gated.actor);
  if (denied) return denied;
  let body: { title?: string; description?: string; tenantId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  if (!title || !description) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    const incident = PlatformIncidentService.create({
      actor: gated.actor,
      title,
      description,
      tenantId: body.tenantId?.trim() || undefined,
    });
    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
