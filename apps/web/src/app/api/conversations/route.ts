import { NextResponse } from "next/server";
import {
  actorCanCreateConversation,
  actorCanViewCommunication,
} from "@/lib/communication/permissions";
import {
  CommunicationDeniedError,
  findConversationByContextServer,
  findOrCreateConversationServer,
  listMyConversationsServer,
} from "@/lib/communication/server-communication-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { isConversationKind } from "@life-community-os/types";

export const runtime = "nodejs";

function deniedStatus(error: unknown): NextResponse | null {
  if (!(error instanceof CommunicationDeniedError)) return null;
  if (error.code === "unauthorized") {
    return NextResponse.json({ error: error.code }, { status: 401 });
  }
  if (error.code === "not_found") {
    return NextResponse.json({ error: error.code }, { status: 404 });
  }
  return NextResponse.json({ error: error.code }, { status: 403 });
}

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewCommunication(actor)) {
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
  const contextType = url.searchParams.get("contextType")?.trim();
  const contextId = url.searchParams.get("contextId")?.trim();
  try {
    if (contextType && contextId) {
      const thread = await findConversationByContextServer(
        bound.tenantId,
        contextType,
        contextId,
        actor,
        scope,
      );
      return NextResponse.json({
        tenantId: bound.tenantId,
        conversation: thread?.conversation ?? null,
        participants: thread?.participants ?? [],
        messages: thread?.messages ?? [],
      });
    }
    const conversations = await listMyConversationsServer(
      bound.tenantId,
      actor,
      scope,
    );
    return NextResponse.json({ tenantId: bound.tenantId, conversations });
  } catch (error) {
    const denied = deniedStatus(error);
    if (denied) return denied;
    throw error;
  }
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateConversation(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    type?: string;
    contextType?: string;
    contextId?: string;
    title?: string;
    participantPersonIds?: string[];
    createdBy?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const contextType = body.contextType?.trim() ?? "";
  const contextId = body.contextId?.trim() ?? "";
  const rawType = body.type?.trim() ?? "context";
  const type = isConversationKind(rawType) ? rawType : "context";
  if (!contextType || !contextId) {
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

  try {
    const thread = await findOrCreateConversationServer({
      tenantId: bound.tenantId,
      actor: gated.actor,
      type,
      contextType,
      contextId,
      title: body.title,
      participantPersonIds: body.participantPersonIds,
      displayNames: {
        [gated.actor.personId]: gated.actor.currentUser.displayName ?? "",
      },
      scope,
    });
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    const denied = deniedStatus(error);
    if (denied) return denied;
    throw error;
  }
}
