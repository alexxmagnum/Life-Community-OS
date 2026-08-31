import { NextResponse } from "next/server";
import { mergeParticipationPrivacy } from "@life-community-os/types";
import { CommunityParticipationService } from "@/lib/community/community-participation-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    appearInParticipants?: boolean;
    receiveInvitations?: boolean;
    showActivity?: boolean;
    createdBy?: string;
    ownerId?: string;
    territoryId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.createdBy || body.ownerId || body.territoryId) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }
  const bound = resolveWriteTenantId({
    request,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const privacy = await CommunityParticipationService.privacy({
    tenantId: bound.tenantId,
    actor: gated.actor,
    privacy: mergeParticipationPrivacy(body),
    scope,
  });
  return NextResponse.json({ privacy });
}
