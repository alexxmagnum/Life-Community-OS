import { NextResponse } from "next/server";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  let body: {
    communitySlug?: string;
    action?: string;
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
    const status =
      body.action === "suspend"
        ? "suspended"
        : body.action === "archive"
          ? "archived"
          : body.action === "mark_ready"
            ? "active"
            : null;
    if (!status) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const tenant = TenantFactoryRuntime.setStatus({
      actor,
      tenantId: community.id,
      status,
      spoof: {
        tenantId: body.tenantId,
        territoryId: body.territoryId,
        role: body.role,
        plan: body.plan,
        features: body.features,
      },
    });
    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof TenantFactoryDeniedError) {
      const status = error.message === "unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
