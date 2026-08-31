import { NextResponse } from "next/server";
import {
  isCommunityParticipationEntityType,
  type CommunityParticipationEntityType,
} from "@life-community-os/types";
import {
  CommunityParticipationService,
  ParticipationDeniedError,
} from "@/lib/community/community-participation-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    entityType?: string;
    entityId?: string;
    inviteePersonId?: string;
    createdBy?: string;
    ownerId?: string;
    ownerPersonId?: string;
    territoryId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.createdBy || body.ownerId || body.ownerPersonId || body.territoryId) {
    return NextResponse.json({ error: "owner_immutable" }, { status: 403 });
  }
  if (
    !body.entityType ||
    !isCommunityParticipationEntityType(body.entityType) ||
    !body.entityId?.trim() ||
    !body.inviteePersonId?.trim()
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
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
  try {
    const result = await CommunityParticipationService.invite({
      tenantId: bound.tenantId,
      entityType: body.entityType as CommunityParticipationEntityType,
      entityId: body.entityId.trim(),
      inviteePersonId: body.inviteePersonId.trim(),
      actor: gated.actor,
      scope,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const code =
      error instanceof ParticipationDeniedError
        ? error.message
        : error instanceof Error
          ? error.message
          : "error";
    const status =
      code === "unauthorized"
        ? 401
        : code === "forbidden" ||
            code === "cross_territory_forbidden" ||
            code === "invitations_disabled"
          ? 403
          : code === "not_found"
            ? 404
            : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
