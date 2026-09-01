import { NextResponse } from "next/server";
import {
  GUEST_ACCESS_DENIED,
  INVITATION_INVALID,
  ROLE_SPOOF_FORBIDDEN,
} from "@life-community-os/types";
import { MembershipOnboardingRuntime } from "@/lib/membership/membership-onboarding-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
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
  try {
    const membership = MembershipOnboardingRuntime.acceptInvitation({
      actor: gated.actor,
      invitationId,
      email,
    });
    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof Error && error.message === INVITATION_INVALID) {
      return NextResponse.json({ error: INVITATION_INVALID }, { status: 400 });
    }
    throw error;
  }
}
