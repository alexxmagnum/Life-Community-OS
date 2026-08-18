/**
 * Optional user-scoped Supabase client with RLS GUC bound.
 * Enable with SUPABASE_USE_RLS=1 and a caller JWT (access token).
 * Default repositories keep using service role (trusted server filter by tenant_id).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { bindTenantRlsContext } from "@/lib/tenant/bind-rls-context";

export async function createRlsBoundDatabaseClient(input: {
  accessToken: string;
  tenantSlug: string;
}): Promise<SupabaseClient | null> {
  if (
    process.env.SUPABASE_USE_RLS !== "1" &&
    process.env.SUPABASE_USE_RLS !== "true"
  ) {
    return null;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon || !input.accessToken.trim()) return null;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${input.accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const bound = await bindTenantRlsContext(client, input.tenantSlug);
  if (!bound.ok) {
    console.warn("[rls] bind failed", bound.error);
    return null;
  }
  return client;
}
