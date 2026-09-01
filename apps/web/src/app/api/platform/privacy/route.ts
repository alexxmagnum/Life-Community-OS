import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import { PrivacyGovernanceRuntime } from "@/lib/privacy/privacy-governance-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";
import { ensurePlatformControlPlane } from "@/lib/platform/ensure-control-plane";
import { TenantFactoryRuntime } from "@/lib/tenant/tenant-factory-service";

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
  const audit = PlatformOperationsRuntime.audit().filter((row) =>
    row.action.startsWith("privacy."),
  );
  if (tenantId) {
    return NextResponse.json({
      configuration: PrivacyGovernanceRuntime.configuration(tenantId),
      audit: audit.filter((row) => row.tenantId === tenantId),
    });
  }
  const tenants = TenantFactoryRuntime.snapshot().tenants;
  return NextResponse.json({
    configurations: tenants.map((tenant) =>
      PrivacyGovernanceRuntime.configuration(tenant.id),
    ),
    audit,
  });
}

export async function PATCH(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.personId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  ensurePlatformControlPlane();
  let body: {
    tenantId?: string;
    privacyPolicyUrl?: string;
    legalContact?: string;
    dataControllerName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId?.trim()) {
    return NextResponse.json({ error: "tenant_required" }, { status: 400 });
  }
  try {
    const configuration = PrivacyGovernanceRuntime.saveConfiguration({
      actor,
      tenantId: body.tenantId.trim(),
      config: {
        privacyPolicyUrl: body.privacyPolicyUrl,
        legalContact: body.legalContact,
        dataControllerName: body.dataControllerName,
      },
      platformOperator: true,
    });
    return NextResponse.json({ configuration });
  } catch (error) {
    if (error instanceof Error && error.message === "privacy_access_denied") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw error;
  }
}
