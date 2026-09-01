import { NextResponse } from "next/server";
import { GUEST_ACCESS_DENIED, INVITATION_INVALID } from "@life-community-os/types";
import { actorCanAccessSection } from "@/lib/admin/permissions";
import { updateMembershipStatus } from "@/lib/auth/ensure-domain-membership";
import { MembershipOnboardingRuntime } from "@/lib/membership/membership-onboarding-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireAdministratorMutation } = await import("@/lib/auth/mutation-gate");
  const gated = await requireAdministratorMutation(request);
  if ("error" in gated) return gated.error;
  if (!actorCanAccessSection(gated.actor, "members")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { membershipId?: string; tenantId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const membershipId = body.membershipId?.trim();
  if (!membershipId) {
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
    const membership = MembershipOnboardingRuntime.approveMembership({
      actor: gated.actor,
      membershipId,
    });
    if (membership.tenantId !== bound.tenantId) {
      return NextResponse.json({ error: GUEST_ACCESS_DENIED }, { status: 403 });
    }
    const updated = await updateMembershipStatus({
      tenantSlug: bound.tenantId,
      personId: membership.personId,
      status: "active",
    });
    return NextResponse.json({
      membership: {
        ...membership,
        status: updated?.status ?? "active",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === GUEST_ACCESS_DENIED) {
        return NextResponse.json({ error: GUEST_ACCESS_DENIED }, { status: 403 });
      }
      if (error.message === INVITATION_INVALID) {
        return NextResponse.json({ error: INVITATION_INVALID }, { status: 404 });
      }
    }
    throw error;
  }
}
