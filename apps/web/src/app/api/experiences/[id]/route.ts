import { NextResponse } from "next/server";
import {
  CAPABILITIES,
  isExperienceLifecycleStatus,
  type ExperienceLifecycleStatus,
} from "@life-community-os/types";
import { actorHasCapability } from "@/lib/auth/permissions";
import {
  actorCanManageExperience,
  actorCanViewExperiences,
  experienceVisibleToActor,
} from "@/lib/experiences/permissions";
import {
  getExperienceServer,
  listExperienceParticipantsServer,
  updateExperienceServer,
} from "@/lib/experiences/server-experience-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function experienceError(error: unknown): NextResponse {
  const code = error instanceof Error ? error.message : "error";
  if (code === "unauthorized") {
    return NextResponse.json({ error: code }, { status: 401 });
  }
  if (
    code === "forbidden" ||
    code === "cross_territory_forbidden" ||
    code === "owner_immutable"
  ) {
    return NextResponse.json({ error: code }, { status: 403 });
  }
  if (code === "not_found") {
    return NextResponse.json({ error: code }, { status: 404 });
  }
  if (code === "resource_territory_mismatch" || code === "resource_not_found") {
    return NextResponse.json({ error: code }, { status: 409 });
  }
  return NextResponse.json({ error: code }, { status: 400 });
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewExperiences(actor)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: actor.territoryId,
    queryTerritoryId: url.searchParams.get("territoryId"),
  });
  if ("error" in territory) return territory.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  const experience = await getExperienceServer(bound.tenantId, id, scope);
  if (!experience || !experienceVisibleToActor(actor, experience)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (
    territory.context.territoryId &&
    experience.territoryId !== territory.context.territoryId
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const participants = await listExperienceParticipantsServer(
    bound.tenantId,
    id,
    scope,
  );
  return NextResponse.json({
    tenantId: bound.tenantId,
    territoryId: experience.territoryId,
    experience,
    participants,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
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
  if (!actorCanManageExperience(gated.actor, existing) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    title?: string;
    description?: string;
    category?: string;
    status?: string;
    resourceId?: string | null;
    startsAt?: string;
    endsAt?: string;
    location?: string;
    capacity?: number;
    ownerId?: string;
    ownerPersonId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.status && !isExperienceLifecycleStatus(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  try {
    const experience = await updateExperienceServer({
      tenantId: bound.tenantId,
      experienceId: id,
      actorPersonId: gated.actor.personId,
      canManage: actorHasCapability(
        gated.actor.permissions,
        CAPABILITIES.experienceManage,
      ),
      patch: {
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status as ExperienceLifecycleStatus | undefined,
        resourceId: body.resourceId,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        location: body.location,
        capacity: body.capacity,
      },
      ownerPersonIdFromClient: body.ownerId ?? body.ownerPersonId,
      scope,
    });
    return NextResponse.json({ experience });
  } catch (error) {
    return experienceError(error);
  }
}
