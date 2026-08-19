import { NextResponse } from "next/server";
import { actorCanCreatePost } from "@/lib/community/permissions";
import {
  createCommunityPost,
  createCommunityNotification,
} from "@/lib/community/server-community-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreatePost(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { title?: string; body?: string; kind?: string; tenantId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const title = body.title?.trim() ?? "";
  const text = body.body?.trim() ?? "";
  if (!title || !text) {
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
  const kind =
    body.kind === "discussion" ||
    body.kind === "announcement" ||
    body.kind === "proposal"
      ? body.kind
      : "member_update";
  const post = await createCommunityPost({
    tenantId: bound.tenantId,
    authorPersonId: gated.actor.personId,
    authorDisplayName:
      gated.actor.currentUser.displayName?.trim() ||
      gated.actor.currentUser.email?.split("@")[0] ||
      "Vecino",
    title,
    body: text,
    kind,
    scope,
  });
  await createCommunityNotification({
    tenantId: bound.tenantId,
    recipientPersonId: gated.actor.personId,
    kind: "post_published",
    title: "Publicación creada",
    body: post.title,
    entityType: "post",
    entityId: post.id,
    createdBy: gated.actor.personId,
    scope,
  });
  return NextResponse.json({ post }, { status: 201 });
}
