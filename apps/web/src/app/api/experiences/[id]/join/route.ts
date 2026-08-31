import { NextResponse } from "next/server";
import { actorCanJoinExperience } from "@/lib/experiences/permissions";
import { CommunityParticipationService } from "@/lib/community/community-participation-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function joinError(error: unknown): NextResponse {
  const code = error instanceof Error ? error.message : "error";
  if (code === "unauthorized") {
    return NextResponse.json({ error: code }, { status: 401 });
  }
  if (code === "forbidden" || code === "cross_territory_forbidden") {
    return NextResponse.json({ error: code }, { status: 403 });
  }
  if (code === "not_found") {
    return NextResponse.json({ error: code }, { status: 404 });
  }
  if (code === "already_joined" || code === "not_joinable") {
    return NextResponse.json({ error: code }, { status: 409 });
  }
  return NextResponse.json({ error: code }, { status: 400 });
}

export async function POST(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanJoinExperience(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
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
    const result = await CommunityParticipationService.join({
      tenantId: bound.tenantId,
      entityType: "experience",
      entityId: id,
      actor: gated.actor,
      scope,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return joinError(error);
  }
}
