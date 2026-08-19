import { NextResponse } from "next/server";
import { actorCanReact } from "@/lib/community/permissions";
import { setCommunityReaction } from "@/lib/community/server-community-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanReact(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: {
    targetType?: "post" | "event" | "comment";
    targetId?: string;
    kind?: "acknowledge" | "support";
    tenantId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.targetId || !body.kind) {
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
  const reaction = await setCommunityReaction({
    tenantId: bound.tenantId,
    personId: gated.actor.personId,
    targetType: body.targetType ?? "post",
    targetId: body.targetId,
    kind: body.kind,
    scope,
  });
  return NextResponse.json({ reaction });
}
