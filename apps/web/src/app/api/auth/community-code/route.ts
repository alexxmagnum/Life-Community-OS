import { NextResponse } from "next/server";
import {
  COMMUNITY_CODE_INVALID,
  COMMUNITY_CODE_TERRITORY_DENIED,
  GUEST_ACCESS_DENIED,
  ROLE_SPOOF_FORBIDDEN,
} from "@life-community-os/types";
import { MembershipOnboardingRuntime } from "@/lib/membership/membership-onboarding-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    tenantId?: string;
    territoryId?: string;
    code?: string;
    role?: string;
    membershipId?: string;
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
  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
    actorPersonId: gated.actor.personId,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: gated.actor.territoryId,
    queryTerritoryId: body.territoryId,
  });
  if ("error" in territory) return territory.error;
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const membership = MembershipOnboardingRuntime.joinWithCode({
      actor: gated.actor,
      tenantId: bound.tenantId,
      territoryId,
      code,
    });
    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === COMMUNITY_CODE_INVALID) {
        return NextResponse.json({ error: COMMUNITY_CODE_INVALID }, { status: 400 });
      }
      if (error.message === COMMUNITY_CODE_TERRITORY_DENIED) {
        return NextResponse.json(
          { error: COMMUNITY_CODE_TERRITORY_DENIED },
          { status: 403 },
        );
      }
      if (error.message === GUEST_ACCESS_DENIED) {
        return NextResponse.json({ error: GUEST_ACCESS_DENIED }, { status: 403 });
      }
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: new URL(request.url).searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  return NextResponse.json({
    pending: MembershipOnboardingRuntime.listPending(bound.tenantId),
    invitations: MembershipOnboardingRuntime.listInvitations(bound.tenantId),
  });
}
