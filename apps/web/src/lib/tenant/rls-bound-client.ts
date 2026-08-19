/**
 * User-scoped Supabase client (anon key + caller JWT).
 * RLS policies key off auth.uid() → identities → memberships.tenant_id.
 *
 * Disable only with SUPABASE_USE_RLS=0 (emergency). Default: on when a token exists.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { bindRequestRlsContext } from "@/lib/tenant/bind-rls-context";

export function isRlsClientEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const flag = env.SUPABASE_USE_RLS?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  return true;
}

export function createUserDatabaseClient(input: {
  accessToken: string;
}): SupabaseClient | null {
  if (!isRlsClientEnabled()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const token = input.accessToken.trim();
  if (!url || !anon || !token) return null;

  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function createRlsBoundDatabaseClient(input: {
  accessToken: string;
  tenantSlug: string;
  personId?: string | null;
}): Promise<SupabaseClient | null> {
  const client = createUserDatabaseClient({ accessToken: input.accessToken });
  if (!client) return null;
  if (input.personId?.trim()) {
    const bound = await bindRequestRlsContext(client, {
      personId: input.personId,
      tenantSlug: input.tenantSlug,
    });
    if (!bound.ok) {
      console.warn("[rls] bind failed", bound.error);
    }
  }
  return client;
}
