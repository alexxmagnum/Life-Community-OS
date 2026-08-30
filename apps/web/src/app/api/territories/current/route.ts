import { NextResponse } from "next/server";
import {
  canSwitchTerritory,
  createTerritorySwitcher,
  resolveActiveTerritory,
} from "@life-community-os/types";
import {
  AUTH_COOKIE,
  selectedTerritoryIdFromRequest,
  setAuthCookie,
} from "@/lib/auth/session-cookies";
import { resolveReadTenantId } from "@/lib/tenant/resolve-read-tenant";
import {
  defaultTerritoryIdForIdentity,
  identityTerritoriesForTenant,
} from "@/lib/tenant/territory-catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { resolveRequestActor } = await import("@/lib/auth/request-actor");
  const actor = await resolveRequestActor(request);
  if (actor.tenantDenied) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const bound = resolveReadTenantId({
    request,
    actor,
  });
  if ("error" in bound) return bound.error;
  const territories = identityTerritoriesForTenant(bound.tenantId);
  const resolved = resolveActiveTerritory({
    tenantId: bound.tenantId,
    membershipTerritoryId: actor.territoryId,
    selectedTerritoryId: selectedTerritoryIdFromRequest(request),
    defaultTerritoryId: defaultTerritoryIdForIdentity(bound.tenantId),
    territories,
    capabilities: actor.permissions,
  });
  if (!resolved.ok) {
    return NextResponse.json(
      { error: "territory_forbidden" },
      { status: 403 },
    );
  }
  const { context } = resolved;
  const switcher = createTerritorySwitcher({
    tenantId: bound.tenantId,
    tenantName: territories[0]?.name ?? bound.tenantId,
    territories,
    activeTerritoryId: context.territoryId,
  });
  return NextResponse.json({
    tenantId: context.tenantId,
    territoryId: context.territoryId,
    name: context.territoryName,
    slug: context.slug,
    locale: context.locale,
    timezone: context.timezone,
    bounds: context.bounds ?? null,
    capabilities: context.capabilities ?? actor.permissions,
    switcher,
  });
}

export async function POST(request: Request) {
  const { requireMutationActor } = await import("@/lib/auth/mutation-gate");
  const gated = await requireMutationActor(request);
  if ("error" in gated) return gated.error;
  if (!gated.actor.hasMembership || !gated.actor.personId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { territoryId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const requested = body.territoryId?.trim() ?? "";
  if (!requested) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const tenantId = gated.actor.tenantSlug;
  const territories = identityTerritoriesForTenant(tenantId);
  if (
    !canSwitchTerritory({
      tenantId,
      actorTenantId: tenantId,
      requestedTerritoryId: requested,
      territories,
    })
  ) {
    return NextResponse.json(
      { error: "territory_forbidden" },
      { status: 403 },
    );
  }

  const resolved = resolveActiveTerritory({
    tenantId,
    membershipTerritoryId: gated.actor.territoryId,
    selectedTerritoryId: requested,
    defaultTerritoryId: defaultTerritoryIdForIdentity(tenantId),
    territories,
    capabilities: gated.actor.permissions,
  });
  if (!resolved.ok) {
    return NextResponse.json(
      { error: "territory_forbidden" },
      { status: 403 },
    );
  }

  const response = NextResponse.json({
    tenantId: resolved.context.tenantId,
    territoryId: resolved.context.territoryId,
    name: resolved.context.territoryName,
    slug: resolved.context.slug,
    locale: resolved.context.locale,
    timezone: resolved.context.timezone,
    bounds: resolved.context.bounds ?? null,
    capabilities: resolved.context.capabilities ?? gated.actor.permissions,
  });
  setAuthCookie(response, AUTH_COOKIE.territory, requested, 60 * 60 * 24 * 30, false);
  return response;
}
