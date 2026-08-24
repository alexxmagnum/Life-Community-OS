import { NextResponse } from "next/server";
import {
  isHelpRequestType,
  isWorkHelpCategory,
  type HelpRequestType,
} from "@life-community-os/types";
import {
  actorCanCreateHelp,
  actorCanViewHelp,
  helpVisibleToActor,
} from "@/lib/help/permissions";
import {
  createHelpRequestServer,
  listHelpRequestsServer,
} from "@/lib/help/server-help-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewHelp(actor)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
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
  const all = await listHelpRequestsServer(bound.tenantId, scope);
  const type = url.searchParams.get("type")?.trim();
  const category = url.searchParams.get("category")?.trim().toLowerCase();
  const board = url.searchParams.get("board")?.trim();
  const items = all.filter((item) => {
    if (item.tenantId !== bound.tenantId) return false;
    if (!helpVisibleToActor(actor, item)) return false;
    if (type && item.type !== type) return false;
    if (category && item.category.toLowerCase() !== category) return false;
    if (board === "work" && !isWorkHelpCategory(item.category)) return false;
    if (board === "help" && isWorkHelpCategory(item.category)) return false;
    return true;
  });
  return NextResponse.json({ tenantId: bound.tenantId, requests: items });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateHelp(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    type?: string;
    category?: string;
    title?: string;
    description?: string;
    createdBy?: string;
    ownerPersonId?: string;
    ownerId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const type = body.type?.trim() ?? "";
  if (!title || !description || !isHelpRequestType(type)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: body.tenantId,
    actorTenantSlug: gated.actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  const item = await createHelpRequestServer({
    tenantId: bound.tenantId,
    createdBy: gated.actor.personId,
    type: type as HelpRequestType,
    category: body.category,
    title,
    description,
    authorDisplayName:
      gated.actor.currentUser.displayName?.trim() ||
      gated.actor.currentUser.email?.split("@")[0] ||
      "Vecino",
    scope,
  });

  try {
    const { createCommunityNotification } = await import(
      "@/lib/community/server-community-repository"
    );
    await createCommunityNotification({
      tenantId: bound.tenantId,
      recipientPersonId: gated.actor.personId,
      kind: "post_published",
      title: "Ayuda publicada",
      body: item.title,
      entityType: "post",
      entityId: item.id,
      createdBy: gated.actor.personId,
      scope,
    });
  } catch {
    // Help remains authoritative even if Community Core notify fails.
  }

  return NextResponse.json({ request: item }, { status: 201 });
}
