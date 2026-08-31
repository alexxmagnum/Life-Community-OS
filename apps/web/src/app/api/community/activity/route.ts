import { NextResponse } from "next/server";
import { CommunityParticipationService } from "@/lib/community/community-participation-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
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
    const activity = await CommunityParticipationService.activity({
      tenantId: bound.tenantId,
      actor,
      scope,
    });
    return NextResponse.json({ activity });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
