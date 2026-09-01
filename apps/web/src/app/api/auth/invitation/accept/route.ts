import { NextResponse } from "next/server";
import {
  GUEST_ACCESS_DENIED,
  INVITATION_INVALID,
  ROLE_SPOOF_FORBIDDEN,
} from "@life-community-os/types";
import { requireAuthenticatedActor } from "@/lib/auth/mutation-gate";
import { MembershipExperienceService } from "@/lib/membership/membership-experience-service";
import { MembershipOnboardingRuntime } from "@/lib/membership/membership-onboarding-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gated = await requireAuthenticatedActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    invitationId?: string;
    email?: string;
    role?: string;
    tenantId?: string;
    territoryId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    MembershipOnboardingRuntime.assertNoRoleSpoof(body as Record<string, unknown>);
  } catch {
    return NextResponse.json({ error: ROLE_SPOOF_FORBIDDEN }, { status: 403 });
  }
  const invitationId = body.invitationId?.trim();
  const email = body.email?.trim();
  if (!invitationId || !email) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
    actorPersonId: gated.actor.personId,
  });
  if ("error" in bound) return bound.error;
  try {
    const membership = await MembershipExperienceService.acceptInvitation({
      actor: gated.actor,
      invitationId,
      email,
      tenantId: bound.tenantId,
    });
    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof Error && error.message === INVITATION_INVALID) {
      return NextResponse.json({ error: INVITATION_INVALID }, { status: 400 });
    }
    if (error instanceof Error && error.message === GUEST_ACCESS_DENIED) {
      return NextResponse.json({ error: GUEST_ACCESS_DENIED }, { status: 403 });
    }
    throw error;
  }
}
