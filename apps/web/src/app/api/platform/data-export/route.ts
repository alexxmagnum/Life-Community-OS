import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import { TenantDataOpsRuntime } from "@/lib/platform/tenant-data-ops-service";
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
    exports: TenantDataOpsRuntime.listExports(),
    backups: TenantDataOpsRuntime.listBackups(),
    restores: TenantDataOpsRuntime.listRestores(),
    recovery: TenantDataOpsRuntime.recovery(),
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
    type?: "manual" | "scheduled" | "migration";
    explicitConfirmation?: boolean;
    tenantId?: string;
    territoryId?: string;
    role?: string;
    plan?: string;
    features?: unknown;
    status?: unknown;
    limits?: unknown;
    permissions?: unknown;
    backupId?: unknown;
    restoreTarget?: unknown;
    exportScope?: unknown;
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
      backupId: body.backupId,
      restoreTarget: body.restoreTarget,
      exportScope: body.exportScope,
    };
    const input = {
      actor,
      tenantId: community.id,
      spoof,
      reason: body.reason,
    };
    if (body.action === "export" || !body.action) {
      return NextResponse.json({
        export: TenantDataOpsRuntime.exportTenant(input),
      });
    }
    if (body.action === "backup") {
      return NextResponse.json({
        backup: TenantDataOpsRuntime.createBackup({
          ...input,
          type: body.type ?? "manual",
        }),
      });
    }
    if (body.action === "restore") {
      return NextResponse.json({
        restore: TenantDataOpsRuntime.restoreTenant({
          ...input,
          explicitConfirmation: body.explicitConfirmation === true,
        }),
      });
    }
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      const status = error.message === "unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (
      error instanceof Error &&
      (error.message === "cross_tenant_restore_forbidden" ||
        error.message === "restore_confirmation_required" ||
        error.message === "restore_failed" ||
        error.message === "tenant_not_found")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
