import { NextResponse } from "next/server";
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
    helpId?: string;
    entityId?: string;
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
  const helpId = (body.helpId ?? body.entityId)?.trim() ?? "";
  if (!helpId) {
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
    const result = await CommunityParticipationService.respond({
      tenantId: bound.tenantId,
      helpId,
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
        : code === "forbidden" || code === "cross_territory_forbidden"
          ? 403
          : code === "not_found"
            ? 404
            : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
