import { NextResponse } from "next/server";
import { actorCanViewCommunication } from "@/lib/communication/permissions";
import {
  CommunicationDeniedError,
  getConversationThreadServer,
} from "@/lib/communication/server-communication-repository";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const { resolveReadTenantId } = await import(
    "@/lib/tenant/resolve-read-tenant"
  );
  const actor = await resolveRequestActor(request);
  if (!actorCanViewCommunication(actor)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
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
  try {
    const thread = await getConversationThreadServer(
      bound.tenantId,
      id,
      actor,
      scope,
    );
    if (!thread) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof CommunicationDeniedError) {
      return NextResponse.json({ error: error.code }, { status: 403 });
    }
    throw error;
  }
}
