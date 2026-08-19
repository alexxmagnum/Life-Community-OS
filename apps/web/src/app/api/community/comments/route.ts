import { NextResponse } from "next/server";
import { actorCanComment } from "@/lib/community/permissions";
import { addCommunityComment } from "@/lib/community/server-community-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanComment(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { postId?: string; eventId?: string; body?: string; tenantId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const text = body.body?.trim() ?? "";
  if (!text || (!body.postId && !body.eventId)) {
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
  const comment = await addCommunityComment({
    tenantId: bound.tenantId,
    authorPersonId: gated.actor.personId,
    authorDisplayName:
      gated.actor.currentUser.displayName?.trim() || "Vecino",
    body: text,
    postId: body.postId,
    eventId: body.eventId,
    scope,
  });
  return NextResponse.json({ comment }, { status: 201 });
}
