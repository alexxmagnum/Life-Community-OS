/**
 * Bind Postgres tenant context for SQL sessions (GUC).
 *
 * PostgREST issues one transaction per HTTP call, so rpc() then from()
 * does not keep GUCs. JWT policies (auth.uid() → memberships) enforce
 * isolation on each REST call. These RPCs remain for SQL sessions and
 * membership resolution.
 */

import {
  tenantSlugToUuid,
} from "@/lib/tenant/ids";

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ error: { message: string } | null }>;
};

export async function bindRequestRlsContext(
  client: RpcClient,
  input: { personId: string; tenantSlug: string },
): Promise<{ ok: boolean; error?: string }> {
  const tenantUuid = tenantSlugToUuid(input.tenantSlug);
  if (!tenantUuid || !input.personId.trim()) {
    return { ok: false, error: "unknown_tenant" };
  }
  const { error } = await client.rpc("app_bind_request_context", {
    p_person_id: input.personId,
    p_tenant_id: tenantUuid,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function bindPublicTenantRlsContext(
  client: RpcClient,
  tenantSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) {
    return { ok: false, error: "unknown_tenant" };
  }
  const { error } = await client.rpc("app_bind_public_tenant", {
    p_tenant_id: tenantUuid,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** @deprecated Use bindRequestRlsContext — open tenant setter is not granted to clients. */
export async function bindTenantRlsContext(
  client: RpcClient,
  tenantSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  return bindPublicTenantRlsContext(client, tenantSlug);
}
