import { NextResponse } from "next/server";
import { canAccessPlatformAdmin } from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
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
  return NextResponse.json({ tenants: TenantFactoryRuntime.list() });
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
    branding?: { name?: string; shortName?: string; primaryColor?: string };
    territories?: Array<{ name?: string; slug?: string }>;
    tenantId?: string;
    territoryId?: string;
    role?: string;
    plan?: string;
    features?: unknown;
    permission?: unknown;
    capability?: unknown;
    capabilities?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const result = TenantFactoryRuntime.provision({
      actor,
      spoof: {
        tenantId: body.tenantId,
        territoryId: body.territoryId,
        role: body.role,
        plan: body.plan,
        features: body.features,
        permission: body.permission,
        capability: body.capability,
        capabilities: body.capabilities,
      },
      request: {
        name: body.name ?? "",
        slug: body.slug ?? "",
        locale: body.locale?.trim() || "en",
        timezone: body.timezone?.trim() || "UTC",
        branding: body.branding?.name?.trim()
          ? {
              name: body.branding.name.trim(),
              shortName: body.branding.shortName?.trim(),
              primaryColor: body.branding.primaryColor?.trim(),
            }
          : undefined,
        territories: (body.territories ?? [])
          .filter((row) => row.name?.trim())
          .map((row) => ({ name: row.name!.trim(), slug: row.slug })),
      },
    });
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      const status = error.message === "unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error instanceof Error && error.message === "territory_required") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "slug_taken") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    throw error;
  }
}
