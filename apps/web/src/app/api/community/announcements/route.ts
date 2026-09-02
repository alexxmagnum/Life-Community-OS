import { NextResponse } from "next/server";
import {
  actorCanCreateCommunityAnnouncement,
  actorCanCreateOfficialAnnouncement,
  actorCanReadTerritoryAnnouncements,
} from "@/lib/community/permissions";
import {
  CommunityOperationsService,
  OperationsDeniedError,
} from "@/lib/community/community-operations-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";
import type {
  CommunityAnnouncementAudience,
  CommunityAnnouncementCategory,
  CommunityAnnouncementPriority,
} from "@life-community-os/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanReadTerritoryAnnouncements(actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const locationId = url.searchParams.get("locationId")?.trim();
  const announcements = (
    await CommunityOperationsService.announcements({
      tenantId: bound.tenantId,
      territoryId,
    })
  ).filter((item) => !locationId || item.locationId === locationId);
  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  let body: {
    title?: string;
    body?: string;
    tenantId?: string;
    createdBy?: string;
    category?: CommunityAnnouncementCategory;
    priority?: CommunityAnnouncementPriority;
    audience?: CommunityAnnouncementAudience;
    locationId?: string;
    startsAt?: string;
    endsAt?: string;
    requiresAcknowledgement?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const category = body.category ?? "community";
  const official =
    category === "official" || category === "emergency";
  if (official && !actorCanCreateOfficialAnnouncement(gated.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!official && !actorCanCreateCommunityAnnouncement(gated.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const territory = resolveActiveTerritoryContext({
    tenantId: bound.tenantId,
    actorTerritoryId: gated.actor.territoryId,
  });
  if ("error" in territory) return territory.error;
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const announcement = await CommunityOperationsService.createAnnouncement({
      tenantId: bound.tenantId,
      actor: gated.actor,
      territoryId,
      title: body.title ?? "",
      body: body.body ?? "",
      createdByFromClient: body.createdBy ?? null,
      category: body.category,
      priority: body.priority,
      audience: body.audience,
      locationId: body.locationId ?? null,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      requiresAcknowledgement: body.requiresAcknowledgement,
    });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    if (error instanceof OperationsDeniedError) {
      const status =
        error.message === "unauthorized"
          ? 401
          : error.message === "invalid"
            ? 400
            : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
