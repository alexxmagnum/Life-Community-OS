import { NextResponse } from "next/server";
import { actorCanJoinExperience } from "@/lib/experiences/permissions";
import {
  getExperienceServer,
  joinExperienceServer,
} from "@/lib/experiences/server-experience-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

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
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: gated.actor.territoryId,
  });
  if ("error" in territory) return territory.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const existing = await getExperienceServer(bound.tenantId, id, scope);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (
    territory.context.territoryId &&
    existing.territoryId !== territory.context.territoryId
  ) {
    return NextResponse.json({ error: "cross_territory_forbidden" }, { status: 403 });
  }
  try {
    const participation = await joinExperienceServer({
      tenantId: bound.tenantId,
      experienceId: id,
      personId: gated.actor.personId,
      scope,
    });
    return NextResponse.json({ participation }, { status: 201 });
  } catch (error) {
    return joinError(error);
  }
}
