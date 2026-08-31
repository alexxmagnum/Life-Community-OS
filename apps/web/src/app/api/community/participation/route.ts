import { NextResponse } from "next/server";
import {
  isCommunityParticipationEntityType,
  type CommunityParticipationEntityType,
} from "@life-community-os/types";
import {
  CommunityParticipationService,
  ParticipationDeniedError,
} from "@/lib/community/community-participation-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

function participationError(error: unknown): NextResponse {
  const code =
    error instanceof ParticipationDeniedError
      ? error.message
      : error instanceof Error
        ? error.message
        : "error";
  if (code === "unauthorized") {
    return NextResponse.json({ error: code }, { status: 401 });
  }
  if (
    code === "forbidden" ||
    code === "cross_territory_forbidden" ||
    code === "invitations_disabled" ||
    code === "territory_forbidden"
  ) {
    return NextResponse.json({ error: code }, { status: 403 });
  }
  if (code === "not_found") {
    return NextResponse.json({ error: code }, { status: 404 });
  }
  if (code === "already_joined") {
    return NextResponse.json({ error: code }, { status: 409 });
  }
  return NextResponse.json({ error: code }, { status: 400 });
}

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  const url = new URL(request.url);
  const entityTypeRaw = url.searchParams.get("entityType") ?? "";
  const entityId = url.searchParams.get("entityId")?.trim() ?? "";
  if (!isCommunityParticipationEntityType(entityTypeRaw) || !entityId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  try {
    const result = await CommunityParticipationService.resolve({
      tenantId: bound.tenantId,
      entityType: entityTypeRaw,
      entityId,
      actor,
      scope,
    });
    return NextResponse.json(result);
  } catch (error) {
    return participationError(error);
  }
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    entityType?: string;
    entityId?: string;
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
    !body.entityId?.trim()
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
    const result = await CommunityParticipationService.join({
      tenantId: bound.tenantId,
      entityType: body.entityType as CommunityParticipationEntityType,
      entityId: body.entityId.trim(),
      actor: gated.actor,
      scope,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return participationError(error);
  }
}
