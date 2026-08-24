import { NextResponse } from "next/server";
import { requireMutationActor } from "@/lib/auth/mutation-gate";
import { resolveRequestActor } from "@/lib/auth/request-actor";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import {
  createIncident,
  listIncidents,
  type IncidentPriority,
} from "@/lib/incidents/server-incidents-repository";

export const runtime = "nodejs";

const priorities = new Set<IncidentPriority>(["low", "normal", "high", "urgent"]);

export async function GET(request: Request) {
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.hasMembership || !actor.personId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import("@/lib/data/database-access");
  const incidents = await listIncidents(
    bound.tenantId,
    actor,
    persistenceScopeFromRequest(request, actor.personId),
  );
  return NextResponse.json({ tenantId: bound.tenantId, incidents });
}

export async function POST(request: Request) {
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!gated.actor.personId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: {
    tenantId?: string;
    category?: string;
    priority?: string;
    description?: string;
    locationId?: string;
    attachmentIds?: string[];
    createdBy?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.createdBy) {
    return NextResponse.json({ error: "client_identity_not_allowed" }, { status: 400 });
  }
  const category = body.category?.trim() || "other";
  const description = body.description?.trim() || "";
  const priority = body.priority?.trim() || "normal";
  if (!description || !priorities.has(priority as IncidentPriority)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import("@/lib/data/database-access");
  const incident = await createIncident({
    tenantSlug: bound.tenantId,
    actor: gated.actor,
    category,
    priority: priority as IncidentPriority,
    description,
    locationId: body.locationId,
    attachmentIds: body.attachmentIds,
    scope: persistenceScopeFromRequest(request, gated.actor.personId),
  });
  return NextResponse.json({ incident }, { status: 201 });
}
