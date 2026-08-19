/**
 * Bind read tenantId to the actor's membership when authenticated.
 * Anonymous requests may read the host (allowlisted) tenant.
 */

import { NextResponse } from "next/server";
import type { RequestActor } from "@/lib/auth/request-actor";
import { resolveTenantPublicId } from "./ids";
import { resolveRequestTenantSlug } from "./resolve-request-tenant";

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
