import { NextResponse } from "next/server";
import { PRIVACY_ACCESS_DENIED } from "@life-community-os/types";
import { PrivacyGovernanceRuntime } from "@/lib/privacy/privacy-governance-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.personId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: new URL(request.url).searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const context = PrivacyGovernanceRuntime.context(actor, bound.tenantId);
  return NextResponse.json({ context });
}

export async function PATCH(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    tenantId?: string;
    recommendations?: boolean;
    activityVisibility?: boolean;
    marketingCommunication?: boolean;
    personId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.personId && body.personId !== gated.actor.personId) {
    return NextResponse.json({ error: PRIVACY_ACCESS_DENIED }, { status: 403 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
    actorPersonId: gated.actor.personId,
  });
  if ("error" in bound) return bound.error;
  try {
    const context = PrivacyGovernanceRuntime.updateConsent({
      actor: gated.actor,
      tenantId: bound.tenantId,
      consent: {
        recommendations: body.recommendations,
        activityVisibility: body.activityVisibility,
        marketingCommunication: body.marketingCommunication,
      },
    });
    return NextResponse.json({ context });
  } catch (error) {
    if (error instanceof Error && error.message === PRIVACY_ACCESS_DENIED) {
      return NextResponse.json({ error: PRIVACY_ACCESS_DENIED }, { status: 403 });
    }
    throw error;
  }
}
