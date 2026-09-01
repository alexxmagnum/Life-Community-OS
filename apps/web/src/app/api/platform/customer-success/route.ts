import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import { CustomerOperationsRuntime } from "@/lib/platform/customer-operations-service";
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
  const tenantId = new URL(request.url).searchParams.get("tenantId")?.trim();
  if (tenantId) {
    const customer = CustomerOperationsRuntime.resolveCustomerHealth(
      actor,
      tenantId,
    );
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ customer });
  }
  return NextResponse.json({
    customers: CustomerOperationsRuntime.listSuccess(actor),
  });
}

export async function POST(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.personId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  ensurePlatformControlPlane();
  let body: {
    action?: string;
    tenantId?: string;
    summary?: string;
    key?: string;
    type?: string;
    alertId?: string;
    role?: string;
    supportScope?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const tenantId = body.tenantId?.trim();
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_required" }, { status: 400 });
  }
  try {
    switch (body.action) {
      case "create_support_note":
        if (!body.summary?.trim()) {
          return NextResponse.json({ error: "invalid_body" }, { status: 400 });
        }
        return NextResponse.json({
          note: CustomerOperationsRuntime.createSupportNote({
            actor,
            tenantId,
            summary: body.summary,
            body: body as Record<string, unknown>,
          }),
        });
      case "complete_checklist":
        if (!body.key) {
          return NextResponse.json({ error: "invalid_body" }, { status: 400 });
        }
        return NextResponse.json({
          checklist: CustomerOperationsRuntime.completeChecklist({
            actor,
            tenantId,
            key: body.key as "tenant_created",
            body: body as Record<string, unknown>,
          }),
        });
      case "create_alert":
        if (!body.summary?.trim() || !body.type) {
          return NextResponse.json({ error: "invalid_body" }, { status: 400 });
        }
        return NextResponse.json({
          alert: CustomerOperationsRuntime.createAlert({
            actor,
            tenantId,
            type: body.type as "configuration_missing",
            summary: body.summary,
          }),
        });
      case "resolve_alert":
        if (!body.alertId) {
          return NextResponse.json({ error: "invalid_body" }, { status: 400 });
        }
        return NextResponse.json({
          alerts: CustomerOperationsRuntime.resolveAlert({
            actor,
            tenantId,
            alertId: body.alertId,
          }),
        });
      default:
        return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
