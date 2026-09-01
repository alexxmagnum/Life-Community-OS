import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import { PlatformOperationsRuntime } from "@/lib/platform/platform-operations-service";
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
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    territories: PlatformOperationsRuntime.territories(),
  });
}

export async function POST(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  ensurePlatformControlPlane();
  let body: {
    name?: string;
    slug?: string;
    locale?: string;
    timezone?: string;
    communitySlug?: string;
    tenantId?: string;
    territoryId?: string;
    role?: string;
    plan?: string;
    features?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    TenantFactoryRuntime.assertOperator(actor);
    const community = TenantFactoryRuntime.list().find(
      (row) => row.slug === body.communitySlug?.trim(),
    );
    if (!community) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const territory = TenantFactoryRuntime.addTerritory({
      actor,
      spoof: {
        tenantId: body.tenantId,
        territoryId: body.territoryId,
        role: body.role,
        plan: body.plan,
        features: body.features,
      },
      territory: {
        tenantId: community.id,
        name: body.name ?? "",
        slug: body.slug,
        locale: body.locale,
        timezone: body.timezone,
      },
    });
    return NextResponse.json({ territory }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      const status = error.message === "unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
