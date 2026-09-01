import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import { TenantLifecycleRuntime } from "@/lib/platform/tenant-lifecycle-service";
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
  return NextResponse.json({
    lifecycle: TenantLifecycleRuntime.list(),
    contracts: TenantLifecycleRuntime.contracts(),
  });
}

export async function POST(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  ensurePlatformControlPlane();
  let body: {
    communitySlug?: string;
    action?: string;
    reason?: string;
    tenantId?: string;
    territoryId?: string;
    role?: string;
    plan?: string;
    features?: unknown;
    status?: unknown;
    limits?: unknown;
    permissions?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const community = TenantFactoryRuntime.list().find(
      (row) => row.slug === body.communitySlug?.trim(),
    );
    if (!community) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const spoof = {
      tenantId: body.tenantId,
      territoryId: body.territoryId,
      role: body.role,
      plan: body.plan,
      features: body.features,
      status: body.status,
      limits: body.limits,
      permissions: body.permissions,
    };
    const input = {
      actor,
      tenantId: community.id,
      spoof,
      reason: body.reason,
    };
    if (body.action === "activate") {
      return NextResponse.json({ lifecycle: TenantLifecycleRuntime.activate(input) });
    }
    if (body.action === "suspend") {
      return NextResponse.json({ lifecycle: TenantLifecycleRuntime.suspend(input) });
    }
    if (body.action === "restore") {
      return NextResponse.json({ lifecycle: TenantLifecycleRuntime.restore(input) });
    }
    if (body.action === "archive") {
      return NextResponse.json({ lifecycle: TenantLifecycleRuntime.archive(input) });
    }
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      const status = error.message === "unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error instanceof Error && error.message === "invalid_transition") {
      return NextResponse.json({ error: "invalid_transition" }, { status: 400 });
    }
    throw error;
  }
}
