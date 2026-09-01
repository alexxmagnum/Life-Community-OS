import { NextResponse } from "next/server";
import { PRIVACY_ACCESS_DENIED } from "@life-community-os/types";
import { PrivacyGovernanceRuntime } from "@/lib/privacy/privacy-governance-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    tenantId?: string;
    explicitConfirmation?: boolean;
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
    const result = PrivacyGovernanceRuntime.deleteAccount({
      actor: gated.actor,
      tenantId: bound.tenantId,
      explicitConfirmation: body.explicitConfirmation,
    });
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === PRIVACY_ACCESS_DENIED) {
        return NextResponse.json({ error: PRIVACY_ACCESS_DENIED }, { status: 403 });
      }
      if (error.message === "privacy_delete_confirmation_required") {
        return NextResponse.json(
          { error: "privacy_delete_confirmation_required" },
          { status: 400 },
        );
      }
    }
    throw error;
  }
}
