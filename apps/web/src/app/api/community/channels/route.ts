import { NextResponse } from "next/server";
import { guestCanAccess } from "@life-community-os/types";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import { CommunityCommunicationService } from "@/lib/community/community-communication-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import {
  defaultTerritoryIdForIdentity,
  identityTerritoriesForTenant,
} from "@/lib/tenant/territory-catalog";
import { resolveActiveTerritory } from "@life-community-os/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (!actor.authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (
    !actorCanReadCommunityExperienceFeed(actor) &&
    !guestCanAccess({
      resource: "open_content",
      hasActiveMembership: actor.hasMembership,
    })
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const bound = resolveReadTenantId({
    request,
    queryTenantId: url.searchParams.get("tenantId"),
    actor,
  });
  if ("error" in bound) return bound.error;
  const resolved = resolveActiveTerritory({
    tenantId: bound.tenantId,
    membershipTerritoryId: actor.territoryId,
    selectedTerritoryId: url.searchParams.get("territoryId"),
    defaultTerritoryId: defaultTerritoryIdForIdentity(bound.tenantId),
    territories: identityTerritoriesForTenant(bound.tenantId),
    capabilities: actor.permissions,
  });
  if (!resolved.ok || !resolved.context.territoryId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const communication = await CommunityCommunicationService.resolve({
    tenantId: bound.tenantId,
    actor,
    territoryId: resolved.context.territoryId,
  });
  return NextResponse.json({ channels: communication.channels });
}
