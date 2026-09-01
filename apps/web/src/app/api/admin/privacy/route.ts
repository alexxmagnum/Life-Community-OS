import { NextResponse } from "next/server";
import { PRIVACY_ACCESS_DENIED } from "@life-community-os/types";
import { actorCanAccessSection } from "@/lib/admin/permissions";
import { PrivacyGovernanceRuntime } from "@/lib/privacy/privacy-governance-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanAccessSection(actor, "privacy")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: new URL(request.url).searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  return NextResponse.json({
    configuration: PrivacyGovernanceRuntime.configuration(bound.tenantId),
  });
}

export async function PATCH(request: Request) {
  const { requireAdministratorMutation } = await import("@/lib/auth/mutation-gate");
  const gated = await requireAdministratorMutation(request);
  if ("error" in gated) return gated.error;
  if (!actorCanAccessSection(gated.actor, "privacy")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: {
    tenantId?: string;
    privacyPolicyUrl?: string;
    legalContact?: string;
    dataControllerName?: string;
    personId?: string;
    exportScope?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.personId || body.exportScope) {
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
    const configuration = PrivacyGovernanceRuntime.saveConfiguration({
      actor: gated.actor,
      tenantId: bound.tenantId,
      config: {
        privacyPolicyUrl: body.privacyPolicyUrl,
        legalContact: body.legalContact,
        dataControllerName: body.dataControllerName,
      },
    });
    return NextResponse.json({ configuration });
  } catch (error) {
    if (error instanceof Error && error.message === PRIVACY_ACCESS_DENIED) {
      return NextResponse.json({ error: PRIVACY_ACCESS_DENIED }, { status: 403 });
    }
    throw error;
  }
}
