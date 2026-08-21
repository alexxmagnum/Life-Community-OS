import { NextResponse } from "next/server";
import { actorCanCreateConversation } from "@/lib/communication/permissions";
import {
  addParticipantServer,
  CommunicationDeniedError,
} from "@/lib/communication/server-communication-repository";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";
import { isConversationMemberRole } from "@life-community-os/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!actorCanCreateConversation(gated.actor) || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: {
    tenantId?: string;
    personId?: string;
    role?: string;
    displayName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const personId = body.personId?.trim() ?? "";
  if (!personId) {
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
    const rawRole = body.role ?? "participant";
    const participant = await addParticipantServer({
      tenantId: bound.tenantId,
      conversationId: id,
      actor: gated.actor,
      personId,
      role: isConversationMemberRole(rawRole) ? rawRole : "participant",
      displayName: body.displayName,
      scope,
    });
    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    if (error instanceof CommunicationDeniedError) {
      const status = error.code === "not_found" ? 404 : 403;
      return NextResponse.json({ error: error.code }, { status });
    }
    throw error;
  }
}
