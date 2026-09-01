import { NextResponse } from "next/server";
import { actorCanSendMessage } from "@/lib/communication/permissions";
import { CommunicationDeniedError } from "@/lib/communication/server-communication-repository";
import { CommunityCommunicationService } from "@/lib/community/community-communication-service";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanSendMessage(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: {
    tenantId?: string;
    territoryId?: string;
    conversationId?: string;
    contextType?: string;
    contextId?: string;
    channelId?: string;
    recipientId?: string;
    content?: string;
    body?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.recipientId || body.channelId) {
    return NextResponse.json({ error: "server_resolves_routing" }, { status: 400 });
  }
  const content = body.content?.trim() ?? body.body?.trim() ?? "";
  if (!content) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
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
    queryTerritoryId: body.territoryId ?? null,
  });
  if ("error" in territory) return territory.error;
  const territoryId = territory.context.territoryId;
  if (!territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, gated.actor.personId);
  try {
    const message = await CommunityCommunicationService.sendMessage({
      tenantId: bound.tenantId,
      actor: gated.actor,
      territoryId,
      conversationId: body.conversationId,
      contextType: body.contextType,
      contextId: body.contextId,
      content,
      scope,
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof CommunicationDeniedError) {
      const status =
        error.code === "not_found"
          ? 404
          : error.code === "unauthorized"
            ? 401
            : 403;
      return NextResponse.json({ error: error.code }, { status });
    }
    const message = error instanceof Error ? error.message : "error";
    const status =
      message === "not_found" ? 404 : message === "invalid" ? 400 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
