/**
 * Bind Postgres GUC tenant context for RLS when using a non-service role client.
 * Service-role paths bypass RLS intentionally — call this before user-scoped queries.
 */

import {
  tenantSlugToTerritoryUuid,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ error: { message: string } | null }>;
};

export async function bindTenantRlsContext(
  client: RpcClient,
  tenantSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  const territoryUuid = tenantSlugToTerritoryUuid(tenantSlug);
  if (!tenantUuid || !territoryUuid) {
    return { ok: false, error: "unknown_tenant" };
  }
  const { error } = await client.rpc("app_set_tenant_context", {
    p_tenant_id: tenantUuid,
    p_territory_id: territoryUuid,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
