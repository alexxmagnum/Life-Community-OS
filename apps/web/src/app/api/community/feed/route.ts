import { NextResponse } from "next/server";
import {
  actorCanViewCommunity,
} from "@/lib/community/permissions";
import {
  listCommunitySnapshot,
} from "@/lib/community/server-community-repository";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actorCanViewCommunity(actor)) {
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
  const snapshot = await listCommunitySnapshot(bound.tenantId, scope);
  return NextResponse.json({
    tenantId: bound.tenantId,
    posts: snapshot.posts.filter((item) => item.status === "published"),
    groups: snapshot.groups.filter((item) => item.status !== "archived"),
    events: snapshot.events.filter((item) => item.status === "published"),
    comments: snapshot.comments.filter((item) => item.status === "published"),
    reactions: snapshot.reactions,
  });
}
