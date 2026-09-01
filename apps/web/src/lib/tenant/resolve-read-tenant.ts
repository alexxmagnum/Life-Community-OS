/**
 * Bind read tenantId to the actor's membership when authenticated.
 * Anonymous requests may read the host (allowlisted) tenant.
 */

import { NextResponse } from "next/server";
import type { RequestActor } from "@/lib/auth/request-actor";
import { resolveTenantPublicId } from "./ids";
import { resolveRequestTenantSlug } from "./resolve-request-tenant";
import { recordCrossTenantDenied } from "@/lib/platform/platform-operations-store";

export function resolveReadTenantId(input: {
  request: Request;
  queryTenantId?: string | null;
  actor: RequestActor;
}): { tenantId: string } | { error: NextResponse } {
  if (input.actor.tenantDenied) {
    return {
      error: NextResponse.json(
        { error: "tenant_forbidden" },
        { status: 403 },
      ),
    };
  }

  const requested = resolveTenantPublicId(
    input.queryTenantId?.trim() ||
      resolveRequestTenantSlug(input.request),
  );

  if (input.actor.authenticated && input.actor.hasMembership) {
    if (requested !== input.actor.tenantSlug) {
      recordCrossTenantDenied({
        actorTenantId: input.actor.tenantSlug,
        requestedTenantId: requested,
        actorPersonId: input.actor.personId ?? undefined,
      });
      return {
        error: NextResponse.json(
          { error: "tenant_forbidden" },
          { status: 403 },
        ),
      };
    }
    return { tenantId: input.actor.tenantSlug };
  }

  return { tenantId: requested };
}
