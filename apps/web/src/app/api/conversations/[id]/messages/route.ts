import { NextResponse } from "next/server";
import { actorCanSendMessage } from "@/lib/communication/permissions";
import {
  CommunicationDeniedError,
  postMessageServer,
} from "@/lib/communication/server-communication-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanSendMessage(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: {
    tenantId?: string;
    content?: string;
    body?: string;
    replyToMessageId?: string;
    senderPersonId?: string;
    authorPersonId?: string;
    createdBy?: string;
    attachments?: Array<{
      kind?: string;
      fileName?: string;
      mimeType?: string;
      fileId?: string;
      url?: string;
    }>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const content = body.content?.trim() ?? body.body?.trim() ?? "";
  if (!content && !(body.attachments && body.attachments.length > 0)) {
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
    const message = await postMessageServer({
      tenantId: bound.tenantId,
      conversationId: id,
      actor: gated.actor,
      content,
      replyToMessageId: body.replyToMessageId,
      attachments: body.attachments,
      senderPersonId: body.senderPersonId ?? body.authorPersonId ?? body.createdBy,
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
    throw error;
  }
}
