/**
 * Bind write tenantId to the request tenant — never trust body.tenantId alone.
 */

import { NextResponse } from "next/server";
import { resolveTenantPublicId } from "@/lib/tenant/ids";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";
import { recordCrossTenantDenied } from "@/lib/platform/platform-operations-store";

export function resolveWriteTenantId(input: {
  request: Request;
  bodyTenantId?: string | null;
  actorTenantSlug?: string | null;
  actorPersonId?: string | null;
}): { tenantId: string } | { error: NextResponse } {
  const fromRequest = resolveTenantPublicId(
    input.actorTenantSlug ||
      resolveRequestTenantSlug(input.request),
  );
  if (input.bodyTenantId?.trim()) {
    const fromBody = resolveTenantPublicId(input.bodyTenantId);
    if (fromBody !== fromRequest) {
      recordCrossTenantDenied({
        actorTenantId: fromRequest,
        requestedTenantId: fromBody,
        actorPersonId: input.actorPersonId ?? undefined,
      });
      return {
        error: NextResponse.json(
          { error: "cross_tenant_forbidden" },
          { status: 403 },
        ),
      };
    }
  }
  return { tenantId: fromRequest };
}
