import { NextResponse } from "next/server";
import { guestCanAccess } from "@life-community-os/types";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import { LifeHomeService } from "@/lib/community/life-home-service";
import { CommunityIntelligenceService } from "@/lib/community/community-intelligence-service";
import { CommunityCommunicationService } from "@/lib/community/community-communication-service";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
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
  const home = await LifeHomeService.fromRequest({
    tenantId: bound.tenantId,
    actor,
    queryTerritoryId: url.searchParams.get("territoryId"),
  });
  if (!home) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (
    home.membershipScope === "guest" &&
    !guestCanAccess({
      resource: "open_content",
      hasActiveMembership: false,
    })
  ) {
    return NextResponse.json({
      home: {
        territory: home.territory,
        moments: home.moments.slice(0, 3),
        currentActivities: [],
        upcomingActivities: [],
        places: [],
        actions: [],
        magicPlusEligible: false,
        membershipScope: "guest",
      },
    });
  }
  if (home.membershipScope === "pending") {
    return NextResponse.json({
      home: {
        ...home,
        places: [],
        currentActivities: [],
        upcomingActivities: [],
        magicPlusEligible: false,
      },
    });
  }
  const enriched = await CommunityIntelligenceService.enrichHome(home, {
    tenantId: bound.tenantId,
    actor,
    territoryId: home.territory.territoryId,
  });
  const withCommunication = await CommunityCommunicationService.enrichHome(
    enriched,
    {
      tenantId: bound.tenantId,
      actor,
      territoryId: home.territory.territoryId,
    },
  );
  return NextResponse.json({ home: withCommunication });
}
