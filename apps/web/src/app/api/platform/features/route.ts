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
    usage: PlatformOperationsRuntime.context().featuresUsage,
    tenants: PlatformOperationsRuntime.features(),
  });
}

export async function POST(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  ensurePlatformControlPlane();
  let body: {
    communitySlug?: string;
    features?: Record<string, boolean>;
    tenantId?: string;
    territoryId?: string;
    role?: string;
    plan?: string;
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
    const features = TenantFactoryRuntime.setFeatures({
      actor,
      tenantId: community.id,
      features: {
        marketplace: body.features?.marketplace,
        lifeMap: body.features?.lifeMap,
        reservations: body.features?.reservations,
        experiences: body.features?.experiences,
        housing: body.features?.housing,
        golf: body.features?.golf,
        hospitality: body.features?.hospitality,
        community: body.features?.community,
        resources: body.features?.resources,
        work: body.features?.work,
        official: body.features?.official,
      },
      spoof: {
        tenantId: body.tenantId,
        territoryId: body.territoryId,
        role: body.role,
        plan: body.plan,
        features: undefined,
      },
    });
    return NextResponse.json({ features });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      const status = error.message === "unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
