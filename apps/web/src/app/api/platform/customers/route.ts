import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import { CustomerOperationsRuntime } from "@/lib/platform/customer-operations-service";
import { productFeatureCatalog } from "@life-community-os/types";
import { ensurePlatformControlPlane } from "@/lib/platform/ensure-control-plane";
import { TenantFactoryRuntime } from "@/lib/tenant/tenant-factory-service";
import { TenantFactoryDeniedError } from "@/lib/tenant/tenant-factory-service";

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
    const customer = CustomerOperationsRuntime.get(actor, tenantId);
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ customer, catalog: productFeatureCatalog() });
  }
  return NextResponse.json({
    customers: CustomerOperationsRuntime.list(actor),
    catalog: productFeatureCatalog(),
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
    companyName?: string;
    contact?: { name: string; email: string };
    plan?: string;
    email?: string;
    features?: Record<string, boolean>;
    role?: string;
    limits?: Record<string, unknown>;
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
      case "initialize":
        if (!body.companyName || !body.contact?.email) {
          return NextResponse.json({ error: "invalid_body" }, { status: 400 });
        }
        return NextResponse.json({
          customer: CustomerOperationsRuntime.initialize({
            actor,
            tenantId,
            companyName: body.companyName,
            contact: body.contact,
            plan: (body.plan as "starter") ?? "community",
            body: body as Record<string, unknown>,
          }),
        });
      case "configure":
        return NextResponse.json({
          customer: CustomerOperationsRuntime.configure({
            actor,
            tenantId,
            companyName: body.companyName,
            contact: body.contact,
            body: body as Record<string, unknown>,
          }),
        });
      case "activate_features":
        return NextResponse.json({
          customer: CustomerOperationsRuntime.activateFeatures({
            actor,
            tenantId,
            features: body.features ?? {},
            body: body as Record<string, unknown>,
          }),
        });
      case "invite_administrator":
        if (!body.email) {
          return NextResponse.json({ error: "invalid_body" }, { status: 400 });
        }
        return NextResponse.json({
          invitation: CustomerOperationsRuntime.inviteAdministrator({
            actor,
            tenantId,
            email: body.email,
          }),
        });
      case "complete":
        return NextResponse.json({
          customer: CustomerOperationsRuntime.completeOnboarding({
            actor,
            tenantId,
          }),
        });
      case "set_plan":
        if (!body.plan) {
          return NextResponse.json({ error: "invalid_body" }, { status: 400 });
        }
        return NextResponse.json({
          customer: CustomerOperationsRuntime.setPlan({
            actor,
            tenantId,
            plan: body.plan as "starter",
            body: body as Record<string, unknown>,
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
