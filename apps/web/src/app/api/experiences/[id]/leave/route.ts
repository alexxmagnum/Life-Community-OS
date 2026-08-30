import { NextResponse } from "next/server";
import { actorCanJoinExperience } from "@/lib/experiences/permissions";
import {
  getExperienceServer,
  leaveExperienceServer,
} from "@/lib/experiences/server-experience-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function leaveError(error: unknown): NextResponse {
  const code = error instanceof Error ? error.message : "error";
  if (code === "unauthorized") {
    return NextResponse.json({ error: code }, { status: 401 });
  }
  if (code === "forbidden" || code === "creator_cannot_leave") {
    return NextResponse.json({ error: code }, { status: 403 });
  }
  if (code === "not_found") {
    return NextResponse.json({ error: code }, { status: 404 });
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
  const existing = await getExperienceServer(bound.tenantId, id, scope);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const participation = await leaveExperienceServer({
      tenantId: bound.tenantId,
      experienceId: id,
      personId: gated.actor.personId,
      scope,
    });
    return NextResponse.json({ participation });
  } catch (error) {
    return leaveError(error);
  }
}
