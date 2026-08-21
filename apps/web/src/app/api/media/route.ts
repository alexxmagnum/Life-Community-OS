import { NextResponse } from "next/server";
import {
  listEntityMediaServer,
  MediaDeniedError,
} from "@/lib/media/server-media-repository";
import { mediaErrorResponse } from "@/lib/media/http";
import { resolveWriteTenantId } from "@/lib/tenant/resolve-write-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated || !actor.hasMembership) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const bound = resolveWriteTenantId({
    request,
    bodyTenantId: url.searchParams.get("tenantId"),
    actorTenantSlug: actor.tenantSlug,
  });
  if ("error" in bound) return bound.error;
  const { persistenceScopeFromRequest } = await import(
    "@/lib/data/database-access"
  );
  const scope = persistenceScopeFromRequest(request, actor.personId);
  try {
    const items = await listEntityMediaServer({
      tenantId: bound.tenantId,
      actor,
      entityType: url.searchParams.get("entityType") ?? undefined,
      entityId: url.searchParams.get("entityId") ?? undefined,
      scope,
    });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof MediaDeniedError) return mediaErrorResponse(error);
    throw error;
  }
}
